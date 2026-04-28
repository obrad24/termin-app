import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

// Onemogući cache-ovanje - osvježavaj podatke svaki put
export const dynamic = 'force-dynamic'
export const revalidate = 0

const parseSeasonId = (request: Request): number | null => {
  const { searchParams } = new URL(request.url)
  const seasonIdParam = searchParams.get('season_id')
  if (!seasonIdParam) return null
  const seasonId = parseInt(seasonIdParam, 10)
  return Number.isNaN(seasonId) ? null : seasonId
}

const getSeasonTeamMap = async (seasonId: number | null) => {
  if (!seasonId) return new Map<number, string | null>()

  const { data, error } = await supabase
    .from('player_season_teams')
    .select('player_id, team')
    .eq('season_id', seasonId)

  if (error) {
    // Ako tabela još nije kreirana, samo koristi fallback na players.team
    console.warn('player_season_teams lookup failed, using players.team fallback:', error.message)
    return new Map<number, string | null>()
  }

  const map = new Map<number, string | null>()
  ;(data || []).forEach((item: any) => {
    const playerId = typeof item.player_id === 'string' ? parseInt(item.player_id, 10) : item.player_id
    if (typeof playerId === 'number' && !Number.isNaN(playerId)) {
      map.set(playerId, item.team || null)
    }
  })
  return map
}

const upsertSeasonTeam = async (playerId: number, seasonId: number | null, team: string | null) => {
  if (!seasonId) return
  const { error } = await supabase
    .from('player_season_teams')
    .upsert(
      [
        {
          player_id: playerId,
          season_id: seasonId,
          team: team || null,
        },
      ],
      { onConflict: 'player_id,season_id' },
    )

  if (error) {
    console.warn('player_season_teams upsert failed:', error.message)
  }
}

// GET - svi igrači
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

    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching players:', error)
      return NextResponse.json({ error: 'Failed to fetch players', details: error.message }, { status: 500 })
    }

    const seasonTeamMap = await getSeasonTeamMap(seasonId)
    const playersWithSeasonTeam = (data || []).map((player: any) => {
      if (!seasonTeamMap.has(player.id)) return player
      return {
        ...player,
        team: seasonTeamMap.get(player.id) ?? null,
      }
    })

    const response = NextResponse.json(playersWithSeasonTeam)
    // Dodaj headere da se osigura da se ne cache-uje
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    return response
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
    const { first_name, last_name, birth_year, team, image_url, season_id } = body

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

    const parsedSeasonIdRaw = season_id ? parseInt(String(season_id), 10) : null
    const parsedSeasonId =
      parsedSeasonIdRaw !== null && !Number.isNaN(parsedSeasonIdRaw) ? parsedSeasonIdRaw : null
    await upsertSeasonTeam(data.id, parsedSeasonId, team || null)

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}


