import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import {
  ensureAccountsForAllPlayers,
  setPlayerSession,
  verifyPassword,
} from '@/lib/player-auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const body = await request.json()
    const nickname = String(body.nickname || '').trim()
    const password = String(body.password || '')

    if (!nickname || !password) {
      return NextResponse.json({ error: 'Nickname and password required' }, { status: 400 })
    }

    // Ensure all player accounts exist (idempotent seed)
    try {
      await ensureAccountsForAllPlayers()
    } catch (e) {
      console.warn('ensure accounts on login:', e)
    }

    const { data: account, error } = await supabase
      .from('player_accounts')
      .select('id, player_id, nickname, password_hash')
      .eq('nickname', nickname)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!account || !verifyPassword(password, account.password_hash)) {
      return NextResponse.json({ error: 'Invalid nickname or password' }, { status: 401 })
    }

    await setPlayerSession({
      accountId: account.id,
      playerId: account.player_id,
      nickname: account.nickname,
    })

    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        player_id: account.player_id,
        nickname: account.nickname,
      },
    })
  } catch (error: any) {
    console.error('Player login error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
