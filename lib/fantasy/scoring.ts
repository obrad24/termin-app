export type BreakdownItem = {
  key: string
  label: string
  points: number
}

export type PlayerMatchScoreInput = {
  appeared: boolean
  teamType: 'home' | 'away'
  homeScore: number
  awayScore: number
  goalsScored: number
  manualAdjustment?: number
}

export type PlayerMatchScore = {
  appearance_points: number
  result_points: number
  goals_points: number
  team_scored_bonus: number
  team_conceded_penalty: number
  manual_adjustment: number
  total_points: number
  goals_scored: number
  breakdown: BreakdownItem[]
}

function teamGoalsForBonus(goalsFor: number): number {
  if (goalsFor >= 17) return 3
  if (goalsFor >= 12) return 2
  if (goalsFor >= 8) return 1
  return 0
}

function teamGoalsAgainstPenalty(goalsAgainst: number): number {
  if (goalsAgainst >= 16) return -3
  if (goalsAgainst >= 11) return -2
  if (goalsAgainst >= 7) return -1
  return 0
}

/** Pure scoring rules for one player in one finished match. */
export function scorePlayerMatch(input: PlayerMatchScoreInput): PlayerMatchScore {
  const manual = input.manualAdjustment || 0
  const goalsScored = Math.max(0, input.goalsScored || 0)

  if (!input.appeared) {
    const breakdown: BreakdownItem[] = [
      { key: 'appearance', label: 'Did not play', points: 0 },
    ]
    if (manual !== 0) {
      breakdown.push({ key: 'manual', label: 'Manual adjustment', points: manual })
    }
    return {
      appearance_points: 0,
      result_points: 0,
      goals_points: 0,
      team_scored_bonus: 0,
      team_conceded_penalty: 0,
      manual_adjustment: manual,
      total_points: manual,
      goals_scored: 0,
      breakdown,
    }
  }

  const goalsFor = input.teamType === 'home' ? input.homeScore : input.awayScore
  const goalsAgainst = input.teamType === 'home' ? input.awayScore : input.homeScore

  const appearance_points = 2
  let result_points = 0
  let resultLabel = 'Draw'
  if (goalsFor > goalsAgainst) {
    result_points = 2
    resultLabel = 'Win'
  } else if (goalsFor < goalsAgainst) {
    result_points = -1
    resultLabel = 'Loss'
  }

  const goals_points = goalsScored * 4
  const team_scored_bonus = teamGoalsForBonus(goalsFor)
  const team_conceded_penalty = teamGoalsAgainstPenalty(goalsAgainst)

  const breakdown: BreakdownItem[] = [
    { key: 'appearance', label: 'Appearance', points: appearance_points },
    { key: 'result', label: resultLabel, points: result_points },
  ]

  if (goals_points !== 0) {
    breakdown.push({
      key: 'goals',
      label: `Goals scored (${goalsScored}×4)`,
      points: goals_points,
    })
  }
  if (team_scored_bonus !== 0) {
    breakdown.push({
      key: 'team_scored',
      label: `Team scored ${goalsFor}`,
      points: team_scored_bonus,
    })
  }
  if (team_conceded_penalty !== 0) {
    breakdown.push({
      key: 'team_conceded',
      label: `Team conceded ${goalsAgainst}`,
      points: team_conceded_penalty,
    })
  }
  if (manual !== 0) {
    breakdown.push({ key: 'manual', label: 'Manual adjustment', points: manual })
  }

  const total_points =
    appearance_points +
    result_points +
    goals_points +
    team_scored_bonus +
    team_conceded_penalty +
    manual

  return {
    appearance_points,
    result_points,
    goals_points,
    team_scored_bonus,
    team_conceded_penalty,
    manual_adjustment: manual,
    total_points,
    goals_scored: goalsScored,
    breakdown,
  }
}
