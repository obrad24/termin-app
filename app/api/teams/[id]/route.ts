import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

// GET - dobijanje podataka o timu sa igračima i strijelcima
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id: idParam } = await params
    const id = parseInt(idParam, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    // Dobijanje podataka o timu
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single()

    if (teamError || !team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Dobijanje igrača koji pripadaju tom timu
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('*')
      .eq('team', team.name)
      .order('last_name', { ascending: true })

    // Dobijanje svih rezultata gde je tim igrao (home ili away)
    const { data: results, error: resultsError } = await supabase
      .from('results')
      .select('*')
      .or(`home_team.eq.${team.name},away_team.eq.${team.name}`)
      .order('date', { ascending: false })

    // Dobijanje golova za taj tim
    let topScorers: Array<{ player_id: number; goals: number; player: any }> = []
    
    if (results && results.length > 0) {
      const resultIds = results.map(r => r.id)
      
      // Dobijanje svih golova za te rezultate
      const { data: allGoals, error: goalsError } = await supabase
        .from('match_goals')
        .select('*')
        .in('result_id', resultIds)

      if (allGoals && !goalsError) {
        // Filtriranje golova samo za ovaj tim i samo za postojeće mečeve
        const teamGoals = allGoals.filter((goal: any) => {
          // Proveri da li meč još uvek postoji
          const result = results.find(r => r.id === goal.result_id)
          if (!result) return false
          // Proveri da li je gol za ovaj tim
          if (goal.team_type === 'home' && result.home_team === team.name) return true
          if (goal.team_type === 'away' && result.away_team === team.name) return true
          return false
        })

        // Brojanje golova po igraču
        const goalsByPlayer: Record<number, number> = {}
        teamGoals.forEach((goal: any) => {
          goalsByPlayer[goal.player_id] = (goalsByPlayer[goal.player_id] || 0) + 1
        })

        // Dobijanje podataka o igračima koji su postigli golove
        const playerIds = Object.keys(goalsByPlayer).map(Number)
        if (playerIds.length > 0) {
          const { data: scorersData } = await supabase
            .from('players')
            .select('*')
            .in('id', playerIds)

          topScorers = Object.entries(goalsByPlayer)
            .map(([player_id, goals]) => ({
              player_id: parseInt(player_id),
              goals: goals as number,
              player: scorersData?.find(p => p.id === parseInt(player_id)) || null,
            }))
            .sort((a, b) => b.goals - a.goals)
            .slice(0, 10) // Top 10 strijelaca
        }
      }
    }

    return NextResponse.json({
      team,
      players: players || [],
      topScorers,
      matchesCount: results?.length || 0,
    })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - brisanje tima
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const id = parseInt(idParam, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const { error } = await supabase.from('teams').delete().eq('id', id)

    if (error) {
      console.error('Error deleting team:', error)
      return NextResponse.json({ error: 'Failed to delete team', details: error.message }, { status: 500 })
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

// PUT - Ažuriranje tima (admin)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const { name, short_name, logo_url } = body

    const id = parseInt(idParam, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    if (!name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('teams')
      .update({
        name,
        short_name: short_name || null,
        logo_url: logo_url || null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating team:', error)
      return NextResponse.json({ error: 'Failed to update team', details: error.message }, { status: 500 })
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
