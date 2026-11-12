/** Weekly fantasy transfer window (Europe/Belgrade).
 * Open: Friday 12:00 → Thursday 17:00
 * Locked: Thursday 17:00 → Friday 12:00
 * Max changes during open window: MAX_TRANSFERS_PER_GW (2)
 */

export const TRANSFER_TZ = 'Europe/Belgrade'
export const LOCK_WEEKDAY = 4 // Thursday (Sun=0)
export const LOCK_HOUR = 17
export const UNLOCK_WEEKDAY = 5 // Friday
export const UNLOCK_HOUR = 12

type ZonedParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
  weekday: number // 0=Sun … 6=Sat
}

function zonedParts(date: Date, timeZone = TRANSFER_TZ): ZonedParts {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const map = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]))
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }
  // hour12:false can yield "24" for midnight in some engines
  let hour = parseInt(map.hour, 10)
  if (hour === 24) hour = 0

  return {
    year: parseInt(map.year, 10),
    month: parseInt(map.month, 10),
    day: parseInt(map.day, 10),
    hour,
    minute: parseInt(map.minute, 10),
    second: parseInt(map.second, 10),
    weekday: weekdayMap[map.weekday] ?? 0,
  }
}

/** Convert a wall-clock time in TRANSFER_TZ to a UTC Date. */
function zonedWallTimeToUtc(parts: {
  year: number
  month: number
  day: number
  hour: number
  minute?: number
  second?: number
}): Date {
  const pad = (n: number) => String(n).padStart(2, '0')
  const asUtcGuess = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute ?? 0,
    parts.second ?? 0,
  )

  // Refine: compare what that instant looks like in the target TZ vs desired wall time
  let utc = asUtcGuess
  for (let i = 0; i < 3; i++) {
    const got = zonedParts(new Date(utc))
    const desiredAsMinutes =
      parts.hour * 60 + (parts.minute ?? 0)
    const gotAsMinutes = got.hour * 60 + got.minute
    // Also account for day drift
    const desiredDayKey = parts.year * 10000 + parts.month * 100 + parts.day
    const gotDayKey = got.year * 10000 + got.month * 100 + got.day
    const dayDiffDays =
      Math.round(
        (Date.UTC(parts.year, parts.month - 1, parts.day) -
          Date.UTC(got.year, got.month - 1, got.day)) /
          86400000,
      )
    const deltaMinutes = dayDiffDays * 24 * 60 + (desiredAsMinutes - gotAsMinutes)
    if (deltaMinutes === 0 && desiredDayKey === gotDayKey) break
    utc += deltaMinutes * 60_000
  }
  return new Date(utc)
}

function addDays(parts: ZonedParts, days: number) {
  const d = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days))
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  }
}

function nextOccurrence(
  now: Date,
  targetWeekday: number,
  hour: number,
  minute = 0,
): Date {
  const p = zonedParts(now)
  let daysAhead = (targetWeekday - p.weekday + 7) % 7
  const candidateDay = addDays(p, daysAhead)
  let candidate = zonedWallTimeToUtc({
    ...candidateDay,
    hour,
    minute,
  })
  if (candidate.getTime() <= now.getTime()) {
    const nextDay = addDays(p, daysAhead + 7)
    candidate = zonedWallTimeToUtc({
      ...nextDay,
      hour,
      minute,
    })
  }
  return candidate
}

export type TransferWindowStatus = {
  locked: boolean
  reason: 'schedule' | null
  timezone: string
  lock_weekday: 'Thursday'
  lock_time: '17:00'
  unlock_weekday: 'Friday'
  unlock_time: '12:00'
  /** When transfers next lock (deadline) */
  next_deadline_at: string
  /** When transfers next unlock */
  next_unlock_at: string
  message: string
}

export function isTransferWindowLocked(now: Date = new Date()): boolean {
  const p = zonedParts(now)
  if (p.weekday === LOCK_WEEKDAY) {
    return p.hour > LOCK_HOUR || (p.hour === LOCK_HOUR && p.minute >= 0)
  }
  if (p.weekday === UNLOCK_WEEKDAY) {
    return p.hour < UNLOCK_HOUR
  }
  return false
}

export function getTransferWindowStatus(now: Date = new Date()): TransferWindowStatus {
  const locked = isTransferWindowLocked(now)
  const nextDeadline = nextOccurrence(now, LOCK_WEEKDAY, LOCK_HOUR, 0)
  const nextUnlock = nextOccurrence(now, UNLOCK_WEEKDAY, UNLOCK_HOUR, 0)

  return {
    locked,
    reason: locked ? 'schedule' : null,
    timezone: TRANSFER_TZ,
    lock_weekday: 'Thursday',
    lock_time: '17:00',
    unlock_weekday: 'Friday',
    unlock_time: '12:00',
    next_deadline_at: nextDeadline.toISOString(),
    next_unlock_at: nextUnlock.toISOString(),
    message: locked
      ? 'Transfers locked from Thursday 17:00 until Friday 12:00'
      : 'Transfers open until Thursday 17:00 (max 2 changes)',
  }
}
