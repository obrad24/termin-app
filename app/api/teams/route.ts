import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

const parseSeasonId = (request: Request): number | null => {
  const { searchParams } = new URL(request.url)
  const seasonIdParam = searchParams.get('season_id')
  if (!seasonIdParam) return null
  const seasonId = parseInt(seasonIdParam, 10)
  return Number.isNaN(seasonId) ? null : seasonId
}

// GET - svi timovi (opciono filtrirano po sezoni)
export async function GET(request: Request) {
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

    const seasonId = parseSeasonId(request)

    let data: any[] | null = null
    let error: any = null

    if (seasonId) {
      const seasonTeamsResult = await supabase
        .from('season_teams')
        .select(`
          team_id,
          teams (*)
        `)
        .eq('season_id', seasonId)

      if (seasonTeamsResult.error) {
        // Fallback kada tabela season_teams još ne postoji
        console.warn('season_teams lookup failed, returning all teams fallback:', seasonTeamsResult.error.message)
        const fallback = await supabase
          .from('teams')
          .select('*')
          .order('name', { ascending: true })
        data = fallback.data
        error = fallback.error
      } else {
        data = (seasonTeamsResult.data || [])
          .map((row: any) => row.teams)
          .filter(Boolean)
          .sort((a: any, b: any) => String(a.name).localeCompare(String(b.name)))
      }
    } else {
      const allTeamsResult = await supabase
        .from('teams')
        .select('*')
        .order('name', { ascending: true })
      data = allTeamsResult.data
      error = allTeamsResult.error
    }

    if (error) {
      console.error('Error fetching teams:', error)
      return NextResponse.json({ error: 'Failed to fetch teams', details: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('Error:', error)
    
    // Proveri da li je timeout greška
    if (error.message?.includes('timeout') || error.message?.includes('TIMEOUT') || error.cause?.code === 'UND_ERR_CONNECT_TIMEOUT') {
      return NextResponse.json(
        { 
          error: 'Connection timeout',
          message: 'Supabase connection timed out. Please check your network connection and Supabase URL.',
          details: error.message,
          hint: 'Verify that NEXT_PUBLIC_SUPABASE_URL is correct and that your Supabase project is active.'
        },
        { status: 504 }
      )
    }
    
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
    const { name, short_name, logo_url, season_id } = body

    if (!name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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

      const parsedSeasonIdRaw = season_id ? parseInt(String(season_id), 10) : null
      const parsedSeasonId = parsedSeasonIdRaw && !Number.isNaN(parsedSeasonIdRaw) ? parsedSeasonIdRaw : null

      if (parsedSeasonId) {
        const { error: seasonTeamError } = await supabase
          .from('season_teams')
          .upsert(
            [{ season_id: parsedSeasonId, team_id: data.id }],
            { onConflict: 'season_id,team_id' },
          )
        if (seasonTeamError) {
          console.warn('Failed to upsert season_teams relation:', seasonTeamError.message)
        }
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

    const parsedSeasonIdRaw = season_id ? parseInt(String(season_id), 10) : null
    const parsedSeasonId = parsedSeasonIdRaw && !Number.isNaN(parsedSeasonIdRaw) ? parsedSeasonIdRaw : null

    if (parsedSeasonId) {
      const { error: seasonTeamError } = await supabase
        .from('season_teams')
        .upsert(
          [{ season_id: parsedSeasonId, team_id: data.id }],
          { onConflict: 'season_id,team_id' },
        )
      if (seasonTeamError) {
        console.warn('Failed to upsert season_teams relation:', seasonTeamError.message)
      }
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Error:', error)
    
    // Proveri da li je timeout greška
    if (error.message?.includes('timeout') || error.message?.includes('TIMEOUT') || error.cause?.code === 'UND_ERR_CONNECT_TIMEOUT') {
      return NextResponse.json(
        { 
          error: 'Connection timeout',
          message: 'Supabase connection timed out. Please check your network connection and Supabase URL.',
          details: error.message,
          hint: 'Verify that NEXT_PUBLIC_SUPABASE_URL is correct and that your Supabase project is active.'
        },
        { status: 504 }
      )
    }
    
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}


