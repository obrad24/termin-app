import { randomBytes, scryptSync, timingSafeEqual, createHmac } from 'crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const SESSION_COOKIE = 'player_session'
export const MAX_TRANSFERS_PER_GW = 2
export const SQUAD_SIZE = 5
export const MAX_BUDGET = 40
/** Max players from the same club in one fantasy squad */
export const MAX_PLAYERS_PER_TEAM = 3

export function countPlayersByTeam(
  players: Array<{ team?: string | null }>,
): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const p of players) {
    const team = (p.team || '').trim()
    if (!team) continue
    counts[team] = (counts[team] || 0) + 1
  }
  return counts
}

export function maxPlayersFromOneTeam(
  players: Array<{ team?: string | null }>,
): number {
  const counts = countPlayersByTeam(players)
  return Object.values(counts).reduce((max, n) => Math.max(max, n), 0)
}

export function findTeamLimitViolation(
  players: Array<{ team?: string | null }>,
  maxPerTeam = MAX_PLAYERS_PER_TEAM,
): { team: string; count: number } | null {
  const counts = countPlayersByTeam(players)
  let worst: { team: string; count: number } | null = null
  for (const [team, count] of Object.entries(counts)) {
    if (count > maxPerTeam && (!worst || count > worst.count)) {
      worst = { team, count }
    }
  }
  return worst
}

/** Same squad membership (order ignored). */
export function samePlayerIds(a: number[], b: number[]) {
  if (a.length !== b.length) return false
  const left = [...a].map(Number).sort((x, y) => x - y)
  const right = [...b].map(Number).sort((x, y) => x - y)
  return left.every((id, i) => id === right[i])
}

export type PlayerAccountSession = {
  accountId: number
  /** 0 when account is fantasy-only (not linked to a footballer) */
  playerId: number
  nickname: string
}

function sessionSecret() {
  return process.env.ADMIN_PASSWORD || process.env.DATABASE_URL || 'termin-dev-secret'
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 32).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const next = scryptSync(password, salt, 32)
  const prev = Buffer.from(hash, 'hex')
  if (prev.length !== next.length) return false
  return timingSafeEqual(prev, next)
}

export function defaultNickname(firstName: string, _lastName?: string) {
  return firstName.trim()
}

export function defaultPassword(firstName: string) {
  return `${firstName.trim()}123`
}

function signSession(accountId: number, playerId: number, nickname: string) {
  const payload = `${accountId}:${playerId}:${encodeURIComponent(nickname)}`
  const sig = createHmac('sha256', sessionSecret()).update(payload).digest('hex').slice(0, 24)
  return `${payload}.${sig}`
}

function parseSession(value: string | undefined): PlayerAccountSession | null {
  if (!value) return null
  const [payload, sig] = value.split('.')
  if (!payload || !sig) return null
  const expected = createHmac('sha256', sessionSecret()).update(payload).digest('hex').slice(0, 24)
  try {
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  } catch {
    return null
  }
  const [accountIdRaw, playerIdRaw, nickRaw] = payload.split(':')
  const accountId = parseInt(accountIdRaw, 10)
  const playerId = parseInt(playerIdRaw, 10)
  // playerId may be 0 for fantasy-only (non-footballer) accounts
  if (!accountId || Number.isNaN(accountId) || Number.isNaN(playerId) || playerId < 0) return null
  return {
    accountId,
    playerId,
    nickname: decodeURIComponent(nickRaw || ''),
  }
}

export async function getPlayerSession(): Promise<PlayerAccountSession | null> {
  try {
    const cookieStore = await cookies()
    return parseSession(cookieStore.get(SESSION_COOKIE)?.value)
  } catch {
    return null
  }
}

export async function setPlayerSession(session: PlayerAccountSession) {
  const cookieStore = await cookies()
  cookieStore.set(
    SESSION_COOKIE,
    signSession(session.accountId, session.playerId, session.nickname),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    },
  )
}

