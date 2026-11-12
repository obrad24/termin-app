import { NextResponse } from 'next/server'

/** Short CDN/browser cache for public read APIs. */
export function jsonCached(
  data: unknown,
  options?: { seconds?: number; status?: number },
) {
  const seconds = options?.seconds ?? 30
  const response = NextResponse.json(data, { status: options?.status ?? 200 })
  response.headers.set(
    'Cache-Control',
    `public, max-age=0, s-maxage=${seconds}, stale-while-revalidate=${seconds * 6}`,
  )
  return response
}

export function jsonNoStore(data: unknown, status = 200) {
  const response = NextResponse.json(data, { status })
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}
