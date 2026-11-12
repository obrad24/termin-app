import { NextResponse } from 'next/server'
import { isSupabaseConfigured } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import {
  createGuestFantasyAccount,
  listFantasyAccounts,
} from '@/lib/player-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const authCheck = await requireAuth()
    if (authCheck.error) return authCheck.response!

    const accounts = await listFantasyAccounts()
    return NextResponse.json({ accounts })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const authCheck = await requireAuth()
    if (authCheck.error) return authCheck.response!

    const body = await request.json()
    const nickname = String(body.nickname || '').trim()
    const password = String(body.password || '')

    if (!nickname || !password) {
      return NextResponse.json(
        { error: 'Nickname and password required' },
        { status: 400 },
      )
    }

    const account = await createGuestFantasyAccount({ nickname, password })
    return NextResponse.json({ success: true, account })
  } catch (error: any) {
    const status =
      error?.message?.includes('already taken') ||
      error?.message?.includes('at least 4') ||
      error?.message?.includes('required')
        ? 400
        : 500
    return NextResponse.json({ error: error.message || 'Internal error' }, { status })
  }
}
