import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

// GET - Dobijanje igrača sledećeg meča
export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error: 'Supabase not configured',
          message: 'Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables',
        },
        { status: 503 }
      )
    }

    // Prvo uzmi ID sledećeg meča
    const { data: nextMatch, error: nextMatchError } = await supabase
      .from('next_match')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .single()

    if (nextMatchError || !nextMatch) {
      // Ako nema sledećeg meča, vrati prazan niz
      return NextResponse.json([])
    }

    // Uzmi sve igrače za taj meč
    const { data, error } = await supabase
      .from('next_match_players')
      .select(`
        *,
        players (
          id,
          first_name,
          last_name,
          image_url,
          team
        )
      `)
      .eq('next_match_id', nextMatch.id)
      .order('team_type', { ascending: true })
      .order('id', { ascending: true })

    if (error) {
      console.error('Error fetching next match players:', error)
      return NextResponse.json(
        { error: 'Failed to fetch next match players', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Dodavanje igrača u sledeći meč (admin)
export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error: 'Supabase not configured',
          message: 'Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables',
        },
        { status: 503 }
      )
    }

    // Provera autentifikacije
    const authCheck = await requireAuth()
    if (authCheck.error) {
      return authCheck.response
    }

    const body = await request.json()
    const { player_ids } = body

    if (!Array.isArray(player_ids)) {
      return NextResponse.json(
        { error: 'player_ids must be an array' },
        { status: 400 }
      )
    }

    // Prvo uzmi ID sledećeg meča
    const { data: nextMatch, error: nextMatchError } = await supabase
      .from('next_match')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .single()

    if (nextMatchError || !nextMatch) {
      return NextResponse.json(
        { error: 'No next match found. Please create a next match first.' },
        { status: 400 }
      )
    }

    // Obriši sve postojeće igrače za ovaj meč
    const { error: deleteError } = await supabase
      .from('next_match_players')
      .delete()
      .eq('next_match_id', nextMatch.id)

    if (deleteError) {
      console.error('Error deleting existing players:', deleteError)
      return NextResponse.json(
        { error: 'Failed to clear existing players', details: deleteError.message },
        { status: 500 }
      )
    }

    // Ako nema igrača za dodavanje, samo vrati uspeh
    if (player_ids.length === 0) {
      return NextResponse.json({ success: true, message: 'Players cleared' })
    }

    // Validacija i priprema podataka
    const playersToInsert = player_ids.map((item: { player_id: number; team_type: 'home' | 'away' }) => ({
      next_match_id: nextMatch.id,
      player_id: item.player_id,
      team_type: item.team_type,
    }))

    // Dodaj nove igrače
    const { data, error } = await supabase
      .from('next_match_players')
      .insert(playersToInsert)
      .select(`
        *,
        players (
          id,
          first_name,
          last_name,
          image_url,
          team
        )
      `)

    if (error) {
      console.error('Error adding players:', error)
      return NextResponse.json(
        { error: 'Failed to add players', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
