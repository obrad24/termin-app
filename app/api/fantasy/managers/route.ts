import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { parsePlayerIds } from '@/lib/player-auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function toId(value: unknown): number {
  const n = typeof value === 'string' ? parseInt(value, 10) : Number(value)
  return Number.isFinite(n) ? n : NaN
}

export async function GET(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const seasonIdParam = searchParams.get('season_id')
    const seasonId = seasonIdParam ? parseInt(seasonIdParam, 10) : null

    const { data: accounts, error: accountsError } = await supabase
      .from('player_accounts')
      .select('id, nickname, player_id')

    if (accountsError) {
      return NextResponse.json({ error: accountsError.message }, { status: 500 })
    }

    const { data: players } = await supabase
      .from('players')
      .select('id, first_name, last_name')

    const playerNameById = new Map<number, string>()
    ;(players || []).forEach((p: any) => {
      const id = toId(p.id)
      if (id) playerNameById.set(id, `${p.first_name} ${p.last_name}`.trim())
    })

    let squadsQuery = supabase
      .from('fantasy_user_squads')
      .select('account_id, season_id, gameweek, player_ids')
    if (seasonId && !Number.isNaN(seasonId)) {
      squadsQuery = squadsQuery.eq('season_id', seasonId)
    }
    const { data: squads } = await squadsQuery

    let pointsQuery = supabase
      .from('fantasy_match_points')
      .select('player_id, gameweek, total_points, season_id')
    if (seasonId && !Number.isNaN(seasonId)) {
      pointsQuery = pointsQuery.eq('season_id', seasonId)
    }
    const { data: points } = await pointsQuery

    const pointsByPlayerGw = new Map<string, number>()
    let lastGw = 0
    ;(points || []).forEach((row: any) => {
      const pid = toId(row.player_id)
      const gw = Number(row.gameweek) || 0
      if (!pid || !gw) return
      lastGw = Math.max(lastGw, gw)
      const key = `${pid}:${gw}`
      pointsByPlayerGw.set(key, (pointsByPlayerGw.get(key) || 0) + (Number(row.total_points) || 0))
    })

    type ManagerAgg = {
      account_id: number
      nickname: string
      manager_name: string
      team_name: string
      total_points: number
      last_gw_points: number
      gameweeks_played: number
    }

    const byAccount = new Map<number, ManagerAgg>()

    ;(accounts || []).forEach((acc: any) => {
      const accountId = toId(acc.id)
      if (!accountId) return
      const nickname = acc.nickname || 'Manager'
      const linkedName = playerNameById.get(toId(acc.player_id)) || nickname
      const possessive =
        /[sxz]$/i.test(nickname) ? `${nickname}'` : `${nickname}s`
      byAccount.set(accountId, {
        account_id: accountId,
        nickname,
        manager_name: linkedName,
        team_name: `${possessive} Fantasy team`,
        total_points: 0,
        last_gw_points: 0,
        gameweeks_played: 0,
      })
    })

    ;(squads || []).forEach((squad: any) => {
      const accountId = toId(squad.account_id)
      const gw = Number(squad.gameweek) || 0
      const manager = byAccount.get(accountId)
      if (!manager || !gw) return

      // Only score completed gameweeks
      if (lastGw && gw > lastGw) return

      const picked = parsePlayerIds(squad.player_ids)
      let gwPoints = 0
      picked.forEach((pid) => {
        gwPoints += pointsByPlayerGw.get(`${pid}:${gw}`) || 0
      })

      manager.total_points += gwPoints
      manager.gameweeks_played += 1
      if (lastGw && gw === lastGw) {
        manager.last_gw_points = gwPoints
      }
    })

    const leaderboard = Array.from(byAccount.values())
      .filter((m) => m.gameweeks_played > 0 || m.total_points !== 0)
      .sort((a, b) => {
        if (b.total_points !== a.total_points) return b.total_points - a.total_points
        if (b.last_gw_points !== a.last_gw_points) return b.last_gw_points - a.last_gw_points
        return a.nickname.localeCompare(b.nickname)
      })
      .map((m, index) => ({
        rank: index + 1,
        account_id: m.account_id,
        team_name: m.team_name,
        manager_name: m.manager_name,
        nickname: m.nickname,
        last_gw_points: m.last_gw_points,
        total_points: m.total_points,
        gameweeks_played: m.gameweeks_played,
      }))

    // If nobody scored yet, still show managers who have a saved squad (0 pts)
    if (leaderboard.length === 0) {
      const fallback = Array.from(byAccount.values())
        .map((m, index) => ({
          rank: index + 1,
          account_id: m.account_id,
          team_name: m.team_name,
          manager_name: m.manager_name,
          nickname: m.nickname,
          last_gw_points: 0,
          total_points: 0,
          gameweeks_played: 0,
        }))
        .sort((a, b) => a.nickname.localeCompare(b.nickname))
        .map((m, index) => ({ ...m, rank: index + 1 }))

      // Only include those with any squad
      const withSquad = new Set(
        (squads || []).map((s: any) => toId(s.account_id)).filter(Boolean),
      )
      const filtered = fallback.filter((m) => withSquad.has(m.account_id))

      return NextResponse.json({
        leaderboard: filtered,
        last_gameweek: lastGw || null,
      })
    }

    return NextResponse.json({
      leaderboard,
      last_gameweek: lastGw || null,
    })
  } catch (error: any) {
    console.error('Fantasy managers leaderboard error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
