'use client'

import { useEffect, useState } from 'react'
import { Result, Team, MatchGoal, Player } from '@/lib/supabase'
import { format } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'

interface GoalWithPlayer extends MatchGoal {
  players: Player | null
}

export default function LatestResult() {
  const [latestResult, setLatestResult] = useState<Result | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [goals, setGoals] = useState<GoalWithPlayer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLatestResult()
    fetchTeams()
  }, [])

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

  const getTeamLogo = (teamName: string) => {
    const team = teams.find(t => t.name === teamName)
    return team?.logo_url || '/placeholder-logo.svg'
  }

  const fetchLatestResult = async () => {
    try {
      const response = await fetch('/api/results')
      const contentType = response.headers.get('content-type')

      if (response.ok) {
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          if (data && Array.isArray(data) && data.length > 0) {
            // Sortiraj po created_at opadajuće (najnoviji prvi), pa po id kao fallback
            const sortedData = [...data].sort((a, b) => {
              const dateA = new Date(a.created_at || 0).getTime()
              const dateB = new Date(b.created_at || 0).getTime()
              if (dateB !== dateA) {
                return dateB - dateA
              }
              return (b.id || 0) - (a.id || 0)
            })
            const result = sortedData[0] // Prvi je najnovije dodati rezultat
            setLatestResult(result)
            // Učitaj detalje utakmice sa golovima
            if (result.id) {
              fetchMatchGoals(result.id)
            }
          }
        }
      } else {
        // Pokušaj da parsiraš error kao JSON, ali ako ne uspe, koristi status text
        let errorData
        try {
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json()
          } else {
            const text = await response.text()
            errorData = { error: text || response.statusText, status: response.status }
          }
        } catch (parseError) {
          errorData = { error: response.statusText, status: response.status }
        }

        // Loguj samo ako nije 503 (Supabase not configured) - to je očekivano
        if (response.status !== 503) {
          console.error('Error fetching latest result:', errorData)
        }
      }
    } catch (error) {
      // Loguj samo ako nije network error ili slično
      if (error instanceof Error) {
        console.error('Error fetching latest result:', error.message)
      } else {
        console.error('Error fetching latest result:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchMatchGoals = async (matchId: number) => {
    try {
      const response = await fetch(`/api/results/${matchId}`)
      if (response.ok) {
        const data = await response.json()
        setGoals(data.goals || [])
      }
    } catch (error) {
      console.error('Error fetching match goals:', error)
    }
  }

  if (loading) {
    return (
      <section className="relative min-h-[70vh] sm:min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="absolute inset-0 bg-[#a80710]" />
        <div className="relative z-10 text-white text-sm sm:text-base">Učitavanje...</div>
      </section>
    )
  }

  if (!latestResult) {
    return (
      <section className="relative min-h-[70vh] sm:min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="absolute inset-0 bg-[#a80710]" />
        <div className="relative z-10 text-white text-center px-4">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">Nema rezultata</h2>
          <p className="text-blue-300/60 text-sm sm:text-base">Dodajte rezultate u admin panelu</p>
        </div>
      </section>
    )
  }

  return (
    <section className="relative flex items-center justify-center px-2 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-12 sm:pb-16 lg:pb-20">
      {/* Background gradient effects */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-[#a80710] via-[#a80710]/50 to-transparent z-[15]"></div>
      {/* Main match display */}
      <div className="relative w-full max-w-6xl mx-auto z-20">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white text-center mb-4">
          Posljednji rezultat:
        </h2>
        {/* Match result */}
        <Link href={`/matches/${latestResult.id}`} className="block">
          <div className="bg-slate-800/50 border border-[#a80710]/30 rounded-2xl sm:rounded-3xl p-2 sm:p-6 md:p-8 lg:p-12 backdrop-blur-md shadow-2xl hover:border-[#a80710]/60 transition-all hover:shadow-2xl hover:scale-[1.01] sm:hover:scale-[1.02] cursor-pointer">
            {/* Mobile Layout */}
            <div className="md:hidden space-y-4">
              {/* Score - Mobile */}


              {/* Teams - Mobile */}
              <div className="flex justify-between gap-3">
                {/* Home team */}
                <div className="flex items-center justify-between gap-3 p-3 bg-slate-700/30 rounded-xl w-1/2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-700/50 flex items-center justify-center shadow-md flex-shrink-0">
                      <Image
                        src={getTeamLogo(latestResult.home_team)}
                        alt={latestResult.home_team}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/placeholder-logo.svg'
                        }}
                      />
                    </div>
                    <h2 className="text-lg font-bold text-white truncate">
                      {latestResult.home_team}
                    </h2>
                  </div>
                </div>

                {/* Away team */}
                <div className="flex items-center justify-between gap-3 p-3 bg-slate-700/30 rounded-xl w-1/2">
                  <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
                    <h2 className="text-lg font-bold text-white truncate">
                      {latestResult.away_team}
                    </h2>
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-700/50 flex items-center justify-center shadow-md flex-shrink-0">
                      <Image
                        src={getTeamLogo(latestResult.away_team)}
                        alt={latestResult.away_team}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/placeholder-logo.svg'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center space-y-2 lg:hidden pt-2">
              <div className="flex items-center justify-center gap-3">
                <span className="text-6xl font-bold text-white drop-shadow-lg">
                  {latestResult.home_score}
                </span>
                <span className="text-3xl text-white/60 font-light">-</span>
                <span className="text-6xl font-bold text-white drop-shadow-lg">
                  {latestResult.away_score}
                </span>
              </div>
              {/* Goal Scorers */}
              {goals.length > 0 && (

                  <div className="flex justify-between">
                    {/* Home goals */}
                    <div>
                      {goals.filter(g => g.team_type === 'home').length > 0 ? (
                        <div className="space-y-2 text-start">
                          {goals
                            .filter(g => g.team_type === 'home')
                            .map((goal) => (
                              <div key={goal.id} className="text-white text-sm sm:text-base">
                                <span className="truncate">
                                  {goal.players
                                    ? `${goal.players.first_name} ${goal.players.last_name}`
                                    : `Igrač #${goal.player_id}`}
                                </span>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-white/60 text-xs sm:text-sm text-center sm:text-left">Nema strijelaca</p>
                      )}
                    </div>

                    {/* Away goals */}
                    <div>
                      {goals.filter(g => g.team_type === 'away').length > 0 ? (
                        <div className="space-y-2 text-end">
                          {goals
                            .filter(g => g.team_type === 'away')
                            .map((goal) => (
                              <div key={goal.id} className="text-white text-sm sm:text-base">
                                <span className="truncate">
                                  {goal.players
                                    ? `${goal.players.first_name} ${goal.players.last_name}`
                                    : `Igrač #${goal.player_id}`}
                                </span>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-white/60 text-xs sm:text-sm text-center sm:text-left">Nema strijelaca</p>
                      )}
                    </div>
                  </div>
              )}
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-white/60">
                <span>{format(new Date(latestResult.date), 'dd MMM yyyy')}</span>
                <span>•</span>
                <span>{format(new Date(latestResult.date), 'HH:mm')}</span>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:grid md:grid-cols-3 gap-6 lg:gap-8 items-center">
              {/* Home team */}
              <div className="text-center md:text-right space-y-3 lg:space-y-4">
                <div className="flex flex-col md:flex-row items-center md:justify-end gap-3 lg:gap-4">
                  <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl lg:rounded-2xl overflow-hidden bg-slate-700/50 flex items-center justify-center shadow-lg">
                    <Image
                      src={getTeamLogo(latestResult.home_team)}
                      alt={latestResult.home_team}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/placeholder-logo.svg'
                      }}
                    />
                  </div>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white break-words">
                    {latestResult.home_team}
                  </h2>
                </div>
              </div>

              {/* Score */}
              <div className="text-center space-y-3 lg:space-y-4">
                <div className="flex items-center justify-center gap-4 lg:gap-6">
                  <span className="text-6xl md:text-7xl lg:text-8xl font-bold text-white drop-shadow-lg">
                    {latestResult.home_score}
                  </span>
                  <span className="text-3xl md:text-4xl text-white/60 font-light">-</span>
                  <span className="text-6xl md:text-7xl lg:text-8xl font-bold text-white drop-shadow-lg">
                    {latestResult.away_score}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 lg:gap-4 text-sm text-white/60">
                  <span>FULL TIME</span>
                  <span>•</span>
                  <span>{format(new Date(latestResult.date), 'dd MMM yyyy')}</span>
                  <span>•</span>
                  <span>{format(new Date(latestResult.date), 'HH:mm')}</span>
                </div>
                {/* Goal Scorers - Desktop */}
                {goals.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 lg:gap-6 pt-2">
                    {/* Home goals */}
                    <div className="text-right">
                      {goals.filter(g => g.team_type === 'home').length > 0 ? (
                        <div className="space-y-1">
                          {goals
                            .filter(g => g.team_type === 'home')
                            .map((goal) => (
                              <div key={goal.id} className="text-white text-xs sm:text-sm">
                                <span className="truncate">
                                  {goal.players
                                    ? `${goal.players.first_name} ${goal.players.last_name}`
                                    : `Igrač #${goal.player_id}`}
                                </span>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-white/60 text-xs">Nema strijelaca</p>
                      )}
                    </div>

                    {/* Away goals */}
                    <div className="text-left">
                      {goals.filter(g => g.team_type === 'away').length > 0 ? (
                        <div className="space-y-1">
                          {goals
                            .filter(g => g.team_type === 'away')
                            .map((goal) => (
                              <div key={goal.id} className="text-white text-xs sm:text-sm">
                                <span className="truncate">
                                  {goal.players
                                    ? `${goal.players.first_name} ${goal.players.last_name}`
                                    : `Igrač #${goal.player_id}`}
                                </span>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-white/60 text-xs">Nema strijelaca</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Away team */}
              <div className="text-center md:text-left space-y-3 lg:space-y-4">
                <div className="flex flex-col md:flex-row items-center md:justify-start gap-3 lg:gap-4">
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white break-words">
                    {latestResult.away_team}
                  </h2>
                  <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl lg:rounded-2xl overflow-hidden bg-slate-700/50 flex items-center justify-center shadow-lg">
                    <Image
                      src={getTeamLogo(latestResult.away_team)}
                      alt={latestResult.away_team}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/placeholder-logo.svg'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </section>
  )
}

