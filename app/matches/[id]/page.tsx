'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Result, Player, MatchGoal, MatchPlayer } from '@/lib/supabase'
import { format } from 'date-fns'
import Link from 'next/link'
import Header from '@/components/header'
import { ArrowLeft } from 'lucide-react'

interface GoalWithPlayer extends MatchGoal {
  players: Player
}

interface MatchPlayerWithPlayer extends MatchPlayer {
  players: Player
}

interface ResultWithDetails extends Result {
  goals: GoalWithPlayer[]
  players: MatchPlayerWithPlayer[]
}

export default function MatchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [match, setMatch] = useState<ResultWithDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchMatch()
    }
  }, [params.id])

  const fetchMatch = async () => {
    try {
      const response = await fetch(`/api/results/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setMatch(data)
      } else if (response.status === 404) {
        router.push('/matches')
      }
    } catch (error) {
      console.error('Error fetching match:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#a80710]">
        <Header />
        <section className="relative px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-7xl mx-auto pt-24 sm:pt-28">
          <div className="text-white text-center py-12">Učitavanje...</div>
        </section>
      </main>
    )
  }

  if (!match) {
    return (
      <main className="min-h-screen bg-[#a80710]">
        <Header />
        <section className="relative px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-7xl mx-auto pt-24 sm:pt-28">
          <div className="text-white text-center py-12">
            <p className="text-lg sm:text-xl mb-4">Utakmica nije pronađena</p>
            <Link href="/matches" className="text-blue-400 hover:text-blue-300 underline">
              Nazad na utakmice
            </Link>
          </div>
        </section>
      </main>
    )
  }

  const homeGoals = match.goals?.filter(g => g.team_type === 'home') || []
  const awayGoals = match.goals?.filter(g => g.team_type === 'away') || []
  const homePlayers = match.players?.filter(p => p.team_type === 'home') || []
  const awayPlayers = match.players?.filter(p => p.team_type === 'away') || []

  return (
    <main className="min-h-screen bg-[#a80710]">
      <Header />
      <section className="relative px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-7xl mx-auto">
        <div className="space-y-6 sm:space-y-8">
          {/* Back button */}
          <Link
            href="/matches"
            className="inline-flex items-center gap-2 text-blue-300/80 hover:text-blue-300 transition text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4" />
            Nazad na utakmice
          </Link>

          {/* Match header */}
          <div className="bg-slate-800/50 border border-blue-400/30 rounded-xl sm:rounded-2xl p-6 sm:p-8 backdrop-blur-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-center">
              {/* Home team */}
              <div className="text-center md:text-right space-y-3 sm:space-y-4">
                <div className="flex flex-col md:flex-row items-center md:justify-end gap-3 sm:gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl sm:rounded-2xl bg-red-600 flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl sm:text-2xl md:text-3xl">
                      {match.home_team.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white break-words">
                    {match.home_team}
                  </h1>
                </div>
              </div>

              {/* Score */}
              <div className="text-center space-y-3 sm:space-y-4">
                <div className="flex items-center justify-center gap-4 sm:gap-6">
                  <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white">
                    {match.home_score}
                  </span>
                  <span className="text-2xl sm:text-3xl md:text-4xl text-blue-300/60 font-light">-</span>
                  <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white">
                    {match.away_score}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-blue-200/60">
                  <span>FULL TIME</span>
                  <span>•</span>
                  <span>{format(new Date(match.date), 'dd MMM yyyy')}</span>
                  <span>•</span>
                  <span>{format(new Date(match.date), 'HH:mm')}</span>
                </div>
              </div>

              {/* Away team */}
              <div className="text-center md:text-left space-y-3 sm:space-y-4">
                <div className="flex flex-col md:flex-row items-center md:justify-start gap-3 sm:gap-4">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white break-words">
                    {match.away_team}
                  </h1>
                  <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl sm:rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl sm:text-2xl md:text-3xl">
                      {match.away_team.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Goals */}
          {(homeGoals.length > 0 || awayGoals.length > 0) && (
            <div className="bg-slate-800/50 border border-blue-400/30 rounded-xl sm:rounded-2xl p-6 sm:p-8 backdrop-blur-md">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">Strijelci</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                {/* Home goals */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">{match.home_team}</h3>
                  {homeGoals.length > 0 ? (
                    <div className="space-y-2">
                      {homeGoals.map((goal) => (
                        <div key={goal.id} className="flex items-center gap-3 text-white">
                          <span className="text-blue-300 font-semibold">
                            {goal.goal_minute}'
                          </span>
                          <span>
                            {goal.players?.first_name} {goal.players?.last_name}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-blue-300/60 text-sm">Nema strijelaca</p>
                  )}
                </div>

                {/* Away goals */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">{match.away_team}</h3>
                  {awayGoals.length > 0 ? (
                    <div className="space-y-2">
                      {awayGoals.map((goal) => (
                        <div key={goal.id} className="flex items-center gap-3 text-white">
                          <span className="text-blue-300 font-semibold">
                            {goal.goal_minute}'
                          </span>
                          <span>
                            {goal.players?.first_name} {goal.players?.last_name}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-blue-300/60 text-sm">Nema strijelaca</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Players */}
          {(homePlayers.length > 0 || awayPlayers.length > 0) && (
            <div className="bg-slate-800/50 border border-blue-400/30 rounded-xl sm:rounded-2xl p-6 sm:p-8 backdrop-blur-md">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">Igrači</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                {/* Home players */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">{match.home_team}</h3>
                  {homePlayers.length > 0 ? (
                    <div className="space-y-2">
                      {homePlayers.map((mp) => (
                        <div key={mp.id} className="flex items-center gap-3 text-white">
                          <span>
                            {mp.players?.first_name} {mp.players?.last_name}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-blue-300/60 text-sm">Nema igrača</p>
                  )}
                </div>

                {/* Away players */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">{match.away_team}</h3>
                  {awayPlayers.length > 0 ? (
                    <div className="space-y-2">
                      {awayPlayers.map((mp) => (
                        <div key={mp.id} className="flex items-center gap-3 text-white">
                          <span>
                            {mp.players?.first_name} {mp.players?.last_name}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-blue-300/60 text-sm">Nema igrača</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

