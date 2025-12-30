import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

// Onemogući cache-ovanje - osvježavaj podatke svaki put
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET - Statistike za sve igrače (golovi i odigrani mečevi)
export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error: 'Supabase not configured',
          message: 'Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables',
        },
        { status: 503 },
      )
    }

    // Dobijanje svih igrača
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*')
      .order('last_name', { ascending: true })

    if (playersError) {
      console.error('Error fetching players:', playersError)
      return NextResponse.json(
        { error: 'Failed to fetch players', details: playersError.message },
        { status: 500 },
      )
    }

    if (!players || players.length === 0) {
      return NextResponse.json([])
    }

    // Prvo dobijamo sve postojeće rezultate (mečeve)
    const { data: existingResults, error: resultsError } = await supabase
      .from('results')
      .select('id')

    if (resultsError) {
      console.error('Error fetching results:', resultsError)
    }

    // Kreiraj Set sa ID-ovima postojećih rezultata za brže provere
    const existingResultIds = new Set<number>()
    if (existingResults) {
      existingResults.forEach((result: any) => {
        const resultId = typeof result.id === 'string' 
          ? parseInt(result.id, 10) 
          : result.id
        if (resultId != null && !isNaN(resultId) && typeof resultId === 'number') {
          existingResultIds.add(resultId)
        }
      })
    }

    // Dobijanje svih golova samo za postojeće mečeve
    const { data: allGoals, error: goalsError } = await supabase
      .from('match_goals')
      .select('player_id, result_id')
      .not('player_id', 'is', null)
      .not('result_id', 'is', null)

    if (goalsError) {
      console.error('Error fetching goals:', goalsError)
    }

    // Brojanje golova po igraču - samo za postojeće mečeve
    const goalsByPlayer: Record<number, number> = {}
    if (allGoals) {
      allGoals.forEach((goal) => {
        // Proveri da li meč još uvek postoji
        const resultId = typeof goal.result_id === 'string' 
          ? parseInt(goal.result_id, 10) 
          : goal.result_id
        
        if (resultId != null && !isNaN(resultId) && existingResultIds.has(resultId)) {
          // Filtriraj samo validne player_id vrednosti (brojevi, ne null/undefined)
          const playerId = typeof goal.player_id === 'string' 
            ? parseInt(goal.player_id, 10) 
            : goal.player_id
          
          if (playerId != null && !isNaN(playerId) && typeof playerId === 'number') {
            goalsByPlayer[playerId] = (goalsByPlayer[playerId] || 0) + 1
          }
        }
      })
    }

    // Dobijanje svih igrača koji su igrali
    const { data: allMatchPlayers, error: matchPlayersError } = await supabase
      .from('match_players')
      .select('player_id')
      .not('player_id', 'is', null)

    if (matchPlayersError) {
      console.error('Error fetching match players:', matchPlayersError)
    }

    // Brojanje odigranih mečeva po igraču (brojimo unique result_id za svakog igrača)
    const matchesByPlayer: Record<number, Set<number>> = {}
    if (allMatchPlayers) {
      // Prvo dobijamo sve match_players sa result_id
      const { data: matchPlayersWithResults, error: matchPlayersWithResultsError } = await supabase
        .from('match_players')
        .select('player_id, result_id')
        .not('player_id', 'is', null)
        .not('result_id', 'is', null)

      if (!matchPlayersWithResultsError && matchPlayersWithResults) {
        matchPlayersWithResults.forEach((mp: any) => {
          // Proveri da li meč još uvek postoji
          const resultId = typeof mp.result_id === 'string' 
            ? parseInt(mp.result_id, 10) 
            : mp.result_id
          
          if (resultId != null && !isNaN(resultId) && existingResultIds.has(resultId)) {
            // Filtriraj samo validne player_id vrednosti
            const playerId = typeof mp.player_id === 'string' 
              ? parseInt(mp.player_id, 10) 
              : mp.player_id
            
            if (playerId != null && !isNaN(playerId) && typeof playerId === 'number') {
              if (!matchesByPlayer[playerId]) {
                matchesByPlayer[playerId] = new Set()
              }
              matchesByPlayer[playerId].add(resultId)
            }
          }
        })
      }
    }

    // Kombinovanje podataka sa ocenama
    const playersWithStats = players.map((player) => {
      // Izračunaj prosečnu ocenu
      const ratings = [
        player.pace,
        player.shooting,
        player.passing,
        player.dribbling,
        player.defending,
        player.physical,
        player.stamina,
      ].filter((r): r is number => r !== null && r !== undefined)
      
      const averageRating = ratings.length > 0
        ? Math.round(ratings.reduce((sum, r) => sum + r, 0) / ratings.length)
        : null

      return {
        ...player,
        injury: player.injury === true || player.injury === 'true' ? true : (player.injury === false || player.injury === 'false' ? false : null),
        goals: goalsByPlayer[player.id] || 0,
        matches_played: matchesByPlayer[player.id]?.size || 0,
        average_rating: averageRating,
      }
    })

    const response = NextResponse.json(playersWithStats)
    // Dodaj headere da se osigura da se ne cache-uje
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    return response
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

