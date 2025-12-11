import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

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

    // Dobijanje svih golova
    const { data: allGoals, error: goalsError } = await supabase
      .from('match_goals')
      .select('player_id')

    if (goalsError) {
      console.error('Error fetching goals:', goalsError)
    }

    // Brojanje golova po igraču
    const goalsByPlayer: Record<number, number> = {}
    if (allGoals) {
      allGoals.forEach((goal) => {
        goalsByPlayer[goal.player_id] = (goalsByPlayer[goal.player_id] || 0) + 1
      })
    }

    // Dobijanje svih igrača koji su igrali
    const { data: allMatchPlayers, error: matchPlayersError } = await supabase
      .from('match_players')
      .select('player_id')

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

      if (!matchPlayersWithResultsError && matchPlayersWithResults) {
        matchPlayersWithResults.forEach((mp: any) => {
          if (!matchesByPlayer[mp.player_id]) {
            matchesByPlayer[mp.player_id] = new Set()
          }
          matchesByPlayer[mp.player_id].add(mp.result_id)
        })
      }
    }

    // Kombinovanje podataka
    const playersWithStats = players.map((player) => ({
      ...player,
      goals: goalsByPlayer[player.id] || 0,
      matches_played: matchesByPlayer[player.id]?.size || 0,
    }))

    return NextResponse.json(playersWithStats)
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

