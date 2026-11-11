import { supabase } from '@/lib/supabase'
import { scorePlayerMatch, BreakdownItem } from '@/lib/fantasy/scoring'

type ResultRow = {
  id: number
  home_team: string
  away_team: string
  home_score: number
  away_score: number
  date: string
  season_id?: number | null
}

async function logAction(params: {
  season_id?: number | null
  result_id?: number | null
  gameweek?: number | null
  action: string
  message?: string
  details?: Record<string, unknown>
}) {
  try {
    await supabase.from('fantasy_calc_logs').insert([
      {
        season_id: params.season_id ?? null,
        result_id: params.result_id ?? null,
        gameweek: params.gameweek ?? null,
        action: params.action,
        message: params.message ?? null,
        details: params.details ? JSON.stringify(params.details) : null,
      },
    ])
  } catch (error) {
    console.error('Fantasy log error:', error)
  }
}

/** Gameweek = 1-based index of match in season ordered by date, then id. */
export async function getGameweekForResult(
  result: ResultRow
): Promise<{ gameweek: number; seasonResults: ResultRow[] }> {
  let query = supabase
    .from('results')
    .select('id, home_team, away_team, home_score, away_score, date, season_id')
    .order('date', { ascending: true })
    .order('id', { ascending: true })

  if (result.season_id) {
    query = query.eq('season_id', result.season_id)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const seasonResults = (data || []) as ResultRow[]
  const index = seasonResults.findIndex((r) => r.id === result.id)
  const gameweek = index >= 0 ? index + 1 : seasonResults.length + 1
  return { gameweek, seasonResults }
}

export async function isGameweekLocked(
  seasonId: number | null | undefined,
  gameweek: number
): Promise<boolean> {
  if (!seasonId) return false
  const { data } = await supabase
    .from('fantasy_gameweek_locks')
    .select('locked')
    .eq('season_id', seasonId)
    .eq('gameweek', gameweek)
    .maybeSingle()
  return !!(data && data.locked)
}

/**
 * Calculate and persist fantasy points for all players who appeared in a match.
 * Preserves existing manual_adjustment when recalculating unless overwriteManual is true.
 */
export async function calculateFantasyForResult(
  resultId: number,
  options?: {
    force?: boolean
    action?: string
    message?: string
  }
): Promise<{ ok: boolean; skipped?: boolean; reason?: string; gameweek?: number; count?: number }> {
  const { data: result, error: resultError } = await supabase
    .from('results')
    .select('id, home_team, away_team, home_score, away_score, date, season_id')
    .eq('id', resultId)
    .single()

  if (resultError || !result) {
    return { ok: false, reason: resultError?.message || 'Result not found' }
  }

  const typedResult = result as ResultRow
  const { gameweek } = await getGameweekForResult(typedResult)

  if (!options?.force && (await isGameweekLocked(typedResult.season_id, gameweek))) {
    await logAction({
      season_id: typedResult.season_id,
      result_id: resultId,
      gameweek,
      action: 'skipped_locked',
      message: `GW${gameweek} is locked — skipped auto calculation`,
    })
    return { ok: true, skipped: true, reason: 'Gameweek locked', gameweek }
  }

  const { data: matchPlayers, error: mpError } = await supabase
    .from('match_players')
    .select('player_id, team_type')
    .eq('result_id', resultId)

  if (mpError) {
    return { ok: false, reason: mpError.message }
  }

  const { data: goals, error: goalsError } = await supabase
    .from('match_goals')
    .select('player_id')
    .eq('result_id', resultId)

  if (goalsError) {
    return { ok: false, reason: goalsError.message }
  }

  const goalsByPlayer = new Map<number, number>()
  ;(goals || []).forEach((g: any) => {
    const pid = typeof g.player_id === 'string' ? parseInt(g.player_id, 10) : g.player_id
    goalsByPlayer.set(pid, (goalsByPlayer.get(pid) || 0) + 1)
  })

  // Preserve manual adjustments
  const { data: existingRows } = await supabase
    .from('fantasy_match_points')
    .select('player_id, manual_adjustment, manual_adjustment_reason')
    .eq('result_id', resultId)

  const manualByPlayer = new Map<
    number,
    { manual_adjustment: number; manual_adjustment_reason: string | null }
  >()
  ;(existingRows || []).forEach((row: any) => {
    manualByPlayer.set(row.player_id, {
      manual_adjustment: row.manual_adjustment || 0,
      manual_adjustment_reason: row.manual_adjustment_reason || null,
    })
  })

  const appearedIds = new Set(
    (matchPlayers || []).map((mp: any) =>
      typeof mp.player_id === 'string' ? parseInt(mp.player_id, 10) : mp.player_id
    )
  )

  // Remove fantasy rows for players no longer in lineup (except keep if only manual? — delete)
  if (existingRows && existingRows.length > 0) {
    const toDelete = existingRows
      .filter((row: any) => !appearedIds.has(row.player_id))
      .map((row: any) => row.player_id)
    if (toDelete.length > 0) {
      await supabase
        .from('fantasy_match_points')
        .delete()
        .eq('result_id', resultId)
        .in('player_id', toDelete)
    }
  }

  const rows: Record<string, unknown>[] = []

  for (const mp of matchPlayers || []) {
    const playerId =
      typeof mp.player_id === 'string' ? parseInt(mp.player_id, 10) : mp.player_id
    const teamType = mp.team_type as 'home' | 'away'
    const prev = manualByPlayer.get(playerId)
    const scored = scorePlayerMatch({
      appeared: true,
      teamType,
      homeScore: typedResult.home_score,
      awayScore: typedResult.away_score,
      goalsScored: goalsByPlayer.get(playerId) || 0,
      manualAdjustment: prev?.manual_adjustment || 0,
    })

    rows.push({
      result_id: resultId,
      player_id: playerId,
      season_id: typedResult.season_id ?? null,
      gameweek,
      appearance_points: scored.appearance_points,
      result_points: scored.result_points,
      goals_points: scored.goals_points,
      team_scored_bonus: scored.team_scored_bonus,
      team_conceded_penalty: scored.team_conceded_penalty,
      manual_adjustment: scored.manual_adjustment,
      manual_adjustment_reason: prev?.manual_adjustment_reason ?? null,
      total_points: scored.total_points,
      goals_scored: scored.goals_scored,
      team_type: teamType,
      breakdown: JSON.stringify(scored.breakdown),
      calculated_at: new Date().toISOString(),
    })
  }

  if (rows.length > 0) {
    const { error: upsertError } = await supabase
      .from('fantasy_match_points')
      .upsert(rows, { onConflict: 'result_id,player_id' })

    if (upsertError) {
      return { ok: false, reason: upsertError.message, gameweek }
    }
  } else {
    // No players — clear any leftover rows
    await supabase.from('fantasy_match_points').delete().eq('result_id', resultId)
  }

  await logAction({
    season_id: typedResult.season_id,
    result_id: resultId,
    gameweek,
    action: options?.action || 'calculate',
    message: options?.message || `Calculated fantasy points for match #${resultId} (GW${gameweek})`,
    details: { players: rows.length },
  })

  return { ok: true, gameweek, count: rows.length }
}

export async function recalculateSeason(
  seasonId: number,
  options?: { force?: boolean }
): Promise<{ ok: boolean; processed: number; skipped: number; errors: string[] }> {
  const { data: results, error } = await supabase
    .from('results')
    .select('id')
    .eq('season_id', seasonId)
    .order('date', { ascending: true })
    .order('id', { ascending: true })

  if (error) {
    return { ok: false, processed: 0, skipped: 0, errors: [error.message] }
  }

  let processed = 0
  let skipped = 0
  const errors: string[] = []

  for (const r of results || []) {
    const res = await calculateFantasyForResult(r.id, {
      force: options?.force,
      action: 'recalculate',
      message: `Season recalculate for match #${r.id}`,
    })
    if (!res.ok) errors.push(`Match ${r.id}: ${res.reason}`)
    else if (res.skipped) skipped += 1
    else processed += 1
  }

  await logAction({
    season_id: seasonId,
    action: 'recalculate_season',
    message: `Recalculated season #${seasonId}: ${processed} processed, ${skipped} skipped`,
    details: { processed, skipped, errors },
  })

  return { ok: errors.length === 0, processed, skipped, errors }
}

export async function applyManualAdjustment(params: {
  resultId: number
  playerId: number
  points: number
  reason: string
}): Promise<{ ok: boolean; reason?: string }> {
  const reason = params.reason.trim()
  if (!reason) return { ok: false, reason: 'Reason is required' }

  const { data: existing } = await supabase
    .from('fantasy_match_points')
    .select('*')
    .eq('result_id', params.resultId)
    .eq('player_id', params.playerId)
    .maybeSingle()

  if (!existing) {
    // Ensure base calculation exists first
    const calc = await calculateFantasyForResult(params.resultId, {
      force: true,
      action: 'calculate_before_adjust',
    })
    if (!calc.ok) return { ok: false, reason: calc.reason || 'Could not calculate match' }
  }

  const { data: row } = await supabase
    .from('fantasy_match_points')
    .select('*')
    .eq('result_id', params.resultId)
    .eq('player_id', params.playerId)
    .maybeSingle()

  if (!row) {
    return { ok: false, reason: 'Player has no fantasy row for this match (did not play?)' }
  }

  const { data: result } = await supabase
    .from('results')
    .select('id, home_team, away_team, home_score, away_score, date, season_id')
    .eq('id', params.resultId)
    .single()

  if (!result) return { ok: false, reason: 'Result not found' }

  const scored = scorePlayerMatch({
    appeared: true,
    teamType: row.team_type,
    homeScore: result.home_score,
    awayScore: result.away_score,
    goalsScored: row.goals_scored || 0,
    manualAdjustment: params.points,
  })

  const { error } = await supabase
    .from('fantasy_match_points')
    .update({
      manual_adjustment: params.points,
      manual_adjustment_reason: reason,
      appearance_points: scored.appearance_points,
      result_points: scored.result_points,
      goals_points: scored.goals_points,
      team_scored_bonus: scored.team_scored_bonus,
      team_conceded_penalty: scored.team_conceded_penalty,
      total_points: scored.total_points,
      breakdown: JSON.stringify(scored.breakdown),
      calculated_at: new Date().toISOString(),
    })
    .eq('result_id', params.resultId)
    .eq('player_id', params.playerId)

  if (error) return { ok: false, reason: error.message }

  await logAction({
    season_id: result.season_id,
    result_id: params.resultId,
    gameweek: row.gameweek,
    action: 'adjust',
    message: `Manual adjustment ${params.points > 0 ? '+' : ''}${params.points} for player #${params.playerId}: ${reason}`,
    details: { player_id: params.playerId, points: params.points, reason },
  })

  return { ok: true }
}

export async function setGameweekLock(params: {
  seasonId: number
  gameweek: number
  locked: boolean
}): Promise<{ ok: boolean; reason?: string }> {
  const { error } = await supabase.from('fantasy_gameweek_locks').upsert(
    [
      {
        season_id: params.seasonId,
        gameweek: params.gameweek,
        locked: params.locked,
        locked_at: params.locked ? new Date().toISOString() : null,
      },
    ],
    { onConflict: 'season_id,gameweek' }
  )

  if (error) return { ok: false, reason: error.message }

  await logAction({
    season_id: params.seasonId,
    gameweek: params.gameweek,
    action: params.locked ? 'lock' : 'unlock',
    message: `${params.locked ? 'Locked' : 'Unlocked'} GW${params.gameweek}`,
  })

  return { ok: true }
}

export type { BreakdownItem }
