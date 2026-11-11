import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const { id: idParam } = await params
    const playerId = parseInt(idParam, 10)
    if (isNaN(playerId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const seasonIdParam = searchParams.get('season_id')
    const seasonId = seasonIdParam ? parseInt(seasonIdParam, 10) : null

    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('id, first_name, last_name, team, image_url, birth_year')
      .eq('id', playerId)
      .single()

    if (playerError || !player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    let team = player.team || null
    if (seasonId && !isNaN(seasonId)) {
      const { data: seasonTeam } = await supabase
        .from('player_season_teams')
        .select('team')
        .eq('player_id', playerId)
        .eq('season_id', seasonId)
        .maybeSingle()
      if (seasonTeam?.team) team = seasonTeam.team
    }

    let pointsQuery = supabase
      .from('fantasy_match_points')
      .select('*')
      .eq('player_id', playerId)
      .order('gameweek', { ascending: true })

    if (seasonId && !isNaN(seasonId)) {
      pointsQuery = pointsQuery.eq('season_id', seasonId)
    }

    const { data: pointsRows, error: pointsError } = await pointsQuery
    if (pointsError) {
      return NextResponse.json({ error: pointsError.message }, { status: 500 })
    }

    const resultIds = [...new Set((pointsRows || []).map((r: any) => r.result_id))]
    let resultsById = new Map<number, any>()
    if (resultIds.length > 0) {
      const { data: results } = await supabase
        .from('results')
        .select('id, home_team, away_team, home_score, away_score, date')
        .in('id', resultIds)
      ;(results || []).forEach((r: any) => resultsById.set(r.id, r))
    }

    const history = (pointsRows || []).map((row: any) => {
      const match = resultsById.get(row.result_id)
      const isHome = row.team_type === 'home'
      return {
        ...row,
        match: match
          ? {
              id: match.id,
              date: match.date,
              home_team: match.home_team,
              away_team: match.away_team,
              home_score: match.home_score,
              away_score: match.away_score,
              opponent: isHome ? match.away_team : match.home_team,
              isHome,
            }
          : null,
      }
    })

    const total_points = history.reduce((s: number, r: any) => s + (r.total_points || 0), 0)
    const matches_played = history.length
    const goals = history.reduce((s: number, r: any) => s + (r.goals_scored || 0), 0)
    const lastGw = history.reduce((max: number, r: any) => Math.max(max, r.gameweek || 0), 0)
    const last_gw_points = history
      .filter((r: any) => r.gameweek === lastGw)
      .reduce((s: number, r: any) => s + (r.total_points || 0), 0)

    return NextResponse.json({
      player: {
        ...player,
        team,
        position: null,
      },
      totals: {
        total_points,
        matches_played,
        goals,
        avg_points: matches_played > 0 ? Math.round((total_points / matches_played) * 10) / 10 : 0,
        last_gameweek: lastGw || null,
        last_gw_points,
      },
      history,
    })
  } catch (error: any) {
    console.error('Fantasy player error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
