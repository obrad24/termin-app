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

    // Parsiraj JSON polja za dodatne kvote (Supabase vraća JSONB kao objekat ili string)
    const parsedData: any = { ...data }
    if (data.total_goals_odds) {
      if (typeof data.total_goals_odds === 'string') {
        try {
          parsedData.total_goals_odds = JSON.parse(data.total_goals_odds)
        } catch {
          parsedData.total_goals_odds = []
        }
      } else {
        parsedData.total_goals_odds = data.total_goals_odds
      }
    } else {
      parsedData.total_goals_odds = []
    }
    if (data.player_goals_odds) {
      if (typeof data.player_goals_odds === 'string') {
        try {
          parsedData.player_goals_odds = JSON.parse(data.player_goals_odds)
        } catch {
          parsedData.player_goals_odds = []
        }
      } else {
        parsedData.player_goals_odds = data.player_goals_odds
      }
    } else {
      parsedData.player_goals_odds = []
    }
    if (data.over_under_odds) {
      if (typeof data.over_under_odds === 'string') {
        try {
          parsedData.over_under_odds = JSON.parse(data.over_under_odds)
        } catch {
          parsedData.over_under_odds = []
        }
      } else {
        parsedData.over_under_odds = data.over_under_odds
      }
    } else {
      parsedData.over_under_odds = []
    }

    // Vrati podatke sa praznim nizom golova (golovi se čuvaju u match_goals tabeli kada se meč prebaci u results)
    return NextResponse.json({
      ...parsedData,
      goals: [] // Golovi će se učitati kada se meč prebaci u results tabelu
    })
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
    const { 
      home_team, 
      away_team, 
      match_date, 
      odds_1, 
      odds_x, 
      odds_2,
      match_result,
      home_score,
      away_score,
      total_goals,
      goals,
      total_goals_odds,
      player_goals_odds,
      over_under_odds
    } = body

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

    // Pripremi podatke za čuvanje
    const updateData: any = {
      home_team,
      away_team,
      match_date: match_date || null,
      odds_1: odds_1 ? parseFloat(odds_1) : null,
      odds_x: odds_x ? parseFloat(odds_x) : null,
      odds_2: odds_2 ? parseFloat(odds_2) : null,
      updated_at: new Date().toISOString(),
    }

    // Dodaj opcione podatke o rezultatu ako postoje
    if (match_result !== undefined && match_result !== null && match_result !== '') {
      updateData.match_result = match_result
    }
    if (home_score !== undefined && home_score !== null) {
      updateData.home_score = parseInt(home_score)
    }
    if (away_score !== undefined && away_score !== null) {
      updateData.away_score = parseInt(away_score)
    }
    if (total_goals !== undefined && total_goals !== null) {
      updateData.total_goals = parseInt(total_goals)
    }
    // Dodaj dodatne kvote kao JSONB (Supabase automatski konvertuje objekte u JSONB)
    if (total_goals_odds !== undefined && total_goals_odds !== null && Array.isArray(total_goals_odds)) {
      updateData.total_goals_odds = total_goals_odds
    }
    if (player_goals_odds !== undefined && player_goals_odds !== null && Array.isArray(player_goals_odds)) {
      updateData.player_goals_odds = player_goals_odds
    }
    if (over_under_odds !== undefined && over_under_odds !== null && Array.isArray(over_under_odds)) {
      updateData.over_under_odds = over_under_odds
    }

    if (existing) {
      // Ažuriraj postojeći red
      const { data, error } = await supabase
        .from('next_match')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating next match:', error)
        // Ako greška kaže da kolone ne postoje, probaj bez njih
        if (error.message?.includes('match_result') || error.message?.includes('home_score') || error.message?.includes('away_score') || error.message?.includes('total_goals')) {
          console.warn('Rezultat kolone ne postoje, pokušavam bez njih')
          const { data: retryData, error: retryError } = await supabase
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

          if (retryError) {
            return NextResponse.json(
              { error: 'Failed to update next match', details: retryError.message },
              { status: 500 }
            )
          }
          return NextResponse.json(retryData, { status: 200 })
        }
        return NextResponse.json(
          { error: 'Failed to update next match', details: error.message },
          { status: 500 }
        )
      }

      // Ako postoje golovi, čuvaj ih u posebnoj tabeli (možemo koristiti match_goals sa result_id = -1 ili kreirati novu tabelu)
      // Za sada ćemo samo vratiti podatke, golovi će se čuvati kada se meč prebaci u results tabelu
      return NextResponse.json({ ...data, goals: goals || [] }, { status: 200 })
    } else {
      // Kreiraj novi red
      const insertData: any = {
        home_team,
        away_team,
        match_date: match_date || null,
        odds_1: odds_1 ? parseFloat(odds_1) : null,
        odds_x: odds_x ? parseFloat(odds_x) : null,
        odds_2: odds_2 ? parseFloat(odds_2) : null,
      }

      // Dodaj opcione podatke o rezultatu ako postoje
      if (match_result !== undefined && match_result !== null && match_result !== '') {
        insertData.match_result = match_result
      }
      if (home_score !== undefined && home_score !== null) {
        insertData.home_score = parseInt(home_score)
      }
      if (away_score !== undefined && away_score !== null) {
        insertData.away_score = parseInt(away_score)
      }
      if (total_goals !== undefined && total_goals !== null) {
        insertData.total_goals = parseInt(total_goals)
      }
      // Dodaj dodatne kvote kao JSONB (Supabase automatski konvertuje objekte u JSONB)
      if (total_goals_odds !== undefined && total_goals_odds !== null && Array.isArray(total_goals_odds)) {
        insertData.total_goals_odds = total_goals_odds
      }
      if (player_goals_odds !== undefined && player_goals_odds !== null && Array.isArray(player_goals_odds)) {
        insertData.player_goals_odds = player_goals_odds
      }
      if (over_under_odds !== undefined && over_under_odds !== null && Array.isArray(over_under_odds)) {
        insertData.over_under_odds = over_under_odds
      }

      const { data, error } = await supabase
        .from('next_match')
        .insert([insertData])
        .select()
        .single()

      if (error) {
        console.error('Error creating next match:', error)
        // Ako greška kaže da kolone ne postoje, probaj bez njih
        if (error.message?.includes('match_result') || error.message?.includes('home_score') || error.message?.includes('away_score') || error.message?.includes('total_goals')) {
          console.warn('Rezultat kolone ne postoje, pokušavam bez njih')
          const { data: retryData, error: retryError } = await supabase
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

          if (retryError) {
            return NextResponse.json(
              { error: 'Failed to create next match', details: retryError.message },
              { status: 500 }
            )
          }
          return NextResponse.json({ ...retryData, goals: goals || [] }, { status: 201 })
        }
        return NextResponse.json(
          { error: 'Failed to create next match', details: error.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ ...data, goals: goals || [] }, { status: 201 })
    }
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

