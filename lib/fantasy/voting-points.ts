/** Fan-vote fantasy points: 1st (MVP) = 3, 2nd = 2, 3rd = 1 */

export const VOTING_POINTS_BY_PLACE: Record<number, number> = {
  1: 3,
  2: 2,
  3: 1,
}

export type VotingStanding = {
  player_id: number
  average: number
  count: number
  place: number
  points: number
  is_mvp: boolean
}

function toNum(value: unknown): number | null {
  const n = typeof value === 'string' ? parseInt(value, 10) : Number(value)
  return Number.isFinite(n) ? n : null
}

/** Aggregate raw rating rows into top-3 standings with fantasy points. */
export function computeVotingStandings(
  ratings: Array<{ player_id: unknown; rating: unknown }>,
): VotingStanding[] {
  const byPlayer = new Map<number, { sum: number; count: number }>()

  for (const row of ratings) {
    const playerId = toNum(row.player_id)
    const rating = toNum(row.rating)
    if (playerId == null || rating == null) continue
    const cur = byPlayer.get(playerId) || { sum: 0, count: 0 }
    cur.sum += rating
    cur.count += 1
    byPlayer.set(playerId, cur)
  }

  const ranked = Array.from(byPlayer.entries())
    .map(([player_id, v]) => ({
      player_id,
      average: Math.round((v.sum / v.count) * 10) / 10,
      count: v.count,
    }))
    .sort((a, b) => {
      if (b.average !== a.average) return b.average - a.average
      if (b.count !== a.count) return b.count - a.count
      return a.player_id - b.player_id
    })

  return ranked.map((row, index) => {
    const place = index + 1
    const points = VOTING_POINTS_BY_PLACE[place] || 0
    return {
      ...row,
      place,
      points,
      is_mvp: place === 1,
    }
  })
}

export function votingPointsByPlayerId(
  ratings: Array<{ player_id: unknown; rating: unknown }>,
): Map<number, VotingStanding> {
  const map = new Map<number, VotingStanding>()
  computeVotingStandings(ratings).forEach((s) => map.set(s.player_id, s))
  return map
}
