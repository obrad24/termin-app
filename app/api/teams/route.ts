import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

// GET - svi timovi
export async function GET() {
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

    // Vrati samo timove Murinjo i Lalat
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .in('name', ['Murinjo', 'Lalat'])
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching teams:', error)
      return NextResponse.json({ error: 'Failed to fetch teams', details: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

// POST - dodavanje tima (logo_url se šalje iz frontenda posle upload-a)
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

    // Provera autentifikacije
    const authCheck = await requireAuth()
    if (authCheck.error) {
      return authCheck.response
    }

    const body = await request.json()
    const { name, short_name, logo_url } = body

    if (!name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Dozvoli samo dva tima: Murinjo i Lalat
    const allowedTeams = ['Murinjo', 'Lalat']
    if (!allowedTeams.includes(name)) {
      return NextResponse.json(
        { error: `Dozvoljeni su samo timovi: ${allowedTeams.join(', ')}` },
        { status: 400 }
      )
    }

    // Proveri da li tim već postoji
    const { data: existingTeam } = await supabase
      .from('teams')
      .select('id')
      .eq('name', name)
      .single()

    if (existingTeam) {
      // Ažuriraj postojeći tim umesto da kreira novi
      const { data, error } = await supabase
        .from('teams')
        .update({
          short_name: short_name || null,
          logo_url: logo_url || null,
        })
        .eq('name', name)
        .select()
        .single()

      if (error) {
        console.error('Error updating team:', error)
        return NextResponse.json({ error: 'Failed to update team', details: error.message }, { status: 500 })
      }

      return NextResponse.json(data, { status: 200 })
    }

    const { data, error } = await supabase
      .from('teams')
      .insert([
        {
          name,
          short_name: short_name || null,
          logo_url: logo_url || null,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating team:', error)
      return NextResponse.json({ error: 'Failed to create team', details: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}


