import { NextResponse } from 'next/server'
import { isSupabaseConfigured } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { calculateFantasyForResult, recalculateSeason } from '@/lib/fantasy/calculate'

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const authCheck = await requireAuth()
    if (authCheck.error) return authCheck.response!

    const body = await request.json()
    const force = body.force === true
    const resultId = body.result_id ? parseInt(String(body.result_id), 10) : null
    const seasonId = body.season_id ? parseInt(String(body.season_id), 10) : null

    if (resultId && !isNaN(resultId)) {
      const result = await calculateFantasyForResult(resultId, {
        force,
        action: 'recalculate',
        message: `Admin recalculate for match #${resultId}`,
      })
      if (!result.ok) {
        return NextResponse.json({ error: result.reason || 'Failed' }, { status: 400 })
      }
      return NextResponse.json(result)
    }

    if (seasonId && !isNaN(seasonId)) {
      const result = await recalculateSeason(seasonId, { force })
      return NextResponse.json(result)
    }

    return NextResponse.json(
      { error: 'Provide result_id or season_id' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Fantasy recalculate error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
