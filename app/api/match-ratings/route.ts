import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { getRatingWindowStatus } from '@/lib/fantasy/rating-window'
import { computeVotingStandings } from '@/lib/fantasy/voting-points'
import { calculateFantasyForResult } from '@/lib/fantasy/calculate'
import { resolveVoterKey } from '@/lib/request-voter'

export const dynamic = 'force-dynamic'

async function loadMatchCreatedAt(matchId: number) {
  const { data } = await supabase
    .from('results')
    .select('id, created_at')
    .eq('id', matchId)
    .maybeSingle()
  return data
}

// GET - average ratings + voting lock window for a match
export async function GET(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error: 'Supabase not configured',
          message: 'Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables',
        },
        { status: 503 },
      )
    }

    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get('match_id')

    if (!matchId) {
      return NextResponse.json({ error: 'match_id parameter is required' }, { status: 400 })
    }

    const matchIdNum = parseInt(matchId, 10)
    if (isNaN(matchIdNum)) {
      return NextResponse.json({ error: 'Invalid match_id' }, { status: 400 })
    }

    const match = await loadMatchCreatedAt(matchIdNum)
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    const rating_window = getRatingWindowStatus(match.created_at)

    const { data: ratings, error: ratingsError } = await supabase
      .from('match_player_ratings')
      .select('player_id, rating')
      .eq('match_id', matchIdNum)

    if (ratingsError) {
      console.error('Error fetching ratings:', ratingsError)
      return NextResponse.json(
        { error: 'Failed to fetch ratings', details: ratingsError.message },
        { status: 500 },
      )
    }

    const ratingsByPlayer = new Map<number, { sum: number; count: number }>()
    ;(ratings || []).forEach((rating) => {
      const playerId =
        typeof rating.player_id === 'string'
          ? parseInt(rating.player_id, 10)
          : Number(rating.player_id)
      if (!Number.isFinite(playerId)) return
      if (!ratingsByPlayer.has(playerId)) {
        ratingsByPlayer.set(playerId, { sum: 0, count: 0 })
      }
      const current = ratingsByPlayer.get(playerId)!
      current.sum += Number(rating.rating) || 0
      current.count += 1
    })

    const averages: Record<number, { average: number; count: number }> = {}
    ratingsByPlayer.forEach((value, playerId) => {
      averages[playerId] = {
        average: Math.round((value.sum / value.count) * 10) / 10,
        count: value.count,
      }
    })

    const standings = computeVotingStandings(ratings || [])

    return NextResponse.json({
      averages,
      // backward-compatible flat map (same shape as before)
      ...averages,
      standings,
      rating_window,
      voting_locked: rating_window.locked,
    })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 },
    )
  }
}

// POST - submit / update a player rating (only within 12h of match created_at)
export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error: 'Supabase not configured',
          message: 'Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables',
        },
        { status: 503 },
      )
    }

    const body = await request.json()
    const { match_id, player_id, rating, voter_id } = body

    if (!match_id || !player_id || rating === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: match_id, player_id, rating' },
        { status: 400 },
      )
    }

    const matchIdNum = parseInt(match_id, 10)
    const playerIdNum = parseInt(player_id, 10)
    const ratingNum = parseInt(rating, 10)

    if (isNaN(matchIdNum) || isNaN(playerIdNum) || isNaN(ratingNum)) {
      return NextResponse.json(
        { error: 'Invalid match_id, player_id, or rating' },
        { status: 400 },
      )
    }

    if (ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    const match = await loadMatchCreatedAt(matchIdNum)
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    const rating_window = getRatingWindowStatus(match.created_at)
    if (rating_window.locked) {
      return NextResponse.json(
        {
          error: 'Ratings locked — voting closed 12 hours after the match was added',
          rating_window,
        },
        { status: 403 },
      )
    }

    const voterKey = resolveVoterKey(request, voter_id)
    if (voterKey === 'unknown') {
      return NextResponse.json(
        { error: 'Missing voter identity — refresh the page and try again' },
        { status: 400 },
      )
    }

    const { data: existingRating, error: checkError } = await supabase
      .from('match_player_ratings')
      .select('id')
      .eq('match_id', matchIdNum)
      .eq('player_id', playerIdNum)
      .eq('user_ip', voterKey)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking existing rating:', checkError)
      return NextResponse.json(
        { error: 'Failed to check existing rating', details: checkError.message },
        { status: 500 },
      )
    }

    let data
    let updated = false

    if (existingRating?.id) {
      const { data: updatedRow, error: updateError } = await supabase
        .from('match_player_ratings')
        .update({ rating: ratingNum })
        .eq('id', existingRating.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating rating:', updateError)
        return NextResponse.json(
          { error: 'Failed to update rating', details: updateError.message },
          { status: 500 },
        )
      }
      data = updatedRow
      updated = true
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('match_player_ratings')
        .insert({
          match_id: matchIdNum,
          player_id: playerIdNum,
          rating: ratingNum,
          user_ip: voterKey,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error inserting rating:', insertError)
        return NextResponse.json(
          { error: 'Failed to insert rating', details: insertError.message },
          { status: 500 },
        )
      }
      data = inserted
    }

    // Keep fantasy voting points in sync with live standings
    try {
      await calculateFantasyForResult(matchIdNum, {
        force: true,
        action: 'voting_update',
        message: `Updated fan-vote fantasy points for match #${matchIdNum}`,
      })
    } catch (e) {
      console.warn('Fantasy recalc after rating failed:', e)
    }

    return NextResponse.json({ success: true, data, updated, rating_window })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 },
    )
  }
}
