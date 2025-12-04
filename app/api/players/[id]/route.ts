import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

// DELETE - brisanje igrača
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id: idParam } = await params
    const body = await request.json()

    const id = parseInt(idParam, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const { error } = await supabase.from('players').delete().eq('id', id)

    if (error) {
      console.error('Error deleting player:', error)
      return NextResponse.json({ error: 'Failed to delete player', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

// PUT - Ažuriranje igrača (admin)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: idParam } = await params
    const body = await request.json()
    const { first_name, last_name, birth_year, team, image_url } = body

    const id = parseInt(idParam, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    if (!first_name || !last_name || !birth_year) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const year = parseInt(String(birth_year), 10)
    if (isNaN(year)) {
      return NextResponse.json({ error: 'Invalid birth year' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('players')
      .update({
        first_name,
        last_name,
        birth_year: year,
        team: team || null,
        image_url: image_url || null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating player:', error)
      return NextResponse.json(
        { error: 'Failed to update player', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

