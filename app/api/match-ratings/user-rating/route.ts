import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { resolveVoterKey } from '@/lib/request-voter'
import { toId } from '@/lib/ids'

export const dynamic = 'force-dynamic'

// GET - this voter's rating(s) for a match (optionally one player)
export async function GET(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error: 'Supabase not configured',
          message: 'Please set DATABASE_URL environment variable',
        },
        { status: 503 },
      )
    }

    const { searchParams } = new URL(request.url)
    const matchId = toId(searchParams.get('match_id'))
    const playerId = toId(searchParams.get('player_id'))
    const voterKey = resolveVoterKey(request, searchParams.get('voter_id'))

    if (matchId == null) {
      return NextResponse.json({ error: 'match_id parameter is required' }, { status: 400 })
    }

    if (voterKey === 'unknown') {
      return NextResponse.json({ rating: null, ratings: {} })
    }

    let query = supabase
      .from('match_player_ratings')
      .select('player_id, rating')
      .eq('match_id', matchId)
      .eq('user_ip', voterKey)

    if (playerId != null) {
      query = query.eq('player_id', playerId)
    }

    const { data, error } = await query
    if (error) {
      console.error('Error fetching user rating:', error)
      return NextResponse.json(
        { error: 'Failed to fetch user rating', details: error.message },
        { status: 500 },
      )
    }

    const ratings: Record<number, number> = {}
    ;(data || []).forEach((row: any) => {
      const pid = toId(row.player_id)
      if (pid == null) return
      ratings[pid] = Number(row.rating) || 0
    })

    if (playerId != null) {
      return NextResponse.json({
        rating: ratings[playerId] ?? null,
        ratings,
      })
    }

    return NextResponse.json({ ratings })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 },
    )
  }
}
