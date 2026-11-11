import { NextResponse } from 'next/server'
import { isSupabaseConfigured } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { applyManualAdjustment } from '@/lib/fantasy/calculate'

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const authCheck = await requireAuth()
    if (authCheck.error) return authCheck.response!

    const body = await request.json()
    const resultId = parseInt(String(body.result_id), 10)
    const playerId = parseInt(String(body.player_id), 10)
    const points = parseInt(String(body.points), 10)
    const reason = String(body.reason || '')

    if (isNaN(resultId) || isNaN(playerId) || isNaN(points)) {
      return NextResponse.json({ error: 'Invalid fields' }, { status: 400 })
    }
    if (!reason.trim()) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 })
    }

    const result = await applyManualAdjustment({
      resultId,
      playerId,
      points,
      reason,
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.reason || 'Failed' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Fantasy adjust error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
