import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

// GET - Dobijanje prosječnih ocjena za igrače u određenom meču
export async function GET(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { 
          error: 'Supabase not configured',
          message: 'Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables'
        },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get('match_id')

    if (!matchId) {
      return NextResponse.json(
        { error: 'match_id parameter is required' },
        { status: 400 }
      )
    }

    const matchIdNum = parseInt(matchId, 10)
    if (isNaN(matchIdNum)) {
      return NextResponse.json(
        { error: 'Invalid match_id' },
        { status: 400 }
      )
    }

    // Dobijanje svih ocjena za meč
    const { data: ratings, error: ratingsError } = await supabase
      .from('match_player_ratings')
      .select('player_id, rating')
      .eq('match_id', matchIdNum)

    if (ratingsError) {
      console.error('Error fetching ratings:', ratingsError)
      return NextResponse.json(
        { error: 'Failed to fetch ratings', details: ratingsError.message },
        { status: 500 }
      )
    }

    // Izračunavanje prosječnih ocjena po igraču
    const ratingsByPlayer = new Map<number, { sum: number; count: number }>()

    ratings?.forEach((rating) => {
      const playerId = rating.player_id
      if (!ratingsByPlayer.has(playerId)) {
        ratingsByPlayer.set(playerId, { sum: 0, count: 0 })
      }
      const current = ratingsByPlayer.get(playerId)!
      current.sum += rating.rating
      current.count += 1
    })

    // Konvertovanje u format sa prosječnom ocjenom
    const averageRatings: Record<number, { average: number; count: number }> = {}
    ratingsByPlayer.forEach((value, playerId) => {
      averageRatings[playerId] = {
        average: Math.round((value.sum / value.count) * 10) / 10, // Zaokruženo na 1 decimalu
        count: value.count
      }
    })

    return NextResponse.json(averageRatings)
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Slanje ocjene za igrača u meču
export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { 
          error: 'Supabase not configured',
          message: 'Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables'
        },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { match_id, player_id, rating } = body

    // Validacija
    if (!match_id || !player_id || rating === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: match_id, player_id, rating' },
        { status: 400 }
      )
    }

    const matchIdNum = parseInt(match_id, 10)
    const playerIdNum = parseInt(player_id, 10)
    const ratingNum = parseInt(rating, 10)

    if (isNaN(matchIdNum) || isNaN(playerIdNum) || isNaN(ratingNum)) {
      return NextResponse.json(
        { error: 'Invalid match_id, player_id, or rating' },
        { status: 400 }
      )
    }

    if (ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Dobijanje IP adrese korisnika
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'

    // Provjera da li korisnik već ocjenio ovog igrača u ovom meču
    const { data: existingRating, error: checkError } = await supabase
      .from('match_player_ratings')
      .select('id')
      .eq('match_id', matchIdNum)
      .eq('player_id', playerIdNum)
      .eq('user_ip', ip)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing rating:', checkError)
      return NextResponse.json(
        { error: 'Failed to check existing rating', details: checkError.message },
        { status: 500 }
      )
    }

    if (existingRating) {
      // Ažuriranje postojeće ocjene
      const { data, error: updateError } = await supabase
        .from('match_player_ratings')
        .update({ rating: ratingNum })
        .eq('id', existingRating.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating rating:', updateError)
        return NextResponse.json(
          { error: 'Failed to update rating', details: updateError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, data, updated: true })
    } else {
      // Kreiranje nove ocjene
      const { data, error: insertError } = await supabase
        .from('match_player_ratings')
        .insert({
          match_id: matchIdNum,
          player_id: playerIdNum,
          rating: ratingNum,
          user_ip: ip
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error inserting rating:', insertError)
        return NextResponse.json(
          { error: 'Failed to insert rating', details: insertError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, data, updated: false })
    }
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
