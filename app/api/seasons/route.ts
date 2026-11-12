import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { jsonCached } from '@/lib/http-cache'

export const revalidate = 60

// GET - sve sezone
export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error: 'Database not configured',
          message: 'Please set DATABASE_URL environment variable (Neon)',
        },
        { status: 503 },
      )
    }

    const { data, error } = await supabase
      .from('seasons')
      .select('*')
      .order('id', { ascending: false })

    if (error) {
      console.error('Error fetching seasons:', error)
      return NextResponse.json(
        { error: 'Failed to fetch seasons', details: error.message },
        { status: 500 },
      )
    }

    return jsonCached(data || [], { seconds: 60 })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 },
    )
  }
}

// POST - kreiranje nove sezone (admin)
export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error: 'Database not configured',
          message: 'Please set DATABASE_URL environment variable (Neon)',
        },
        { status: 503 },
      )
    }

    const authCheck = await requireAuth()
    if (authCheck.error) {
      return authCheck.response
    }

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 },
      )
    }

    const { data, error } = await supabase
      .from('seasons')
      .insert([{ name }])
      .select()
      .single()

    if (error) {
      console.error('Error creating season:', error)
      return NextResponse.json(
        { error: 'Failed to create season', details: error.message },
        { status: 500 },
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 },
    )
  }
}

