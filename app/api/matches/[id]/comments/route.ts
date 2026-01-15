import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

// GET - Dobijanje komentara za utakmicu
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: idParam } = await params
    const id = parseInt(idParam, 10)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid ID' },
        { status: 400 }
      )
    }

    // Dobijanje komentara sortiranih po datumu (najnoviji prvi)
    const { data: comments, error } = await supabase
      .from('match_comments')
      .select('*')
      .eq('match_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching comments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch comments', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(comments || [], { status: 200 })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Dodavanje novog komentara
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: idParam } = await params
    const id = parseInt(idParam, 10)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { nickname, comment } = body

    // Validacija
    if (!nickname || !comment) {
      return NextResponse.json(
        { error: 'Nickname and comment are required' },
        { status: 400 }
      )
    }

    if (nickname.trim().length === 0 || comment.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nickname and comment cannot be empty' },
        { status: 400 }
      )
    }

    if (nickname.length > 50) {
      return NextResponse.json(
        { error: 'Nickname must be 50 characters or less' },
        { status: 400 }
      )
    }

    if (comment.length > 1000) {
      return NextResponse.json(
        { error: 'Comment must be 1000 characters or less' },
        { status: 400 }
      )
    }

    // Provera da li utakmica postoji
    const { data: match, error: matchError } = await supabase
      .from('results')
      .select('id')
      .eq('id', id)
      .single()

    if (matchError || !match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    // Dodavanje komentara
    const { data: newComment, error: insertError } = await supabase
      .from('match_comments')
      .insert({
        match_id: id,
        nickname: nickname.trim(),
        comment: comment.trim(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting comment:', insertError)
      return NextResponse.json(
        { error: 'Failed to add comment', details: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(newComment, { status: 201 })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
