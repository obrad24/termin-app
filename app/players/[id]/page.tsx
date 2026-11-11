'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/header'
import Image from 'next/image'
import { ArrowLeft, Ambulance, X } from 'lucide-react'
import { format } from 'date-fns'
import { Team } from '@/lib/supabase'
import { getPlayerImageUrl } from '@/lib/image-utils'
import { SHOW_PLAYER_RATINGS } from '@/lib/features'
import { useSeason } from '@/components/season-provider'

interface MatchFormItem {
  matchId: number
  gameweek: number
  date: string
  home_team: string
  away_team: string
  home_score: number
  away_score: number
  isHome: boolean
  opponent: string
  playerGoals: number
  fantasyPoints?: number
}

interface NextFixtureItem {
  gameweek: number
  opponent: string
  isHome: boolean
  date?: string | null
  difficulty?: number
}

interface PlayerWithStats {
  id: number
  first_name: string
  last_name: string
  birth_year: number
  team?: string | null
  image_url?: string | null
  goals: number
  matches_played: number
  pace?: number | null
  shooting?: number | null
  passing?: number | null
  dribbling?: number | null
  defending?: number | null
  physical?: number | null
  stamina?: number | null
  injury?: boolean | null
  rating_bonus?: number | null
  match_form?: MatchFormItem[]
  next_fixture?: NextFixtureItem | null
  goals_details: Array<{
    id: number
    goal_minute?: number | null
    team_type: 'home' | 'away'
    result_id: number
    results: {
      id: number
      home_team: string
      away_team: string
      home_score: number
      away_score: number
      date: string
    }
  }>
}

interface PlayerMatch extends MatchFormItem {
  opponentLogo: string
  opponentShort: string
}

function shortName(name: string, team?: Team | null) {
  if (team?.short_name) return team.short_name.toUpperCase()
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase()
  return parts.map((p) => p[0]).join('').slice(0, 3).toUpperCase()
}

