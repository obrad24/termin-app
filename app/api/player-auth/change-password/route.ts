import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import {
  hashPassword,
  requirePlayerAuth,
  verifyPassword,
} from '@/lib/player-auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const auth = await requirePlayerAuth()
    if (auth.error) return auth.response!

    const body = await request.json()
    const currentPassword = String(body.current_password || '')
    const newPassword = String(body.new_password || '')
    const confirmPassword = String(body.confirm_password || '')

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Current and new password required' },
        { status: 400 },
      )
    }

    if (newPassword.length < 4) {
      return NextResponse.json(
        { error: 'New password must be at least 4 characters' },
        { status: 400 },
      )
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'New passwords do not match' }, { status: 400 })
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'New password must be different from current' },
        { status: 400 },
      )
    }

    const { data: account, error } = await supabase
      .from('player_accounts')
      .select('id, password_hash')
      .eq('id', auth.session!.accountId)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!account || !verifyPassword(currentPassword, account.password_hash)) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
    }

    const password_hash = hashPassword(newPassword)
    const { error: updateError } = await supabase
      .from('player_accounts')
      .update({ password_hash })
      .eq('id', account.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Change password error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
