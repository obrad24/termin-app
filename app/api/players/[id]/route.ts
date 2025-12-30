import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

// Onemogući cache-ovanje - osvježavaj podatke svaki put
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET - Dobijanje podataka o igraču sa statistikama
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id: idParam } = await params
    const id = parseInt(idParam, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    // Dobijanje podataka o igraču
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('id', id)
      .single()

    if (playerError || !player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
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

    // Brojanje golova - samo za postojeće mečeve
    const { data: goals, error: goalsError } = await supabase
      .from('match_goals')
      .select('id, result_id')
      .eq('player_id', id)
      .not('result_id', 'is', null)

    // Filtriraj golove samo za postojeće mečeve
    const validGoals = goals?.filter(goal => {
      const resultId = typeof goal.result_id === 'string' 
        ? parseInt(goal.result_id, 10) 
        : goal.result_id
      return resultId != null && !isNaN(resultId) && existingResultIds.has(resultId)
    }) || []

    const goalsCount = validGoals.length

    // Brojanje odigranih mečeva - samo za postojeće mečeve
    const { data: matchPlayers, error: matchPlayersError } = await supabase
      .from('match_players')
      .select('result_id')
      .eq('player_id', id)
      .not('result_id', 'is', null)

    // Filtriraj match_players samo za postojeće mečeve
    const validMatchPlayers = matchPlayers?.filter(mp => {
      const resultId = typeof mp.result_id === 'string' 
        ? parseInt(mp.result_id, 10) 
        : mp.result_id
      return resultId != null && !isNaN(resultId) && existingResultIds.has(resultId)
    }) || []

    const uniqueMatches = new Set(validMatchPlayers.map(mp => mp.result_id))
    const matchesPlayed = uniqueMatches.size

    // Dobijanje detalja o golovima - samo za postojeće mečeve
    const { data: goalsData, error: goalsDataError } = await supabase
      .from('match_goals')
      .select('id, goal_minute, team_type, result_id')
      .eq('player_id', id)
      .not('result_id', 'is', null)

    // Dobijanje informacija o utakmicama - samo za postojeće mečeve
    let goalsWithMatches: any[] = []
    if (goalsData && goalsData.length > 0) {
      // Filtriraj golove samo za postojeće mečeve
      const validGoalsData = goalsData.filter(goal => {
        const resultId = typeof goal.result_id === 'string' 
          ? parseInt(goal.result_id, 10) 
          : goal.result_id
        return resultId != null && !isNaN(resultId) && existingResultIds.has(resultId)
      })

      if (validGoalsData.length > 0) {
        const resultIds = [...new Set(validGoalsData.map(g => g.result_id))]
        const { data: resultsData } = await supabase
          .from('results')
          .select('id, home_team, away_team, home_score, away_score, date')
          .in('id', resultIds)
          .order('date', { ascending: false })

        goalsWithMatches = validGoalsData.map(goal => ({
          ...goal,
          results: resultsData?.find(r => r.id === goal.result_id) || null,
        })).filter(goal => goal.results !== null).sort((a, b) => {
          if (!a.results || !b.results) return 0
          return new Date(b.results.date).getTime() - new Date(a.results.date).getTime()
        })
      }
    }

    const response = NextResponse.json({
      ...player,
      goals: goalsCount,
      matches_played: matchesPlayed,
      goals_details: goalsWithMatches,
    })
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

// DELETE - brisanje igrača
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    // Provera autentifikacije
    const authCheck = await requireAuth()
    if (authCheck.error) {
      return authCheck.response
    }

    const { id: idParam } = await params
    const body = await request.json()

    const id = parseInt(idParam, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const { error } = await supabase.from('players').delete().eq('id', id)

    if (error) {
      console.error('Error deleting player:', error)
      return NextResponse.json({ error: 'Failed to delete player', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

// PUT - Ažuriranje igrača (admin)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error: 'Supabase not configured',
          message: 'Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables',
        },
        { status: 503 }
      )
    }

    // Provera autentifikacije
    const authCheck = await requireAuth()
    if (authCheck.error) {
      return authCheck.response
    }

    const { id: idParam } = await params
    const body = await request.json()
    const { 
      first_name, 
      last_name, 
      birth_year, 
      team, 
      image_url,
      pace,
      shooting,
      passing,
      dribbling,
      defending,
      physical,
      stamina,
      injury
    } = body

    const id = parseInt(idParam, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    if (!first_name || !last_name || !birth_year) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const year = parseInt(String(birth_year), 10)
    if (isNaN(year)) {
      return NextResponse.json({ error: 'Invalid birth year' }, { status: 400 })
    }

    // Validacija ocena (0-100)
    const validateRating = (rating: any): number | null => {
      if (rating === null || rating === undefined || rating === '') return null
      const num = parseInt(String(rating), 10)
      if (isNaN(num) || num < 0 || num > 100) return null
      return num
    }

    const { data, error } = await supabase
      .from('players')
      .update({
        first_name,
        last_name,
        birth_year: year,
        team: team || null,
        image_url: image_url || null,
        pace: validateRating(pace),
        shooting: validateRating(shooting),
        passing: validateRating(passing),
        dribbling: validateRating(dribbling),
        defending: validateRating(defending),
        physical: validateRating(physical),
        stamina: validateRating(stamina),
        injury: injury === true || injury === 'true' ? true : (injury === false || injury === 'false' ? false : null),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating player:', error)
      return NextResponse.json(
        { error: 'Failed to update player', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

