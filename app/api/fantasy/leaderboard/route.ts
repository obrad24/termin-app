import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export const revalidate = 15

type SortKey = 'total' | 'last_gw' | 'avg' | 'goals'

export async function GET(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const seasonIdParam = searchParams.get('season_id')
    const seasonId = seasonIdParam ? parseInt(seasonIdParam, 10) : null
    const sort = (searchParams.get('sort') || 'total') as SortKey

    let playersQuery = supabase
      .from('players')
      .select('id, first_name, last_name, team, image_url')

    const { data: players, error: playersError } = await playersQuery
    if (playersError) {
      return NextResponse.json({ error: playersError.message }, { status: 500 })
    }

    let pointsQuery = supabase.from('fantasy_match_points').select('*')
    if (seasonId && !isNaN(seasonId)) {
      pointsQuery = pointsQuery.eq('season_id', seasonId)
    }

    const { data: points, error: pointsError } = await pointsQuery
    if (pointsError) {
      // Table may not exist yet
      if (pointsError.message?.includes('fantasy_match_points')) {
        return NextResponse.json({
          leaderboard: [],
          last_gameweek: null,
          message: 'Fantasy tables not initialized. Run fantasy-schema.sql',
        })
      }
      return NextResponse.json({ error: pointsError.message }, { status: 500 })
    }

    const toId = (value: unknown) => {
      const n = typeof value === 'string' ? parseInt(value, 10) : Number(value)
      return Number.isFinite(n) ? n : NaN
    }

    // Season team overrides
    const teamByPlayer = new Map<number, string | null>()
    ;(players || []).forEach((p: any) => {
      const id = toId(p.id)
      if (id) teamByPlayer.set(id, p.team || null)
    })

    if (seasonId && !isNaN(seasonId)) {
      const { data: seasonTeams } = await supabase
        .from('player_season_teams')
        .select('player_id, team')
        .eq('season_id', seasonId)
      ;(seasonTeams || []).forEach((row: any) => {
        const id = toId(row.player_id)
        if (id && row.team) teamByPlayer.set(id, row.team)
      })
    }

    const lastGw =
      (points || []).reduce(
        (max: number, row: any) => Math.max(max, Number(row.gameweek) || 0),
        0,
      ) || null

    type Agg = {
      player_id: number
      total_points: number
      matches_played: number
      goals: number
      last_gw_points: number
      avg_points: number
    }

    const agg = new Map<number, Agg>()

    ;(points || []).forEach((row: any) => {
      const playerId = toId(row.player_id)
      if (!playerId) return
      const current = agg.get(playerId) || {
        player_id: playerId,
        total_points: 0,
        matches_played: 0,
        goals: 0,
        last_gw_points: 0,
        avg_points: 0,
      }
      current.total_points += Number(row.total_points) || 0
      current.matches_played += 1
      current.goals += Number(row.goals_scored) || 0
      if (lastGw && Number(row.gameweek) === lastGw) {
        current.last_gw_points += Number(row.total_points) || 0
      }
      agg.set(playerId, current)
    })

    const leaderboard = (players || []).map((p: any) => {
      const playerId = toId(p.id)
      const a = agg.get(playerId)
      const matches = a?.matches_played || 0
      const total = a?.total_points || 0
      return {
        id: playerId,
        first_name: p.first_name,
        last_name: p.last_name,
        team: teamByPlayer.get(playerId) || null,
        image_url: p.image_url,
        total_points: total,
        matches_played: matches,
        goals: a?.goals || 0,
        avg_points: matches > 0 ? Math.round((total / matches) * 10) / 10 : 0,
        last_gw_points: a?.last_gw_points || 0,
      }
    })

    leaderboard.sort((a, b) => {
      if (sort === 'last_gw') {
        if (b.last_gw_points !== a.last_gw_points) return b.last_gw_points - a.last_gw_points
        if (b.total_points !== a.total_points) return b.total_points - a.total_points
      } else if (sort === 'avg') {
        if (b.avg_points !== a.avg_points) return b.avg_points - a.avg_points
        if (b.total_points !== a.total_points) return b.total_points - a.total_points
      } else if (sort === 'goals') {
        if (b.goals !== a.goals) return b.goals - a.goals
        if (b.total_points !== a.total_points) return b.total_points - a.total_points
      } else {
        if (b.total_points !== a.total_points) return b.total_points - a.total_points
      }
      return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
    })

    const { jsonCached } = await import('@/lib/http-cache')
    return jsonCached(
      {
        leaderboard,
        last_gameweek: lastGw,
        sort,
      },
      { seconds: 15 },
    )
  } catch (error: any) {
    console.error('Fantasy leaderboard error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
