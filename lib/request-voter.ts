import { voterStorageKey } from '@/lib/voter-id'

/** Resolve the unique voter key for match ratings (prefer client voter_id over shared IP). */
export function resolveVoterKey(request: Request, bodyVoterId?: unknown): string {
  const fromBody =
    typeof bodyVoterId === 'string' ? voterStorageKey(bodyVoterId) : null
  if (fromBody) return fromBody

  const { searchParams } = new URL(request.url)
  const fromQuery = voterStorageKey(searchParams.get('voter_id') || '')
  if (fromQuery) return fromQuery

  const fromHeader = voterStorageKey(request.headers.get('x-voter-id') || '')
  if (fromHeader) return fromHeader

  // Last resort — IP (often shared on LAN / missing headers → "unknown")
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = (forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || '')
    .trim()
  return ip || 'unknown'
}
