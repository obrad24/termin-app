import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

// GET - svi igrači
export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error: 'Supabase not configured',
          message: 'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local',
        },
        { status: 503 },
      )
    }

    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching players:', error)
      return NextResponse.json({ error: 'Failed to fetch players', details: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

// POST - dodavanje igrača
export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error: 'Supabase not configured',
          message: 'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local',
        },
        { status: 503 },
      )
    }

    // Provera autentifikacije
    const authCheck = await requireAuth()
    if (authCheck.error) {
      return authCheck.response
    }

    const body = await request.json()
    const { first_name, last_name, birth_year, team, image_url } = body

    if (!first_name || !last_name || !birth_year) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const year = parseInt(String(birth_year), 10)
    if (isNaN(year)) {
      return NextResponse.json({ error: 'Invalid birth year' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('players')
      .insert([
        {
          first_name,
          last_name,
          birth_year: year,
          team: team || null,
          image_url: image_url || null,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating player:', error)
      return NextResponse.json({ error: 'Failed to create player', details: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}


