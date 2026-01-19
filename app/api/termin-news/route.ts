import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

// GET - Čitanje TerminNews teksta (javno dostupno)
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
      .from('termin_news')
      .select('*')
      .order('id', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error fetching termin news:', error)
      // Ako tabela ne postoji ili ima neku grešku, vrati prazan string
      return NextResponse.json({ content: '', updated_at: null }, { status: 200 })
    }

    // Ako nema podataka, vrati prazan string
    if (!data || data.length === 0) {
      return NextResponse.json({ 
        title: null,
        content: '', 
        updated_at: null,
        top_scorer: null
      }, { status: 200 })
    }

    const newsData = data[0]
    let topScorerData = null

    // Ako postoji top_scorer_id, uzmi podatke o igraču
    if (newsData.top_scorer_id) {
      const { data: playerData } = await supabase
        .from('players')
        .select('id, first_name, last_name, image_url, team')
        .eq('id', newsData.top_scorer_id)
        .single()

      if (playerData) {
        topScorerData = {
          id: playerData.id,
          first_name: playerData.first_name,
          last_name: playerData.last_name,
          image_url: playerData.image_url,
          team: playerData.team,
          comment: newsData.top_scorer_comment
        }
      }
    }

    return NextResponse.json(
      { 
        title: newsData.title || null,
        content: newsData.content || '',
        updated_at: newsData.updated_at || null,
        top_scorer: topScorerData
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Ažuriranje TerminNews teksta (samo admin)
export async function PUT(request: Request) {
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
    const { content } = body

    if (content === undefined) {
      return NextResponse.json(
        { error: 'Missing required field: content' },
        { status: 400 }
      )
    }

    // Proveri da li postoji red u tabeli
    const { data: existingData, error: checkError } = await supabase
      .from('termin_news')
      .select('id')
      .limit(1)

    let result

    // Ako postoji red, ažuriraj ga
    if (existingData && existingData.length > 0) {
      const { data, error } = await supabase
        .from('termin_news')
        .update({ content: content || '' })
        .eq('id', existingData[0].id)
        .select()

      if (error) {
        console.error('Error updating termin news:', error)
        return NextResponse.json(
          { error: 'Failed to update termin news', details: error.message },
          { status: 500 }
        )
      }

      result = data && data.length > 0 ? data[0] : null
    } else {
      // Kreiraj novi red
      const { data, error } = await supabase
        .from('termin_news')
        .insert({ content: content || '' })
        .select()

      if (error) {
        console.error('Error creating termin news:', error)
        return NextResponse.json(
          { error: 'Failed to create termin news', details: error.message },
          { status: 500 }
        )
      }

      result = data && data.length > 0 ? data[0] : null
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to save termin news' },
        { status: 500 }
      )
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