export default function PlayerProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { currentSeason } = useSeason()
  const [player, setPlayer] = useState<PlayerWithStats | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [previousMatches, setPreviousMatches] = useState<PlayerMatch[]>([])
  const [nextFixture, setNextFixture] = useState<(NextFixtureItem & { opponentLogo: string; opponentShort: string }) | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTeams()
  }, [])

  useEffect(() => {
    if (params.id) {
      fetchPlayerData()
    }
  }, [params.id, currentSeason?.id])

  useEffect(() => {
    if (player && teams.length > 0) {
      buildFormMatches()
    }
  }, [player, teams])

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams')
      if (response.ok) {
        const data = await response.json()
        setTeams(data || [])
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }

  const getTeam = (teamName: string) => teams.find((t) => t.name === teamName) || null
  const getTeamLogo = (teamName: string) => getTeam(teamName)?.logo_url || '/placeholder-logo.svg'

  const buildFormMatches = () => {
    if (!player?.match_form) {
      setPreviousMatches([])
    } else {
      const enriched = player.match_form.map((match) => {
        const opponentTeam = getTeam(match.opponent)
        return {
          ...match,
          opponentLogo: getTeamLogo(match.opponent),
          opponentShort: shortName(match.opponent, opponentTeam),
        }
      })
      setPreviousMatches(enriched)
    }

    if (player?.next_fixture) {
      const opponentTeam = getTeam(player.next_fixture.opponent)
      setNextFixture({
        ...player.next_fixture,
        opponentLogo: getTeamLogo(player.next_fixture.opponent),
        opponentShort: shortName(player.next_fixture.opponent, opponentTeam),
      })
    } else {
      setNextFixture(null)
    }
  }

  const difficultyClass = (diff: number) => {
    if (diff <= 2) return 'bg-[var(--fpl-green)] text-[var(--fpl-purple)]'
    if (diff === 3) return 'bg-white text-[var(--fpl-purple)]'
    return 'bg-[var(--fpl-pink)] text-white'
  }

  const formResultClass = (match: PlayerMatch) => {
    const forScore = match.isHome ? match.home_score : match.away_score
    const againstScore = match.isHome ? match.away_score : match.home_score
    if (forScore > againstScore) return 'bg-[var(--fpl-green)] text-[var(--fpl-purple)]'
    if (forScore < againstScore) return 'bg-[var(--fpl-pink)] text-white'
    return 'bg-orange-500 text-white'
  }

  const fetchPlayerData = async () => {
    try {
      setLoading(true)
      const seasonQuery = currentSeason?.id ? `?season_id=${currentSeason.id}` : ''
      const response = await fetch(`/api/players/${params.id}${seasonQuery}`)
      if (response.ok) {
        const data = await response.json()
        setPlayer(data)
      } else if (response.status === 404) {
        router.push('/players')
      }
    } catch (error) {
      console.error('Error fetching player data:', error)
    } finally {
      setLoading(false)
    }
  }

  const overallRating = useMemo(() => {
    if (!player) return null
    const ratings = [
      player.pace,
      player.shooting,
      player.passing,
      player.dribbling,
      player.defending,
      player.physical,
      player.stamina,
    ].filter((r): r is number => r !== null && r !== undefined)

    if (ratings.length === 0) return null
    let average = Math.round(ratings.reduce((sum, r) => sum + r, 0) / ratings.length)
    if (player.rating_bonus != null) {
      average = Math.max(0, Math.min(100, average + player.rating_bonus))
    }
    return average
  }, [player])

  const goalsPerMatch =
    player && player.matches_played > 0
      ? (player.goals / player.matches_played).toFixed(1)
      : '0.0'

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--fpl-p120)] pb-20">
        <Header />
        <div className="text-white/60 text-center py-16 text-sm">Loading...</div>
      </main>
    )
  }

  if (!player) {
    return (
      <main className="min-h-screen bg-[var(--fpl-p120)] pb-20">
        <Header />
        <div className="text-white text-center py-16">
          <p className="mb-4">Player not found</p>
          <Link href="/players" className="text-white/70 underline">
            Back to players
          </Link>
        </div>
      </main>
    )
  }

  const attrRows = [
    { key: 'PAC', value: player.pace },
    { key: 'SHO', value: player.shooting },
    { key: 'PAS', value: player.passing },
    { key: 'DRI', value: player.dribbling },
    { key: 'DEF', value: player.defending },
    { key: 'PHY', value: player.physical },
    { key: 'STA', value: player.stamina },
  ].filter((a) => a.value != null)

  return (
    <main className="min-h-screen bg-[var(--fpl-p120)] pb-24 md:pb-8">
      <Header />

      <section className="relative px-3 sm:px-6 py-3 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-2">
          <Link
            href="/players"
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/15 transition"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => router.back()}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/15 transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hero identity card — FPL style */}
        <div className="relative rounded-xl overflow-hidden mb-2 bg-gradient-to-r from-[var(--fpl-cyan)] via-[#7a5cff] to-[var(--fpl-lilac)] min-h-[112px]">
          <div className="absolute left-0 bottom-0 w-[38%] h-full">
            <Image
              src={getPlayerImageUrl(player.image_url)}
              alt={`${player.first_name} ${player.last_name}`}
              fill
              className="object-contain object-bottom"
              priority
              unoptimized
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = '/no-image-player.png'
              }}
            />
          </div>

          <div className="relative z-10 pl-[36%] pr-3 py-3 flex flex-col justify-center min-h-[112px]">
            {player.injury && (
              <div className="mb-1 inline-flex items-center gap-1 self-start bg-white rounded-full px-1.5 py-0.5">
                <Ambulance className="w-3 h-3 text-red-600" />
                <span className="text-[9px] font-bold text-red-600 uppercase">Injured</span>
              </div>
            )}
            <p className="text-[var(--fpl-purple)]/80 text-[10px] font-semibold leading-none mb-0.5">
              {SHOW_PLAYER_RATINGS && overallRating != null ? `OVR ${overallRating}` : 'Player'}
            </p>
            <p className="text-[var(--fpl-purple)] text-sm font-medium leading-tight">
              {player.first_name}
            </p>
            <h1 className="text-[var(--fpl-purple)] text-xl sm:text-2xl font-black leading-tight">
              {player.last_name}
            </h1>
            {player.team && (
              <p className="text-[var(--fpl-purple)]/85 text-xs font-semibold mt-0.5">{player.team}</p>
            )}
          </div>
        </div>

        {/* Meta bar */}
        <div className="flex items-center justify-between px-0.5 mb-2 text-xs">
          <p className="text-white">
            Age:{' '}
            <span className="font-bold">
              {new Date().getFullYear() - player.birth_year}
            </span>
          </p>
          {player.team && (
            <div className="flex items-center gap-1.5 text-white/80">
              <div className="relative w-4 h-4">
                <Image
                  src={getTeamLogo(player.team)}
                  alt={player.team}
                  fill
                  className="object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/placeholder-logo.svg'
                  }}
                />
              </div>
              <span className="text-[11px] font-semibold">{player.team}</span>
            </div>
          )}
        </div>

        {/* Key stats */}
        <div className="rounded-xl bg-[var(--fpl-purple)] border border-white/10 mb-2">
          <div className="grid grid-cols-3 divide-x divide-white/10">
            <div className="px-2 py-2.5 text-center">
              <p className="text-white/50 text-[10px] leading-none mb-0.5">Goals</p>
              <p className="text-white text-xl font-bold leading-none">{player.goals}</p>
            </div>
            <div className="px-2 py-2.5 text-center">
              <p className="text-white/50 text-[10px] leading-none mb-0.5">Apps</p>
              <p className="text-white text-xl font-bold leading-none">{player.matches_played}</p>
            </div>
            <div className="px-2 py-2.5 text-center">
              <p className="text-white/50 text-[10px] leading-none mb-0.5">G / Match</p>
              <p className="text-white text-xl font-bold leading-none">{goalsPerMatch}</p>
            </div>
          </div>
        </div>

        {/* Attributes */}
        {SHOW_PLAYER_RATINGS && attrRows.length > 0 && (
          <div className="rounded-xl bg-[var(--fpl-purple)] border border-white/10 px-2 py-2 mb-2">
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
              {attrRows.map((attr) => (
                <div key={attr.key} className="text-center">
                  <p className="text-white/45 text-[9px] font-semibold tracking-wide leading-none">{attr.key}</p>
                  <p className="text-white text-base font-bold leading-tight">{attr.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form + Fixtures (FPL style) */}
        {(previousMatches.length > 0 || nextFixture) && (
          <div className="rounded-xl bg-[var(--fpl-purple)] border border-white/10 px-2.5 py-2.5 mb-2">
            <div className="flex gap-4 overflow-x-auto scrollbar-hide">
              {previousMatches.length > 0 && (
                <div className="shrink-0">
                  <p className="text-white font-bold text-xs mb-1.5 px-0.5">Form</p>
                  <div className="flex gap-2">
                    {previousMatches.slice(-6).map((match) => (
                      <Link
                        key={match.matchId}
                        href={`/matches/${match.matchId}`}
                        className="flex flex-col items-center gap-0.5 min-w-[44px]"
                      >
                        <span className="text-white/50 text-[10px] font-medium leading-none">
                          GW{match.gameweek}
                        </span>
                        <span className="text-white text-[10px] font-semibold tracking-wide leading-tight">
                          {match.opponentShort}
                        </span>
                        <span
                          className={`min-w-[40px] text-center text-[10px] font-bold px-2 py-0.5 rounded-full ${formResultClass(match)}`}
                        >
                          {match.fantasyPoints ?? 0}pts
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {nextFixture && (
                <div className="shrink-0">
                  <p className="text-white font-bold text-xs mb-1.5 px-0.5">Fixtures</p>
                  <div className="flex gap-2">
                    <div className="flex flex-col items-center gap-0.5 min-w-[44px]">
                      <span className="text-white/50 text-[10px] font-medium leading-none">
                        GW{nextFixture.gameweek}
                      </span>
                      <div className="relative w-6 h-6">
                        <Image
                          src={nextFixture.opponentLogo}
                          alt={nextFixture.opponent}
                          fill
                          className="object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/placeholder-logo.svg'
                          }}
                        />
                      </div>
                      <span className="text-white/70 text-[10px] font-semibold tracking-wide leading-tight">
                        {nextFixture.opponentShort}{' '}
                        <span className="text-white/45">
                          ({nextFixture.isHome ? 'H' : 'A'})
                        </span>
                      </span>
                      <span
                        className={`min-w-[40px] text-center text-[10px] font-bold px-2 py-0.5 rounded-full ${difficultyClass(
                          nextFixture.difficulty ?? 3
                        )}`}
                      >
                        {nextFixture.difficulty ?? 3}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Goal details list */}
        {player.goals_details && player.goals_details.length > 0 && (
          <div className="rounded-xl bg-[var(--fpl-purple)] border border-white/10 px-2.5 py-2.5">
            <h2 className="text-white font-bold text-xs mb-1.5 px-0.5">Goal details</h2>
            <div className="space-y-0.5">
              {player.goals_details.map((goal) => {
                const match = goal.results
                if (!match) return null
                const isHome = goal.team_type === 'home'
                const opponent = isHome ? match.away_team : match.home_team
                const playerScore = isHome ? match.home_score : match.away_score
                const opponentScore = isHome ? match.away_score : match.home_score

                return (
                  <Link
                    key={goal.id}
                    href={`/matches/${match.id}`}
                    className="flex items-center justify-between gap-2 px-1.5 py-1.5 rounded-lg hover:bg-white/5 transition"
                  >
                    <div className="min-w-0">
                      <p className="text-white text-xs font-semibold truncate leading-tight">
                        vs {opponent}
                      </p>
                      <p className="text-white/45 text-[10px] leading-tight">
                        {format(new Date(match.date), 'd MMM yyyy')}
                      </p>
                    </div>
                    <span className="text-white text-sm font-bold tabular-nums shrink-0">
                      {playerScore}-{opponentScore}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
