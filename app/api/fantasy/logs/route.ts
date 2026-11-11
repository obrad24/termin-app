import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const authCheck = await requireAuth()
    if (authCheck.error) return authCheck.response!

    const { searchParams } = new URL(request.url)
    const seasonIdParam = searchParams.get('season_id')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 200)

    let query = supabase
      .from('fantasy_calc_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (seasonIdParam) {
      const seasonId = parseInt(seasonIdParam, 10)
      if (!isNaN(seasonId)) query = query.eq('season_id', seasonId)
    }

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ logs: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
