import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import {
  MAX_BUDGET,
  MAX_PLAYERS_PER_TEAM,
  MAX_TRANSFERS_PER_GW,
  SQUAD_SIZE,
  countTransfers,
  findTeamLimitViolation,
  getNextGameweek,
  parsePlayerIds,
  requirePlayerAuth,
  samePlayerIds,
} from '@/lib/player-auth'
import { isGameweekLocked } from '@/lib/fantasy/calculate'
import { getTransferWindowStatus } from '@/lib/fantasy/transfer-window'

function squadCost(players: Array<{ price?: number | null }>) {
  return players.reduce((sum, p) => sum + (Number(p.price) || 0), 0)
}

async function resolveSquadLock(seasonId: number, gameweek: number) {
  const window = getTransferWindowStatus()
  const adminLocked = await isGameweekLocked(seasonId, gameweek)
  const locked = adminLocked || window.locked
  return {
    locked,
    admin_locked: adminLocked,
    schedule_locked: window.locked,
    transfer_window: window,
  }
}

export const dynamic = 'force-dynamic'

function parseSeasonId(request: Request): number | null {
  const { searchParams } = new URL(request.url)
  const raw = searchParams.get('season_id')
  if (!raw) return null
  const n = parseInt(raw, 10)
  return Number.isNaN(n) ? null : n
}

function normalizePlayerRow(p: any) {
  const priceRaw = p.price
  const price =
    priceRaw === null || priceRaw === undefined || priceRaw === ''
      ? null
      : Number(priceRaw)
  return {
    id: typeof p.id === 'string' ? parseInt(p.id, 10) : Number(p.id),
    first_name: p.first_name,
    last_name: p.last_name,
    team: p.team ?? null,
    image_url: p.image_url ?? null,
    price: price != null && !Number.isNaN(price) ? price : null,
  }
}

async function loadPlayersByIds(ids: number[]) {
  if (ids.length === 0) return []
  const { data } = await supabase
    .from('players')
    .select('id, first_name, last_name, team, image_url, price')
    .in('id', ids)
  const byId = new Map((data || []).map((p: any) => [normalizePlayerRow(p).id, normalizePlayerRow(p)]))
  return ids.map((id) => byId.get(id)).filter(Boolean)
}

