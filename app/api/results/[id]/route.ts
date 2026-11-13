import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { calculateFantasyForResult } from '@/lib/fantasy/calculate'

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

    const [{ data: goals, error: goalsError }, { data: matchPlayers, error: playersError }] =
      await Promise.all([
        supabase.from('match_goals').select('*').eq('result_id', id),
        supabase.from('match_players').select('*').eq('result_id', id),
      ])

    if (goalsError) {
      console.error('Error fetching goals:', goalsError)
    }
    if (playersError) {
      console.error('Error fetching match players:', playersError)
    }

    const goalPlayerIds = [...new Set((goals || []).map((g) => g.player_id).filter(Boolean))]
    const lineupPlayerIds = [
      ...new Set((matchPlayers || []).map((mp) => mp.player_id).filter(Boolean)),
    ]
    const allPlayerIds = [...new Set([...goalPlayerIds, ...lineupPlayerIds])]

    let playersById = new Map<any, any>()
    if (allPlayerIds.length > 0) {
      const { data: playersData } = await supabase.from('players').select('*').in('id', allPlayerIds)
      playersById = new Map((playersData || []).map((p: any) => [p.id, p]))
      // also index by string id for neon bigint quirks
      ;(playersData || []).forEach((p: any) => playersById.set(String(p.id), p))
    }

    const goalsWithPlayers = (goals || []).map((goal) => ({
      ...goal,
      players: playersById.get(goal.player_id) || playersById.get(String(goal.player_id)) || null,
    }))

    const matchPlayersWithPlayers = (matchPlayers || []).map((mp) => ({
      ...mp,
      players: playersById.get(mp.player_id) || playersById.get(String(mp.player_id)) || null,
    }))

    const fantasyPointsByPlayer: Record<number, number> = {}
    {
      const { data: fantasyRows, error: fantasyError } = await supabase
        .from('fantasy_match_points')
        .select('player_id, total_points')
        .eq('result_id', id)

      if (fantasyError) {
        if (!fantasyError.message?.includes('fantasy_match_points')) {
          console.warn('Failed to load fantasy points for match:', fantasyError.message)
        }
      } else {
        ;(fantasyRows || []).forEach((row: any) => {
          const pid =
            typeof row.player_id === 'string'
              ? parseInt(row.player_id, 10)
              : Number(row.player_id)
          if (!Number.isFinite(pid)) return
          fantasyPointsByPlayer[pid] =
            (fantasyPointsByPlayer[pid] || 0) + (Number(row.total_points) || 0)
        })
      }
    }

    const { jsonCached } = await import('@/lib/http-cache')
    return jsonCached(
      {
        ...result,
        goals: goalsWithPlayers,
        players: matchPlayersWithPlayers,
        fantasy_points: fantasyPointsByPlayer,
      },
      { seconds: 15 },
    )
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
    const {
      home_team,
      away_team,
      home_score,
      away_score,
      date,
      summary_comment,
      image_url,
    } = body

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

    const updateData: Record<string, unknown> = {
      home_team,
      away_team,
      home_score: parseInt(home_score),
      away_score: parseInt(away_score),
      date,
    }
    if (summary_comment !== undefined) {
      updateData.summary_comment =
        typeof summary_comment === 'string' && summary_comment.trim() !== ''
          ? summary_comment.trim()
          : null
    }
    if (image_url !== undefined) {
      updateData.image_url =
        typeof image_url === 'string' && image_url.trim() !== '' ? image_url.trim() : null
    }

    const { data, error } = await supabase
      .from('results')
      .update(updateData)
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

    try {
      await calculateFantasyForResult(id, {
        action: 'recalculate',
        message: `Auto-recalculated after updating match #${id}`,
      })
    } catch (fantasyError) {
      console.error('Fantasy calculation error:', fantasyError)
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
