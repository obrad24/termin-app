/** Anonymous per-browser voter id (localStorage). Used so ratings are not shared by IP. */
const STORAGE_KEY = 'termin_voter_id'

export function getOrCreateVoterId(): string {
  if (typeof window === 'undefined') return ''
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY)
    if (existing && /^[a-zA-Z0-9_-]{8,64}$/.test(existing)) return existing
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID().replace(/-/g, '')
        : `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
    window.localStorage.setItem(STORAGE_KEY, id)
    return id
  } catch {
    return `tmp${Date.now().toString(36)}`
  }
}

/** Stable key stored in match_player_ratings.user_ip unique column. */
export function voterStorageKey(voterId: string) {
  const cleaned = String(voterId || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 64)
  if (!cleaned || cleaned.length < 8) return null
  return `voter:${cleaned}`
}
