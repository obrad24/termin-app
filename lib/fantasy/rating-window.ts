/** Player ratings open for 12 hours after the match is saved to the DB. */

export const RATING_WINDOW_HOURS = 12

export type RatingWindowStatus = {
  locked: boolean
  opens_at: string | null
  locks_at: string | null
  created_at: string | null
  message: string
}

export function getRatingWindowStatus(
  matchCreatedAt: string | Date | null | undefined,
  now: Date = new Date(),
): RatingWindowStatus {
  if (!matchCreatedAt) {
    return {
      locked: true,
      opens_at: null,
      locks_at: null,
      created_at: null,
      message: 'Ratings unavailable for this match',
    }
  }

  const created = new Date(matchCreatedAt)
  if (Number.isNaN(created.getTime())) {
    return {
      locked: true,
      opens_at: null,
      locks_at: null,
      created_at: null,
      message: 'Ratings unavailable for this match',
    }
  }

  const locksAt = new Date(created.getTime() + RATING_WINDOW_HOURS * 60 * 60 * 1000)
  const locked = now.getTime() >= locksAt.getTime()

  return {
    locked,
    opens_at: created.toISOString(),
    locks_at: locksAt.toISOString(),
    created_at: created.toISOString(),
    message: locked
      ? 'Player ratings are locked for this match'
      : `Ratings open until ${locksAt.toISOString()}`,
  }
}

export function isMatchRatingLocked(
  matchCreatedAt: string | Date | null | undefined,
  now: Date = new Date(),
): boolean {
  return getRatingWindowStatus(matchCreatedAt, now).locked
}
