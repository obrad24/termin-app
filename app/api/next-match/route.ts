import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

// GET - Dobijanje sledećeg meča
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

    const { data, error } = await supabase
      .from('next_match')
      .select('*')
      .order('id', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      // Ako nema reda, vrati null umjesto greške
      if (error.code === 'PGRST116') {
        return NextResponse.json(null)
      }
      console.error('Error fetching next match:', error)
      return NextResponse.json(
        { error: 'Failed to fetch next match', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Kreiranje ili ažuriranje sledećeg meča (admin)
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
    const { home_team, away_team, match_date, odds_1, odds_x, odds_2 } = body

    if (!home_team || !away_team) {
      return NextResponse.json(
        { error: 'Missing required fields: home_team and away_team' },
        { status: 400 }
      )
    }

    // Prvo proveri da li postoji red
    const { data: existing } = await supabase
      .from('next_match')
      .select('id')
      .limit(1)
      .single()

    if (existing) {
      // Ažuriraj postojeći red
      const { data, error } = await supabase
        .from('next_match')
        .update({
          home_team,
          away_team,
          match_date: match_date || null,
          odds_1: odds_1 ? parseFloat(odds_1) : null,
          odds_x: odds_x ? parseFloat(odds_x) : null,
          odds_2: odds_2 ? parseFloat(odds_2) : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating next match:', error)
        return NextResponse.json(
          { error: 'Failed to update next match', details: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json(data, { status: 200 })
    } else {
      // Kreiraj novi red
      const { data, error } = await supabase
        .from('next_match')
        .insert([
          {
            home_team,
            away_team,
            match_date: match_date || null,
            odds_1: odds_1 ? parseFloat(odds_1) : null,
            odds_x: odds_x ? parseFloat(odds_x) : null,
            odds_2: odds_2 ? parseFloat(odds_2) : null,
          },
        ])
        .select()
        .single()

      if (error) {
        console.error('Error creating next match:', error)
        return NextResponse.json(
          { error: 'Failed to create next match', details: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json(data, { status: 201 })
    }
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

