import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { parsePlayerIds, getNextGameweek } from '@/lib/player-auth'
import { toId } from '@/lib/ids'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> },
) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const { accountId: accountIdParam } = await params
    const accountId = toId(accountIdParam)
    if (accountId == null) {
      return NextResponse.json({ error: 'Invalid account' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const seasonId = toId(searchParams.get('season_id'))

    const { data: account, error: accountError } = await supabase
      .from('player_accounts')
      .select('id, nickname, player_id')
      .eq('id', accountId)
      .maybeSingle()

    if (accountError) {
      return NextResponse.json({ error: accountError.message }, { status: 500 })
    }
    if (!account) {
      return NextResponse.json({ error: 'Manager not found' }, { status: 404 })
    }

    let squadsQuery = supabase
      .from('fantasy_user_squads')
      .select('account_id, season_id, gameweek, player_ids, captain_player_id')
      .eq('account_id', accountId)
      .order('gameweek', { ascending: false })

    if (seasonId != null) {
      squadsQuery = squadsQuery.eq('season_id', seasonId)
    }

    const { data: squads, error: squadsError } = await squadsQuery.limit(20)
    if (squadsError) {
      return NextResponse.json({ error: squadsError.message }, { status: 500 })
    }

    const nextGw = seasonId != null ? await getNextGameweek(seasonId) : null

    // Prefer current/open GW squad; otherwise latest saved
    let squad =
      nextGw != null
        ? (squads || []).find((s: any) => Number(s.gameweek) === nextGw) || null
        : null
    if (!squad && squads && squads.length > 0) {
      squad = squads[0]
    }

    const nickname = account.nickname || 'Manager'
    const possessive = /[sxz]$/i.test(nickname) ? `${nickname}'` : `${nickname}s`
    const teamName = `${possessive} Fantasy team`

    if (!squad) {
      return NextResponse.json({
        account_id: accountId,
        nickname,
        team_name: teamName,
        gameweek: nextGw,
        captain_player_id: null,
        players: [],
      })
    }

    const playerIds = parsePlayerIds(squad.player_ids)
    const captainId = toId(squad.captain_player_id)
    const gameweek = Number(squad.gameweek) || null

    let players: any[] = []
    if (playerIds.length > 0) {
      const { data: playerRows } = await supabase
        .from('players')
        .select('id, first_name, last_name, team, image_url, price')
        .in('id', playerIds)

      const seasonalTeamByPlayer: Record<number, string | null> = {}
      if (seasonId != null) {
        const { data: seasonalTeams } = await supabase
          .from('player_season_teams')
          .select('player_id, team')
          .eq('season_id', seasonId)
          .in('player_id', playerIds)

        ;(seasonalTeams || []).forEach((row: any) => {
          const pid = toId(row.player_id)
          if (pid != null) seasonalTeamByPlayer[pid] = row.team || null
        })
      }

      const byId = new Map<number, any>()
      ;(playerRows || []).forEach((p: any) => {
        const pid = toId(p.id)
        if (pid == null) return
        byId.set(pid, {
          id: pid,
          first_name: p.first_name,
          last_name: p.last_name,
          team:
            Object.prototype.hasOwnProperty.call(seasonalTeamByPlayer, pid)
              ? seasonalTeamByPlayer[pid]
              : p.team || null,
          image_url: p.image_url || null,
          price: p.price != null ? Number(p.price) : null,
          is_captain: captainId != null && pid === captainId,
        })
      })

      // Keep squad order
      players = playerIds.map((id) => byId.get(id)).filter(Boolean)
    }

    return NextResponse.json({
      account_id: accountId,
      nickname,
      team_name: teamName,
      gameweek,
      captain_player_id: captainId,
      players,
    })
  } catch (error: any) {
    console.error('Fantasy manager squad error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
