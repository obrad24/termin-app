'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/header'
import Image from 'next/image'
import { ArrowLeft, Trophy, Target, Calendar, Menu, TrendingUp, Star, Bandage, Ambulance } from 'lucide-react'
import { format } from 'date-fns'
import { Result, Team } from '@/lib/supabase'
import { getPlayerImageUrl } from '@/lib/image-utils'

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

interface PlayerMatch {
  matchId: number
  opponent: string
  opponentLogo: string
  playerGoals: number
  date: string
  home_team: string
  away_team: string
  home_score: number
  away_score: number
}

export default function PlayerProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [player, setPlayer] = useState<PlayerWithStats | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [previousMatches, setPreviousMatches] = useState<PlayerMatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchPlayerData()
      fetchTeams()
    }
  }, [params.id])

  useEffect(() => {
    if (player && teams.length > 0) {
      fetchPreviousMatches()
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

  const fetchPreviousMatches = async () => {
    if (!player || !player.goals_details) return

    try {
      // Kreiraj mapu golova po meču i skup mečeva
      const goalsByMatch: Record<number, number> = {}
      const matchesMap: Record<number, any> = {}

      player.goals_details.forEach((goal) => {
        if (goal.results) {
          const matchId = goal.results.id
          goalsByMatch[matchId] = (goalsByMatch[matchId] || 0) + 1
          matchesMap[matchId] = goal.results
        }
      })

      // Kreiraj listu mečeva sa protivničkim timom
      const playerMatches: PlayerMatch[] = []

      Object.entries(matchesMap).forEach(([matchId, match]) => {
        // Odredi protivnički tim na osnovu team_type gola
        const goal = player.goals_details.find(g => g.results?.id === parseInt(matchId))
        if (!goal) return

        const isHome = goal.team_type === 'home'
        const opponent = isHome ? match.away_team : match.home_team
        const opponentLogo = getTeamLogo(opponent)

        playerMatches.push({
          matchId: parseInt(matchId),
          opponent,
          opponentLogo,
          playerGoals: goalsByMatch[parseInt(matchId)] || 0,
          date: match.date,
          home_team: match.home_team,
          away_team: match.away_team,
          home_score: match.home_score,
          away_score: match.away_score,
        })
      })

      // Sortiraj po datumu (najnoviji prvi)
      playerMatches.sort((a, b) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return dateB - dateA
      })

      setPreviousMatches(playerMatches.slice(0, 10)) // Uzmi poslednjih 10 mečeva
    } catch (error) {
      console.error('Error fetching previous matches:', error)
    }
  }

  const getTeamLogo = (teamName: string) => {
    const team = teams.find(t => t.name === teamName)
    return team?.logo_url || '/placeholder-logo.svg'
  }

  const fetchPlayerData = async () => {
    try {
      const response = await fetch(`/api/players/${params.id}`)
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

  if (loading) {
    return (
      <main className="min-h-screen hero-bg pt-16 pb-20 md:pb-0">
        <Header />
        <section className="relative px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-7xl mx-auto pt-4 sm:pt-28">
          <div className="text-white text-center py-12">Učitavanje...</div>
        </section>
      </main>
    )
  }

  if (!player) {
    return (
      <main className="min-h-screen hero-bg pt-16 pb-20 md:pb-0">
        <Header />
        <section className="relative px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-7xl mx-auto pt-4 sm:pt-28">
          <div className="text-white text-center py-12">
            <p className="text-lg sm:text-xl mb-4">Igrač nije pronađen</p>
            <Link href="/players" className="text-white/80 hover:text-white underline z-50 relative">
              Nazad na igrače
            </Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen hero-bg relative overflow-hidden pb-24">
      <Header />

      {/* Hero Section with Player Image */}
      <div className="relative w-full min-h-[60vh] sm:min-h-[70vh] md:min-h-[80vh] flex items-center justify-center overflow-hidden hero-bg">
        {/* Player Background Image */}
        <div className="absolute inset-0 z-0 flex items-center justify-center">
          <div className="relative w-full h-full max-w-4xl mx-auto">
            <Image
              src={getPlayerImageUrl(player.image_url)}
              alt={`${player.first_name} ${player.last_name}`}
              fill
              className="object-contain object-center"
              priority
              unoptimized
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = '/no-image-player.png'
              }}
            />

          </div>
          {/* Dark gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-[56%]" style={{ background: 'linear-gradient(to top, #0a0d1a 0%, rgba(10,13,26,0.95) 30%, rgba(124,58,237,0.3) 50%, rgba(139,92,246,0.2) 65%, rgba(34,197,94,0.15) 80%, transparent 100%)' }} />
        </div>
        <h1 className="absolute bottom-[100px] left-3 flex flex-col text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white uppercase tracking-wide drop-shadow-lg">
          <span className='text-sm'>{player.first_name}</span>
          <span className='text-3xl'>{player.last_name}</span>
        </h1>
        {player.team && (
          <div className="absolute top-[68px] right-3 flex items-center gap-3">
            <div className="relative w-12 h-12 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-slate-700/50 border-2 border-white/20 shadow-lg">
              <Image
                src={getTeamLogo(player.team)}
                alt={player.team}
                fill
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/placeholder-logo.svg'
                }}
              />
            </div>
          </div>
        )}
        {/* Top Section - Name and Overall Rating */}
        <div className="absolute top-0 left-0 right-0 z-10 px-4 sm:px-6 pt-[50px] sm:pt-24">
          <div className="flex items-end justify-between relative">
            <div className="flex flex-col">

              {/* Injury Badge */}
              {player.injury === true && (
                <div className="mt-2 inline-flex items-center justify-center bg-white rounded-full p-1.5 border-2 border-red-600 shadow-lg w-fit">
                  <Ambulance className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" strokeWidth={2.5} />
                </div>
              )}
            </div>
            {/* Overall Rating in Top Right */}
            {(() => {
              const ratings = [
                player.pace,
                player.shooting,
                player.passing,
                player.dribbling,
                player.defending,
                player.physical,
                player.stamina,
              ].filter((r): r is number => r !== null && r !== undefined)

              let averageRating = ratings.length > 0
                ? Math.round(ratings.reduce((sum, r) => sum + r, 0) / ratings.length)
                : null

              // Dodaj rating_bonus na prosječni rating
              if (averageRating !== null && player.rating_bonus !== null && player.rating_bonus !== undefined) {
                averageRating = Math.max(0, Math.min(100, averageRating + player.rating_bonus))
              }

              const getRatingColor = (rating: number): string => {
                if (rating >= 0 && rating <= 59) return '#E53935' // 🔴
                if (rating >= 60 && rating <= 64) return '#FB8C00' // 🟠
                if (rating >= 65 && rating <= 69) return '#FDD835' // 🟡
                if (rating >= 70 && rating <= 79) return '#43A047' // 🟢
                if (rating >= 80 && rating <= 100) return '#1B5E20' // 🟢 tamno zelena
                return '#000000' // default crna
              }

              return averageRating !== null ? (
                <div className="absolute top-0 left-0 w-[70px] h-[80px] bg-gradient-to-b from-slate-800 to-slate-900 rounded-b-full flex items-center justify-center border-2 border-white/20 shadow-2xl">
                  <div className="relative">
                    <span
                      className="text-[52px] sm:text-4xl md:text-5xl font-black relative z-10"
                      style={{
                        color: getRatingColor(averageRating),
                        textShadow: '0 0 10px rgba(0, 0, 0, 0.8), 0 2px 4px rgba(0, 0, 0, 0.9), 0 0 20px currentColor',
                      }}
                    >
                      {averageRating}
                    </span>
                  </div>
                </div>
              ) : null
            })()}
          </div>
        </div>

      </div>

      {/* Content Section */}
      <section className="relative h-auto -mt-20 sm:-mt-32 z-20 ">
        <div>
          {/* Player Ratings */}
          {((player.pace !== null && player.pace !== undefined) ||
            (player.shooting !== null && player.shooting !== undefined) ||
            (player.passing !== null && player.passing !== undefined) ||
            (player.dribbling !== null && player.dribbling !== undefined) ||
            (player.defending !== null && player.defending !== undefined) ||
            (player.physical !== null && player.physical !== undefined) ||
            (player.stamina !== null && player.stamina !== undefined)) && (
              <div className="relative px-4 sm:px-6 bg-[#d7b35f] mb-4 py-1 rounded-full w-[95%] mx-auto">
                <div className="flex gap-2 justify-around px-4 font-black">
                  {player.pace !== null && player.pace !== undefined && (
                    <div className="flex flex-col items-center">
                      <span className='text-sm'>PAC</span>
                      <span className='text-[24px] leading-7'>{player.pace}</span>
                    </div>
                  )}

                  {player.shooting !== null && player.shooting !== undefined && (
                    <div className="flex flex-col items-center">
                      <span className='text-sm'>SHO</span>
                      <span className='text-[24px] leading-7'>{player.shooting}</span>
                    </div>
                  )}

                  {player.passing !== null && player.passing !== undefined && (
                    <div className="flex flex-col items-center">
                      <span className='text-sm'>PAS</span>
                      <span className='text-[24px] leading-7'>{player.passing}</span>
                    </div>
                  )}

                  {player.dribbling !== null && player.dribbling !== undefined && (
                    <div className="flex flex-col items-center">
                      <span className='text-sm'>DRI</span>
                      <span className='text-[24px] leading-7'>{player.dribbling}</span>
                    </div>
                  )}

                  {player.defending !== null && player.defending !== undefined && (
                    <div className="flex flex-col items-center">
                      <span className='text-sm'>DEF</span>
                      <span className='text-[24px] leading-7'>{player.defending}</span>
                    </div>
                  )}

                  {player.physical !== null && player.physical !== undefined && (
                    <div className="flex flex-col items-center">
                      <span className='text-sm'>PHY</span>
                      <span className='text-[24px] leading-7'>{player.physical}</span>
                    </div>
                  )}

                  {player.stamina !== null && player.stamina !== undefined && (
                    <div className="flex flex-col items-center">
                      <span className='text-sm'>STA</span>
                      <span className='text-[24px] leading-7'>{player.stamina}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Previous Matches Slider */}
          {previousMatches.length > 0 && (
            <div className="relative px-2">
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory scroll-smooth">
                {previousMatches.map((match) => (
                  <Link
                    key={match.matchId}
                    href={`/matches/${match.matchId}`}
                    className="min-w-[280px] sm:min-w-[320px] bg-slate-800/90 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:border-white/40 transition-all snap-start"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white text-sm font-medium">Prethodni meč</span>
                      <div className="w-6 h-6 rounded-full bg-slate-700/50 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-4 mb-3">
                      <div className="text-center">
                        <div className="text-6xl font-bold text-white mb-1">
                          {match.playerGoals}
                        </div>
                      </div>
                      <span className="text-white/60 text-sm font-medium">VS</span>
                      <div className="flex flex-col items-center gap-2">
                        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-slate-700/50 border-2 border-white/20">
                          <Image
                            src={match.opponentLogo}
                            alt={match.opponent}
                            fill
                            className="object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = '/placeholder-logo.svg'
                            }}
                          />
                        </div>
                        <span className="text-white text-sm font-medium text-center truncate w-full max-w-[120px]">
                          {match.opponent}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/10 text-center">
                      <span className="text-white/60 text-xs">
                        {format(new Date(match.date), 'dd MMM yyyy')}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 px-2">
            <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="text-white/60 text-sm">Golovi</span>
              </div>
              <div className="text-3xl font-bold text-white">{player.goals}</div>
            </div>
            <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                <span className="text-white/60 text-sm">Utakmice</span>
              </div>
              <div className="text-3xl font-bold text-white">{player.matches_played}</div>
            </div>
            {player.team && (
              <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-4 border border-white/20 col-span-2 sm:col-span-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white/60 text-sm">Tim</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden bg-slate-700/50 shrink-0">
                    <Image
                      src={getTeamLogo(player.team)}
                      alt={player.team}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/placeholder-logo.svg'
                      }}
                    />
                  </div>
                  <div className="text-lg font-bold text-white truncate">{player.team}</div>
                </div>
              </div>
            )}
          </div>


          {/* Goals Details */}
          {player.goals_details && player.goals_details.length > 0 && (
            <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/20 mt-3 mx-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Target className="w-6 h-6" />
                Detalji golova
              </h2>
              <div className="space-y-3">
                {player.goals_details.map((goal) => {
                  const match = goal.results
                  if (!match) return null

                  const isHome = goal.team_type === 'home'
                  const opponent = isHome ? match.away_team : match.home_team
                  const playerTeam = isHome ? match.home_team : match.away_team
                  const playerScore = isHome ? match.home_score : match.away_score
                  const opponentScore = isHome ? match.away_score : match.home_score

                  return (
                    <Link
                      key={goal.id}
                      href={`/matches/${match.id}`}
                      className="block p-4 bg-slate-700/50 rounded-xl border border-white/10 hover:border-white/30 transition-all"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-semibold text-sm sm:text-base truncate">
                                {playerTeam} vs {opponent}
                              </p>
                              <p className="text-white/60 text-xs sm:text-sm">
                                {format(new Date(match.date), 'dd MMM yyyy')}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-white font-bold text-lg sm:text-xl">
                            {playerScore} - {opponentScore}
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

