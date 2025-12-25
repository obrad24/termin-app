import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

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

    // Brojanje golova
    const { data: goals, error: goalsError } = await supabase
      .from('match_goals')
      .select('id')
      .eq('player_id', id)

    const goalsCount = goals?.length || 0

    // Brojanje odigranih mečeva
    const { data: matchPlayers, error: matchPlayersError } = await supabase
      .from('match_players')
      .select('result_id')
      .eq('player_id', id)

    const uniqueMatches = new Set(matchPlayers?.map(mp => mp.result_id) || [])
    const matchesPlayed = uniqueMatches.size

    // Dobijanje detalja o golovima
    const { data: goalsData, error: goalsDataError } = await supabase
      .from('match_goals')
      .select('id, goal_minute, team_type, result_id')
      .eq('player_id', id)

    // Dobijanje informacija o utakmicama
    let goalsWithMatches: any[] = []
    if (goalsData && goalsData.length > 0) {
      const resultIds = [...new Set(goalsData.map(g => g.result_id))]
      const { data: resultsData } = await supabase
        .from('results')
        .select('id, home_team, away_team, home_score, away_score, date')
        .in('id', resultIds)
        .order('date', { ascending: false })

      goalsWithMatches = goalsData.map(goal => ({
        ...goal,
        results: resultsData?.find(r => r.id === goal.result_id) || null,
      })).sort((a, b) => {
        if (!a.results || !b.results) return 0
        return new Date(b.results.date).getTime() - new Date(a.results.date).getTime()
      })
    }

    return NextResponse.json({
      ...player,
      goals: goalsCount,
      matches_played: matchesPlayed,
      goals_details: goalsWithMatches,
    })
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
    const { first_name, last_name, birth_year, team, image_url } = body

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

    const { data, error } = await supabase
      .from('players')
      .update({
        first_name,
        last_name,
        birth_year: year,
        team: team || null,
        image_url: image_url || null,
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

