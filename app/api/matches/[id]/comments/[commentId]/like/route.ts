import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

// POST - Lajkovanje ili dislajkovanje komentara
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
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

    const { commentId: commentIdParam } = await params
    const commentId = parseInt(commentIdParam, 10)
    
    if (isNaN(commentId)) {
      return NextResponse.json(
        { error: 'Invalid comment ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { like_type } = body

    // Validacija
    if (!like_type || (like_type !== 'like' && like_type !== 'dislike')) {
      return NextResponse.json(
        { error: 'like_type must be "like" or "dislike"' },
        { status: 400 }
      )
    }

    // Dobijanje IP adrese korisnika
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'

    // Provjera da li komentar postoji
    const { data: comment, error: commentError } = await supabase
      .from('match_comments')
      .select('id')
      .eq('id', commentId)
      .single()

    if (commentError || !comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Provjera da li korisnik već lajkovao/dislajkovao ovaj komentar
    const { data: existingLike, error: checkError } = await supabase
      .from('match_comment_likes')
      .select('id, like_type')
      .eq('comment_id', commentId)
      .eq('user_ip', ip)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing like:', checkError)
      return NextResponse.json(
        { error: 'Failed to check existing like', details: checkError.message },
        { status: 500 }
      )
    }

    if (existingLike) {
      // Ako korisnik već ima isti tip lajka, ukloni ga (toggle off)
      if (existingLike.like_type === like_type) {
        const { error: deleteError } = await supabase
          .from('match_comment_likes')
          .delete()
          .eq('id', existingLike.id)

        if (deleteError) {
          console.error('Error deleting like:', deleteError)
          return NextResponse.json(
            { error: 'Failed to remove like', details: deleteError.message },
            { status: 500 }
          )
        }

        return NextResponse.json({ success: true, action: 'removed', like_type: null })
      } else {
        // Ako korisnik ima suprotan tip lajka, promijeni ga (toggle)
        const { data, error: updateError } = await supabase
          .from('match_comment_likes')
          .update({ like_type })
          .eq('id', existingLike.id)
          .select()
          .single()

        if (updateError) {
          console.error('Error updating like:', updateError)
          return NextResponse.json(
            { error: 'Failed to update like', details: updateError.message },
            { status: 500 }
          )
        }

        return NextResponse.json({ success: true, action: 'updated', like_type, data })
      }
    } else {
      // Kreiranje novog lajka/dislajka
      const { data, error: insertError } = await supabase
        .from('match_comment_likes')
        .insert({
          comment_id: commentId,
          like_type,
          user_ip: ip
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error inserting like:', insertError)
        return NextResponse.json(
          { error: 'Failed to add like', details: insertError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, action: 'added', like_type, data })
    }
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
