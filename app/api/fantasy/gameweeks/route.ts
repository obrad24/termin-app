import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { setGameweekLock } from '@/lib/fantasy/calculate'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const seasonId = parseInt(String(searchParams.get('season_id') || ''), 10)
    if (isNaN(seasonId)) {
      return NextResponse.json({ error: 'season_id required' }, { status: 400 })
    }

    const { data: results } = await supabase
      .from('results')
      .select('id, date, home_team, away_team')
      .eq('season_id', seasonId)
      .order('date', { ascending: true })
      .order('id', { ascending: true })

    const { data: locks } = await supabase
      .from('fantasy_gameweek_locks')
      .select('gameweek, locked, locked_at')
      .eq('season_id', seasonId)

    const lockMap = new Map<number, any>()
    ;(locks || []).forEach((l: any) => lockMap.set(l.gameweek, l))

    const gameweeks = (results || []).map((r: any, index: number) => {
      const gw = index + 1
      const lock = lockMap.get(gw)
      return {
        gameweek: gw,
        result_id: r.id,
        date: r.date,
        label: `${r.home_team} vs ${r.away_team}`,
        locked: !!lock?.locked,
        locked_at: lock?.locked_at || null,
      }
    })

    return NextResponse.json({ gameweeks })
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
    const seasonId = parseInt(String(body.season_id), 10)
    const gameweek = parseInt(String(body.gameweek), 10)
    const locked = body.locked === true

    if (isNaN(seasonId) || isNaN(gameweek)) {
      return NextResponse.json({ error: 'season_id and gameweek required' }, { status: 400 })
    }

    const result = await setGameweekLock({ seasonId, gameweek, locked })
    if (!result.ok) {
      return NextResponse.json({ error: result.reason || 'Failed' }, { status: 400 })
    }

    return NextResponse.json({ success: true, gameweek, locked })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
