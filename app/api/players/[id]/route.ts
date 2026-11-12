import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

// Onemogući cache-ovanje - osvježavaj podatke svaki put
export const revalidate = 15

const parseSeasonId = (request: Request): number | null => {
  const { searchParams } = new URL(request.url)
  const seasonIdParam = searchParams.get('season_id')
  if (!seasonIdParam) return null
  const seasonId = parseInt(seasonIdParam, 10)
  return Number.isNaN(seasonId) ? null : seasonId
}

// GET - Dobijanje podataka o igraču sa statistikama
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id: idParam } = await params
    const id = parseInt(idParam, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const seasonId = parseSeasonId(request)

    // Dobijanje podataka o igraču
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('id', id)
      .single()

    if (playerError || !player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    // Ako je tražena sezona, pokušaj da učitaš sezonski tim
    if (seasonId) {
      const { data: seasonTeamData, error: seasonTeamError } = await supabase
        .from('player_season_teams')
        .select('team')
        .eq('player_id', id)
        .eq('season_id', seasonId)
        .maybeSingle()

      if (!seasonTeamError && seasonTeamData) {
        player.team = seasonTeamData.team || null
      }
    }

    const toNum = (value: unknown) => {
      const n = typeof value === 'string' ? parseInt(value, 10) : Number(value)
      return Number.isFinite(n) ? n : null
    }

    // Parallel: existing matches + player goals + appearances
    const [
      { data: existingResults, error: resultsError },
      { data: goalsData },
      { data: matchPlayers },
    ] = await Promise.all([
      supabase.from('results').select('id'),
      supabase
        .from('match_goals')
        .select('id, goal_minute, team_type, result_id')
        .eq('player_id', id)
        .not('result_id', 'is', null),
      supabase
        .from('match_players')
        .select('result_id, team_type')
        .eq('player_id', id)
        .not('result_id', 'is', null),
    ])

    if (resultsError) {
      console.error('Error fetching results:', resultsError)
    }

    const existingResultIds = new Set<number>()
    ;(existingResults || []).forEach((result: any) => {
      const resultId = toNum(result.id)
      if (resultId != null) existingResultIds.add(resultId)
    })

    const validGoalsData =
      goalsData?.filter((goal) => {
        const resultId = toNum(goal.result_id)
        return resultId != null && existingResultIds.has(resultId)
      }) || []

    const goalsCount = validGoalsData.length

    const validMatchPlayers =
      matchPlayers?.filter((mp) => {
        const resultId = toNum(mp.result_id)
        return resultId != null && existingResultIds.has(resultId)
      }) || []

    const uniqueMatches = new Set(validMatchPlayers.map((mp) => mp.result_id))
    const matchesPlayed = uniqueMatches.size

    let goalsWithMatches: any[] = []
    if (validGoalsData.length > 0) {
      const resultIds = [...new Set(validGoalsData.map((g) => g.result_id))]
      const { data: resultsData } = await supabase
        .from('results')
        .select('id, home_team, away_team, home_score, away_score, date')
        .in('id', resultIds)
        .order('date', { ascending: false })

      const resultById = new Map(
        (resultsData || []).map((r: any) => [toNum(r.id) ?? r.id, r]),
      )

      goalsWithMatches = validGoalsData
        .map((goal) => ({
          ...goal,
          results: resultById.get(toNum(goal.result_id) ?? goal.result_id) || null,
        }))
        .filter((goal) => goal.results !== null)
        .sort((a, b) => {
          if (!a.results || !b.results) return 0
          return new Date(b.results.date).getTime() - new Date(a.results.date).getTime()
        })
    }

    // Form / fixtures: GW broj = redni broj meča u sezoni (po datumu)
    let matchForm: any[] = []
    {
      let seasonResultsQuery = supabase
        .from('results')
        .select('id, home_team, away_team, home_score, away_score, date, season_id')
        .order('date', { ascending: true })
        .order('id', { ascending: true })

      if (seasonId) {
        seasonResultsQuery = seasonResultsQuery.eq('season_id', seasonId)
      }

      const toNum = (value: unknown): number | null => {
        const n = typeof value === 'string' ? parseInt(value, 10) : Number(value)
        return Number.isFinite(n) ? n : null
      }

      const { data: seasonResults } = await seasonResultsQuery
      const gwByResultId = new Map<number, number>()
      ;(seasonResults || []).forEach((result: any, index: number) => {
        const rid = toNum(result.id)
        if (rid != null) gwByResultId.set(rid, index + 1)
      })

      const goalsByResultId = new Map<number, number>()
      ;(goalsData || []).forEach((goal: any) => {
        const resultId = toNum(goal.result_id)
        if (resultId == null || !existingResultIds.has(resultId)) return
        goalsByResultId.set(resultId, (goalsByResultId.get(resultId) || 0) + 1)
      })

      const playedResultIds = [
        ...new Set(
          validMatchPlayers
            .map((mp) => toNum(mp.result_id))
            .filter((id): id is number => id != null),
        ),
      ]

      // Also include matches where the player scored (even if match_players row is missing)
      goalsByResultId.forEach((_count, resultId) => {
        if (!playedResultIds.includes(resultId)) playedResultIds.push(resultId)
      })

      if (playedResultIds.length > 0) {
        const { data: playedResults } = await supabase
          .from('results')
          .select('id, home_team, away_team, home_score, away_score, date, season_id')
          .in('id', playedResultIds)
          .order('date', { ascending: true })
          .order('id', { ascending: true })

        const teamTypeByResultId = new Map<number, 'home' | 'away'>()
        validMatchPlayers.forEach((mp: any) => {
          const resultId = toNum(mp.result_id)
          if (resultId != null && mp.team_type) {
            teamTypeByResultId.set(resultId, mp.team_type)
          }
        })
        // Infer side from goals when appearance row is missing
        ;(goalsData || []).forEach((goal: any) => {
          const resultId = toNum(goal.result_id)
          if (resultId == null || teamTypeByResultId.has(resultId)) return
          if (goal.team_type === 'home' || goal.team_type === 'away') {
            teamTypeByResultId.set(resultId, goal.team_type)
          }
        })

        matchForm = (playedResults || [])
          .filter((result: any) => {
            if (!seasonId) return true
            const sid = toNum(result.season_id)
            return sid === seasonId
          })
          .map((result: any) => {
            const matchId = toNum(result.id)
            if (matchId == null) return null
            const teamType = teamTypeByResultId.get(matchId) || 'home'
            const isHome = teamType === 'home'
            return {
              matchId,
              gameweek: gwByResultId.get(matchId) ?? null,
              date: result.date,
              home_team: result.home_team,
              away_team: result.away_team,
              home_score: Number(result.home_score) || 0,
              away_score: Number(result.away_score) || 0,
              isHome,
              opponent: isHome ? result.away_team : result.home_team,
              playerGoals: goalsByResultId.get(matchId) || 0,
              fantasyPoints: 0,
            }
          })
          .filter((m: any) => m && m.gameweek != null)

        // Attach fantasy points per match
        if (matchForm.length > 0) {
          const formResultIds = matchForm.map((m: any) => m.matchId)
          const { data: fantasyRows } = await supabase
            .from('fantasy_match_points')
            .select('result_id, total_points')
            .eq('player_id', id)
            .in('result_id', formResultIds)

          const fantasyByResult = new Map<number, number>()
          ;(fantasyRows || []).forEach((row: any) => {
            const rid = toNum(row.result_id)
            if (rid != null) fantasyByResult.set(rid, Number(row.total_points) || 0)
          })
          matchForm = matchForm.map((m: any) => ({
            ...m,
            fantasyPoints: fantasyByResult.get(m.matchId) || 0,
          }))
        }
      }
    }

    // Upcoming fixture from next_match (if player's team is involved)
    let nextFixture: any = null
    {
      const playerTeam = player.team || null
      const { data: nextMatch } = await supabase
        .from('next_match')
        .select('id, home_team, away_team, match_date')
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (nextMatch && playerTeam && (nextMatch.home_team === playerTeam || nextMatch.away_team === playerTeam)) {
        const isHome = nextMatch.home_team === playerTeam
        const nextGw =
          (matchForm.length > 0
            ? Math.max(...matchForm.map((m: any) => m.gameweek || 0))
            : 0) + 1
        nextFixture = {
          gameweek: nextGw,
          opponent: isHome ? nextMatch.away_team : nextMatch.home_team,
          isHome,
          date: nextMatch.match_date || null,
          difficulty: 3,
        }
      }
    }

    // Matches where this player finished as fan-vote MVP (+3 fantasy pts)
    let mvpMatches: any[] = []
    {
      let mvpQuery = supabase
        .from('fantasy_match_points')
        .select('result_id, gameweek, voting_points, total_points, season_id')
        .eq('player_id', id)
        .eq('voting_points', 3)
        .order('gameweek', { ascending: false })

      if (seasonId) mvpQuery = mvpQuery.eq('season_id', seasonId)

      const { data: mvpRows } = await mvpQuery
      if (mvpRows && mvpRows.length > 0) {
        const resultIds = [
          ...new Set(
            mvpRows
              .map((r: any) =>
                typeof r.result_id === 'string' ? parseInt(r.result_id, 10) : Number(r.result_id),
              )
              .filter((n: number) => Number.isFinite(n)),
          ),
        ]
        const { data: mvpResults } = await supabase
          .from('results')
          .select('id, home_team, away_team, home_score, away_score, date')
          .in('id', resultIds)

        const resultById = new Map(
          (mvpResults || []).map((r: any) => [Number(r.id), r]),
        )

        mvpMatches = mvpRows
          .map((row: any) => {
            const rid = Number(row.result_id)
            const result = resultById.get(rid)
            if (!result) return null
            return {
              result_id: rid,
              gameweek: Number(row.gameweek) || null,
              date: result.date,
              home_team: result.home_team,
              away_team: result.away_team,
              home_score: result.home_score,
              away_score: result.away_score,
              fantasy_points: Number(row.total_points) || 0,
            }
          })
          .filter(Boolean)
      }
    }

    const { jsonCached } = await import('@/lib/http-cache')
    return jsonCached(
      {
        ...player,
        goals: goalsCount,
        matches_played: matchesPlayed,
        goals_details: goalsWithMatches,
        match_form: matchForm,
        next_fixture: nextFixture,
        mvp_matches: mvpMatches,
      },
      { seconds: 15 },
    )
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

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
    const { 
      first_name, 
      last_name, 
      birth_year, 
      team, 
      image_url,
      price,
      pace,
      shooting,
      passing,
      dribbling,
      defending,
      physical,
      stamina,
      injury,
      rating_bonus,
      season_id
    } = body

    const id = parseInt(idParam, 10)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const parsedSeasonId = season_id ? parseInt(String(season_id), 10) : null

    if (!first_name || !last_name || !birth_year) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const year = parseInt(String(birth_year), 10)
    if (isNaN(year)) {
      return NextResponse.json({ error: 'Invalid birth year' }, { status: 400 })
    }

    // Validacija ocena (0-100)
    const validateRating = (rating: any): number | null => {
      if (rating === null || rating === undefined || rating === '') return null
      const num = parseInt(String(rating), 10)
      if (isNaN(num) || num < 0 || num > 100) return null
      return num
    }

    // Validacija rating_bonus (može biti negativan ili pozitivan)
    const validateRatingBonus = (bonus: any): number | null => {
      if (bonus === null || bonus === undefined || bonus === '') return null
      const num = parseInt(String(bonus), 10)
      if (isNaN(num)) return null
      return num
    }

    const parsePrice = (value: any): number | null => {
      if (value === null || value === undefined || value === '') return null
      const n = typeof value === 'number' ? value : parseFloat(String(value))
      if (Number.isNaN(n) || n < 0 || n > 99.9) return null
      return Math.round(n * 10) / 10
    }

    const { data, error } = await supabase
      .from('players')
      .update({
        first_name,
        last_name,
        birth_year: year,
        team: team || null,
        image_url: image_url || null,
        price: parsePrice(price),
        pace: validateRating(pace),
        shooting: validateRating(shooting),
        passing: validateRating(passing),
        dribbling: validateRating(dribbling),
        defending: validateRating(defending),
        physical: validateRating(physical),
        stamina: validateRating(stamina),
        injury: injury === true || injury === 'true' ? true : (injury === false || injury === 'false' ? false : null),
        rating_bonus: validateRatingBonus(rating_bonus),
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

    if (parsedSeasonId && !Number.isNaN(parsedSeasonId)) {
      const { error: seasonTeamError } = await supabase
        .from('player_season_teams')
        .upsert(
          [
            {
              player_id: id,
              season_id: parsedSeasonId,
              team: team || null,
            },
          ],
          { onConflict: 'player_id,season_id' },
        )

      if (seasonTeamError) {
        console.warn('Failed to save seasonal player team:', seasonTeamError.message)
      }
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