export async function GET(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const auth = await requirePlayerAuth()
    if (auth.error) return auth.response!

    const seasonId = parseSeasonId(request)
    if (!seasonId) {
      return NextResponse.json({ error: 'season_id required' }, { status: 400 })
    }

    const gameweek = await getNextGameweek(seasonId)
    const lock = await resolveSquadLock(seasonId, gameweek)

    const { data: currentRow } = await supabase
      .from('fantasy_user_squads')
      .select('*')
      .eq('account_id', auth.session!.accountId)
      .eq('season_id', seasonId)
      .eq('gameweek', gameweek)
      .maybeSingle()

    const currentIds = parsePlayerIds(currentRow?.player_ids)

    const { data: prevRow } = await supabase
      .from('fantasy_user_squads')
      .select('*')
      .eq('account_id', auth.session!.accountId)
      .eq('season_id', seasonId)
      .eq('gameweek', gameweek - 1)
      .maybeSingle()

    const previousIds = parsePlayerIds(prevRow?.player_ids)
    const transfersUsed = currentIds.length
      ? countTransfers(previousIds.length ? previousIds : currentIds, currentIds)
      : 0
    // If previous exists, free transfers remaining vs previous; else free initial pick
    const hasPrevious = previousIds.length === SQUAD_SIZE
    const transfersRemaining = hasPrevious
      ? Math.max(0, MAX_TRANSFERS_PER_GW - (currentIds.length ? countTransfers(previousIds, currentIds) : 0))
      : SQUAD_SIZE

    const { data: allPlayers } = await supabase
      .from('players')
      .select('id, first_name, last_name, team, image_url, price')
      .order('last_name', { ascending: true })

    const seasonalTeamByPlayer = new Map<number, string | null>()
    {
      const { data: seasonalTeams } = await supabase
        .from('player_season_teams')
        .select('player_id, team')
        .eq('season_id', seasonId)
      ;(seasonalTeams || []).forEach((row: any) => {
        const pid =
          typeof row.player_id === 'string' ? parseInt(row.player_id, 10) : Number(row.player_id)
        if (Number.isFinite(pid)) seasonalTeamByPlayer.set(pid, row.team || null)
      })
    }

    const withSeasonTeam = (p: ReturnType<typeof normalizePlayerRow>) =>
      seasonalTeamByPlayer.has(p.id)
        ? { ...p, team: seasonalTeamByPlayer.get(p.id) ?? null }
        : p

    const currentPlayers = (await loadPlayersByIds(currentIds)).map(withSeasonTeam)
    const spent = squadCost(currentPlayers as any[])
    const teamViolation = findTeamLimitViolation(currentPlayers, MAX_PLAYERS_PER_TEAM)

    return NextResponse.json({
      season_id: seasonId,
      gameweek,
      locked: lock.locked,
      admin_locked: lock.admin_locked,
      schedule_locked: lock.schedule_locked,
      transfer_window: lock.transfer_window,
      squad_size: SQUAD_SIZE,
      max_transfers: MAX_TRANSFERS_PER_GW,
      max_per_team: MAX_PLAYERS_PER_TEAM,
      max_budget: MAX_BUDGET,
      budget_spent: Math.round(spent * 10) / 10,
      budget_remaining: Math.round((MAX_BUDGET - spent) * 10) / 10,
      has_previous_squad: hasPrevious,
      transfers_used: hasPrevious && currentIds.length ? countTransfers(previousIds, currentIds) : 0,
      transfers_remaining: hasPrevious
        ? Math.max(0, MAX_TRANSFERS_PER_GW - (currentIds.length ? countTransfers(previousIds, currentIds) : 0))
        : null,
      free_initial_pick: !hasPrevious,
      player_ids: currentIds,
      players: currentPlayers,
      previous_player_ids: previousIds,
      available_players: (allPlayers || []).map(normalizePlayerRow).map(withSeasonTeam),
      updated_at: currentRow?.updated_at || null,
      transfersRemaining,
      team_limit_ok: !teamViolation,
      team_limit_warning: teamViolation
        ? `Your squad has ${teamViolation.count} players from ${teamViolation.team}. Max is ${MAX_PLAYERS_PER_TEAM} — fix with transfers before the next change.`
        : null,
    })
  } catch (error: any) {
    console.error('my-team GET:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const auth = await requirePlayerAuth()
    if (auth.error) return auth.response!

    const body = await request.json()
    const seasonId = body.season_id ? parseInt(String(body.season_id), 10) : null
    if (!seasonId || Number.isNaN(seasonId)) {
      return NextResponse.json({ error: 'season_id required' }, { status: 400 })
    }

    const playerIds = [...new Set(parsePlayerIds(body.player_ids))]
    if (playerIds.length !== SQUAD_SIZE) {
      return NextResponse.json(
        { error: `Select exactly ${SQUAD_SIZE} players` },
        { status: 400 },
      )
    }

    const gameweek = await getNextGameweek(seasonId)
    const lock = await resolveSquadLock(seasonId, gameweek)
    if (lock.locked) {
      return NextResponse.json(
        {
          error: lock.schedule_locked
            ? 'Transfers locked from Thursday 16:00 until Friday 12:00'
            : `GW${gameweek} is locked`,
          locked: true,
          schedule_locked: lock.schedule_locked,
          transfer_window: lock.transfer_window,
        },
        { status: 403 },
      )
    }

    // Validate players exist + load prices/teams
    const { data: found } = await supabase
      .from('players')
      .select('id, price, team')
      .in('id', playerIds)
    if ((found || []).length !== SQUAD_SIZE) {
      return NextResponse.json({ error: 'One or more players not found' }, { status: 400 })
    }

    const normalizedFound = (found || []).map(normalizePlayerRow)

    // Prefer seasonal club names when available
    const { data: seasonalTeams } = await supabase
      .from('player_season_teams')
      .select('player_id, team')
      .eq('season_id', seasonId)
      .in('player_id', playerIds)

    if (seasonalTeams?.length) {
      const teamByPlayer = new Map<number, string | null>()
      seasonalTeams.forEach((row: any) => {
        const pid =
          typeof row.player_id === 'string' ? parseInt(row.player_id, 10) : Number(row.player_id)
        if (Number.isFinite(pid)) teamByPlayer.set(pid, row.team || null)
      })
      normalizedFound.forEach((p) => {
        if (teamByPlayer.has(p.id)) p.team = teamByPlayer.get(p.id) ?? null
      })
    }

    const { data: currentGwRow } = await supabase
      .from('fantasy_user_squads')
      .select('*')
      .eq('account_id', auth.session!.accountId)
      .eq('season_id', seasonId)
      .eq('gameweek', gameweek)
      .maybeSingle()

    const currentGwIds = parsePlayerIds(currentGwRow?.player_ids)
    const unchangedSquad = samePlayerIds(currentGwIds, playerIds)

    // Grandfather pre-limit squads: keep them if unchanged.
    // Any edited squad must satisfy max-per-team.
    const teamViolation = findTeamLimitViolation(normalizedFound, MAX_PLAYERS_PER_TEAM)
    if (teamViolation && !unchangedSquad) {
      return NextResponse.json(
        {
          error: `Max ${MAX_PLAYERS_PER_TEAM} players from the same team (you have ${teamViolation.count} from ${teamViolation.team}). Existing over-limit squads are kept until you change them.`,
          max_per_team: MAX_PLAYERS_PER_TEAM,
          team: teamViolation.team,
          count: teamViolation.count,
        },
        { status: 400 },
      )
    }

    const spent = squadCost(normalizedFound)
    if (spent > MAX_BUDGET + 0.05) {
      return NextResponse.json(
        {
          error: `Budget exceeded: £${spent.toFixed(1)}m / £${MAX_BUDGET}m`,
          budget_spent: Math.round(spent * 10) / 10,
          max_budget: MAX_BUDGET,
        },
        { status: 400 },
      )
    }

    const { data: prevRow } = await supabase
      .from('fantasy_user_squads')
      .select('*')
      .eq('account_id', auth.session!.accountId)
      .eq('season_id', seasonId)
      .eq('gameweek', gameweek - 1)
      .maybeSingle()

    const previousIds = parsePlayerIds(prevRow?.player_ids)
    const hasPrevious = previousIds.length === SQUAD_SIZE
    const transfersUsed = hasPrevious ? countTransfers(previousIds, playerIds) : 0

    if (hasPrevious && transfersUsed > MAX_TRANSFERS_PER_GW) {
      return NextResponse.json(
        {
          error: `You can change max ${MAX_TRANSFERS_PER_GW} players this gameweek (tried ${transfersUsed})`,
          transfers_used: transfersUsed,
          max_transfers: MAX_TRANSFERS_PER_GW,
        },
        { status: 400 },
      )
    }

    const row = {
      account_id: auth.session!.accountId,
      season_id: seasonId,
      gameweek,
      player_ids: JSON.stringify(playerIds),
      transfers_used: transfersUsed,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('fantasy_user_squads')
      .upsert([row], { onConflict: 'account_id,season_id,gameweek' })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      gameweek,
      player_ids: playerIds,
      transfers_used: transfersUsed,
      players: await loadPlayersByIds(playerIds),
      squad: data,
    })
  } catch (error: any) {
    console.error('my-team PUT:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
