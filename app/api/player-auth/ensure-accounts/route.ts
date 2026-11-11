import { NextResponse } from 'next/server'
import { isSupabaseConfigured } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { ensureAccountsForAllPlayers } from '@/lib/player-auth'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const authCheck = await requireAuth()
    if (authCheck.error) return authCheck.response!

    const result = await ensureAccountsForAllPlayers()
    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
