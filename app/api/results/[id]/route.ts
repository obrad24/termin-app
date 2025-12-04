import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

// GET - Dobijanje jednog rezultata sa detaljima
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { 
          error: 'Supabase not configured',
          message: 'Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables'
        },
        { status: 503 }
      )
    }

    const { id: idParam } = await params
    const id = parseInt(idParam, 10)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid ID' },
        { status: 400 }
      )
    }

    // Dobijanje rezultata
    const { data: result, error: resultError } = await supabase
      .from('results')
      .select('*')
      .eq('id', id)
      .single()

    if (resultError) {
      console.error('Error fetching result:', resultError)
      return NextResponse.json(
        { error: 'Failed to fetch result', details: resultError.message },
        { status: 500 }
      )
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Result not found' },
        { status: 404 }
      )
    }

    // Dobijanje strijelaca
    const { data: goals, error: goalsError } = await supabase
      .from('match_goals')
      .select('*')
      .eq('result_id', id)

    if (goalsError) {
      console.error('Error fetching goals:', goalsError)
    }

    // Dobijanje igrača koji su igrali
    const { data: matchPlayers, error: playersError } = await supabase
      .from('match_players')
      .select('*')
      .eq('result_id', id)

    if (playersError) {
      console.error('Error fetching match players:', playersError)
    }

    // Dobijanje informacija o igračima za strijelce
    let goalsWithPlayers = []
    if (goals && goals.length > 0) {
      const playerIds = [...new Set(goals.map(g => g.player_id))]
      const { data: playersData } = await supabase
        .from('players')
        .select('*')
        .in('id', playerIds)

      goalsWithPlayers = goals.map(goal => ({
        ...goal,
        players: playersData?.find(p => p.id === goal.player_id) || null
      }))
    }

    // Dobijanje informacija o igračima koji su igrali
    let matchPlayersWithPlayers = []
    if (matchPlayers && matchPlayers.length > 0) {
      const playerIds = [...new Set(matchPlayers.map(mp => mp.player_id))]
      const { data: playersData } = await supabase
        .from('players')
        .select('*')
        .in('id', playerIds)

      matchPlayersWithPlayers = matchPlayers.map(mp => ({
        ...mp,
        players: playersData?.find(p => p.id === mp.player_id) || null
      }))
    }

    return NextResponse.json({
      ...result,
      goals: goalsWithPlayers,
      players: matchPlayersWithPlayers,
    })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Brisanje rezultata (admin)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Provera da li je Supabase konfigurisan
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { 
          error: 'Supabase not configured',
          message: 'Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables'
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

    const id = parseInt(idParam, 10)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid ID' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('results')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting result:', error)
      return NextResponse.json(
        { error: 'Failed to delete result', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Ažuriranje rezultata (admin)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { 
          error: 'Supabase not configured',
          message: 'Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables'
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
    const { home_team, away_team, home_score, away_score, date } = body

    const id = parseInt(idParam, 10)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid ID' },
        { status: 400 }
      )
    }

    if (!home_team || !away_team || home_score === undefined || away_score === undefined || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('results')
      .update({
        home_team,
        away_team,
        home_score: parseInt(home_score),
        away_score: parseInt(away_score),
        date,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating result:', error)
      return NextResponse.json(
        { error: 'Failed to update result', details: error.message },
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