export async function clearPlayerSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function requirePlayerAuth() {
  const session = await getPlayerSession()
  if (!session) {
    return {
      error: true as const,
      session: null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }
  return { error: false as const, session, response: null }
}

export async function ensureAccountForPlayer(player: {
  id: number
  first_name: string
  last_name: string
}) {
  const { data: existing } = await supabase
    .from('player_accounts')
    .select('id, nickname, player_id')
    .eq('player_id', player.id)
    .maybeSingle()

  if (existing?.id) return existing

  const baseNickname = defaultNickname(player.first_name, player.last_name)
  const password_hash = hashPassword(defaultPassword(player.first_name))

  for (let i = 0; i < 25; i++) {
    const nickname = i === 0 ? baseNickname : `${baseNickname}${i + 1}`
    const { data, error } = await supabase
      .from('player_accounts')
      .insert([{ player_id: player.id, nickname, password_hash }])
      .select()
      .single()

    if (!error && data) return data

    const msg = (error?.message || '').toLowerCase()
    if (msg.includes('unique') || error?.code === '23505') continue

    console.warn('ensureAccountForPlayer failed:', error?.message)
    return null
  }

  return null
}

/** Create a fantasy login for someone who is not in the players table. */
export async function createGuestFantasyAccount(params: {
  nickname: string
  password: string
}) {
  const nickname = params.nickname.trim()
  const password = params.password
  if (!nickname) throw new Error('Nickname required')
  if (!password || password.length < 4) {
    throw new Error('Password must be at least 4 characters')
  }

  const { data: existing } = await supabase
    .from('player_accounts')
    .select('id')
    .eq('nickname', nickname)
    .maybeSingle()

  if (existing?.id) {
    throw new Error('Nickname already taken')
  }

  const password_hash = hashPassword(password)
  const { data, error } = await supabase
    .from('player_accounts')
    .insert([{ player_id: null, nickname, password_hash }])
    .select('id, nickname, player_id, created_at')
    .single()

  if (error) {
    const msg = (error.message || '').toLowerCase()
    if (msg.includes('unique') || error.code === '23505') {
      throw new Error('Nickname already taken')
    }
    if (msg.includes('not-null') || msg.includes('null value') || msg.includes('player_id')) {
      throw new Error(
        'Database still requires player_id. Run fantasy-guest-accounts.sql (ALTER player_id DROP NOT NULL).',
      )
    }
    throw new Error(error.message)
  }

  return data
}

export async function listFantasyAccounts() {
  const { data, error } = await supabase
    .from('player_accounts')
    .select('id, nickname, player_id, created_at')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function ensureAccountsForAllPlayers() {
  const { data: players, error } = await supabase
    .from('players')
    .select('id, first_name, last_name')

  if (error) throw new Error(error.message)

  let created = 0
  for (const player of players || []) {
    const { data: had } = await supabase
      .from('player_accounts')
      .select('id')
      .eq('player_id', player.id)
      .maybeSingle()

    const row = await ensureAccountForPlayer(player)
    if (row && !had) created += 1
  }

  const { data: all } = await supabase.from('player_accounts').select('id')
  return { created, total: (all || []).length }
}

export function countTransfers(fromIds: number[], toIds: number[]) {
  const prev = new Set(fromIds)
  let incoming = 0
  for (const id of toIds) {
    if (!prev.has(id)) incoming += 1
  }
  return incoming
}

export function parsePlayerIds(raw: unknown): number[] {
  if (Array.isArray(raw)) {
    return raw
      .map((v) => (typeof v === 'string' ? parseInt(v, 10) : Number(v)))
      .filter((n) => Number.isFinite(n) && n > 0)
  }
  if (typeof raw === 'string') {
    try {
      return parsePlayerIds(JSON.parse(raw))
    } catch {
      return []
    }
  }
  return []
}

/** Next GW = number of season results + 1 */
export async function getNextGameweek(seasonId: number | null): Promise<number> {
  let query = supabase.from('results').select('id')
  if (seasonId) query = query.eq('season_id', seasonId)
  const { data } = await query
  return (data || []).length + 1
}
