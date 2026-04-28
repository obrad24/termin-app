import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// DELETE /api/seasons/[id] - brisanje sezone (admin)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const authCheck = await requireAuth()
    if (authCheck.error) {
      return authCheck.response
    }

    const { id: idParam } = await params
    const id = parseInt(idParam, 10)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid ID' },
        { status: 400 },
      )
    }

    // Ne dozvoli brisanje ako postoje rezultati vezani za ovu sezonu
    const { data: relatedResults, error: relatedError } = await supabase
      .from('results')
      .select('id')
      .eq('season_id', id)
      .limit(1)

    if (relatedError) {
      console.error('Error checking related results:', relatedError)
    }

    if (relatedResults && relatedResults.length > 0) {
      return NextResponse.json(
        { error: 'Sezona ima povezane rezultate i ne može biti obrisana' },
        { status: 400 },
      )
    }

    const { error } = await supabase
      .from('seasons')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting season:', error)
      return NextResponse.json(
        { error: 'Failed to delete season', details: error.message },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 },
    )
  }
}

