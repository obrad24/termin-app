'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/header'
import Image from 'next/image'
import { ArrowLeft, Trophy, Target, Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface PlayerWithStats {
  id: number
  first_name: string
  last_name: string
  birth_year: number
  team?: string | null
  image_url?: string | null
  goals: number
  matches_played: number
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

export default function PlayerProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [player, setPlayer] = useState<PlayerWithStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchPlayerData()
    }
  }, [params.id])

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
      <main className="min-h-screen bg-[#a80710] pt-16 pb-20 md:pb-0">
        <Header />
        <section className="relative px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-7xl mx-auto pt-4 sm:pt-28">
          <div className="text-white text-center py-12">Učitavanje...</div>
        </section>
      </main>
    )
  }

  if (!player) {
    return (
      <main className="min-h-screen bg-[#a80710] pt-16 pb-20 md:pb-0">
        <Header />
        <section className="relative px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-7xl mx-auto pt-4 sm:pt-28">
          <div className="text-white text-center py-12">
            <p className="text-lg sm:text-xl mb-4">Igrač nije pronađen</p>
            <Link href="/players" className="text-white/80 hover:text-white underline">
              Nazad na igrače
            </Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#a80710] pt-16">
      <Header />
      <section className="relative px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-7xl mx-auto pt-4 sm:pt-28">
        <div className="space-y-6">
          {/* Back Button */}
          <Link
            href="/statistics"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4" />
            Nazad na statistiku
          </Link>

          {/* Player Header */}
          <div className="bg-slate-800/50 border border-[#a80710]/30 rounded-2xl sm:rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Player Image */}
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-yellow-400/50 bg-slate-700/50 shadow-lg shrink-0">
                <Image
                  src={player.image_url || '/no-image-player.png'}
                  alt={`${player.first_name} ${player.last_name}`}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/no-image-player.png'
                  }}
                />
              </div>

              {/* Player Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">
                  {player.first_name} {player.last_name}
                </h1>
                {player.team && (
                  <p className="text-white/60 text-lg sm:text-xl mb-4">
                    {player.team}
                  </p>
                )}
                <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
                  <div className="flex items-center gap-2 text-white/80">
                    <Trophy className="w-5 h-5" />
                    <span>{player.goals} {player.goals === 1 ? 'gol' : player.goals < 5 ? 'gola' : 'golova'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <Calendar className="w-5 h-5" />
                    <span>{player.matches_played} {player.matches_played === 1 ? 'utakmica' : 'utakmica'}</span>
                  </div>
                  {player.birth_year && (
                    <div className="flex items-center gap-2 text-white/60">
                      <span>Rođen: {player.birth_year}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Goals Details */}
          {player.goals_details && player.goals_details.length > 0 && (
            <div className="bg-slate-800/50 border border-[#a80710]/30 rounded-2xl sm:rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Target className="w-6 h-6" />
                Detalji golova
              </h2>
              <div className="space-y-3">
                {player.goals_details.map((goal) => {
                  const match = goal.results
                  const isHome = goal.team_type === 'home'
                  const opponent = isHome ? match.away_team : match.home_team
                  const playerTeam = isHome ? match.home_team : match.away_team
                  const playerScore = isHome ? match.home_score : match.away_score
                  const opponentScore = isHome ? match.away_score : match.home_score

                  return (
                    <Link
                      key={goal.id}
                      href={`/matches/${match.id}`}
                      className="block p-4 bg-slate-700/30 rounded-xl border border-[#a80710]/30 hover:border-[#a80710]/60 transition-all"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-[#a80710] font-bold text-sm min-w-12">
                              {goal.goal_minute ? `${goal.goal_minute}'` : 'N/A'}
                            </span>
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

