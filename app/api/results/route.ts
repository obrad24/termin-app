import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

// GET - Prikaz svih rezultata
export async function GET() {
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

    const { data, error } = await supabase
      .from('results')
      .select('*')
      .order('id', { ascending: false })

    if (error) {
      console.error('Error fetching results:', error)
      return NextResponse.json(
        { error: 'Failed to fetch results', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('Error:', error)
    
    // Proveri da li je timeout greška
    if (error.message?.includes('timeout') || error.message?.includes('TIMEOUT') || error.cause?.code === 'UND_ERR_CONNECT_TIMEOUT') {
      return NextResponse.json(
        { 
          error: 'Connection timeout',
          message: 'Supabase connection timed out. Please check your network connection and Supabase URL.',
          details: error.message,
          hint: 'Verify that NEXT_PUBLIC_SUPABASE_URL is correct and that your Supabase project is active.'
        },
        { status: 504 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Dodavanje novog rezultata (admin)
export async function POST(request: Request) {
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

    const body = await request.json()
    const { 
      home_team, 
      away_team, 
      home_score, 
      away_score, 
      date,
      odds_1,
      odds_x,
      odds_2,
      goals = [],
      players = []
    } = body

    // Validacija podataka
    if (!home_team || !away_team || home_score === undefined || away_score === undefined || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Kreiranje rezultata
    const { data: resultData, error: resultError } = await supabase
      .from('results')
      .insert([
        {
          home_team,
          away_team,
          home_score: parseInt(home_score),
          away_score: parseInt(away_score),
          date,
          odds_1: odds_1 ? parseFloat(odds_1) : null,
          odds_x: odds_x ? parseFloat(odds_x) : null,
          odds_2: odds_2 ? parseFloat(odds_2) : null,
        },
      ])
      .select()
      .single()

    if (resultError) {
      console.error('Error creating result:', resultError)
      return NextResponse.json(
        { error: 'Failed to create result', details: resultError.message },
        { status: 500 }
      )
    }

    const resultId = resultData.id

    // Dodavanje strijelaca ako postoje
    if (goals && goals.length > 0) {
      const goalsToInsert = goals.map((goal: any) => ({
        result_id: resultId,
        player_id: parseInt(goal.player_id),
        team_type: goal.team_type,
        goal_minute: goal.goal_minute ? parseInt(goal.goal_minute) : null,
      }))

      const { error: goalsError } = await supabase
        .from('match_goals')
        .insert(goalsToInsert)

      if (goalsError) {
        console.error('Error creating goals:', goalsError)
        // Ne vraćamo grešku, samo logujemo jer rezultat je već kreiran
      }
    }

    // Dodavanje igrača koji su igrali ako postoje
    if (players && players.length > 0) {
      const playersToInsert = players.map((player: any) => ({
        result_id: resultId,
        player_id: parseInt(player.player_id),
        team_type: player.team_type,
      }))

      const { error: playersError } = await supabase
        .from('match_players')
        .insert(playersToInsert)

      if (playersError) {
        console.error('Error creating match players:', playersError)
        // Ne vraćamo grešku, samo logujemo jer rezultat je već kreiran
      }
    }

    return NextResponse.json(resultData, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

