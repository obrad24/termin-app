import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

// GET - Dobijanje korisnikove ocjene za određenog igrača u meču
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
    const playerId = searchParams.get('player_id')

    if (!matchId || !playerId) {
      return NextResponse.json(
        { error: 'match_id and player_id parameters are required' },
        { status: 400 }
      )
    }

    const matchIdNum = parseInt(matchId, 10)
    const playerIdNum = parseInt(playerId, 10)
    
    if (isNaN(matchIdNum) || isNaN(playerIdNum)) {
      return NextResponse.json(
        { error: 'Invalid match_id or player_id' },
        { status: 400 }
      )
    }

    // Dobijanje IP adrese korisnika
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'

    // Pronađi korisnikovu ocjenu
    const { data: userRating, error: ratingError } = await supabase
      .from('match_player_ratings')
      .select('rating')
      .eq('match_id', matchIdNum)
      .eq('player_id', playerIdNum)
      .eq('user_ip', ip)
      .single()

    if (ratingError && ratingError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching user rating:', ratingError)
      return NextResponse.json(
        { error: 'Failed to fetch user rating', details: ratingError.message },
        { status: 500 }
      )
    }

    // Ako nema ocjene, vrati null
    if (!userRating) {
      return NextResponse.json({ rating: null })
    }

    return NextResponse.json({ rating: userRating.rating })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
