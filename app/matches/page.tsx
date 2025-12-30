'use client'

import { useEffect, useState } from 'react'
import { Result, Team, MatchGoal, Player } from '@/lib/supabase'
import { format } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/header'

interface GoalWithPlayer extends MatchGoal {
  players: Player | null
}

export default function MatchesPage() {
  const [results, setResults] = useState<Result[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [goalsByMatch, setGoalsByMatch] = useState<Record<number, GoalWithPlayer[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchResults()
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

  // Grupiše golove po igraču i vraća niz sa imenom i brojem golova
  const groupGoalsByPlayer = (goals: GoalWithPlayer[]) => {
    const grouped = new Map<string, { name: string; count: number; playerId: number | null; player: Player | null }>()
    
    goals.forEach((goal) => {
      const playerKey = goal.player_id?.toString() || 'unknown'
      const playerName = goal.players
        ? `${goal.players.first_name} ${goal.players.last_name}`
        : `Igrač #${goal.player_id}`
      
      if (grouped.has(playerKey)) {
        grouped.get(playerKey)!.count++
      } else {
        grouped.set(playerKey, { 
          name: playerName, 
          count: 1, 
          playerId: goal.player_id || null,
          player: goal.players
        })
      }
    })
    
    return Array.from(grouped.values())
  }

  const fetchResults = async () => {
    try {
      const response = await fetch('/api/results')
      const contentType = response.headers.get('content-type')

      if (response.ok) {
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          setResults(data || [])
          // Učitaj golove za sve rezultate
          if (data && Array.isArray(data) && data.length > 0) {
            fetchAllGoals(data.map((r: Result) => r.id))
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
          console.error('Error fetching results:', errorData)
        }
      }
    } catch (error) {
      // Loguj samo ako nije network error ili slično
      if (error instanceof Error) {
        console.error('Error fetching results:', error.message)
      } else {
        console.error('Error fetching results:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchAllGoals = async (matchIds: number[]) => {
    try {
      // Učitaj golove za sve utakmice paralelno
      const goalsPromises = matchIds.map(async (matchId) => {
        try {
          const response = await fetch(`/api/results/${matchId}`)
          if (response.ok) {
            const data = await response.json()
            return { matchId, goals: data.goals || [] }
          }
          return { matchId, goals: [] }
        } catch (error) {
          console.error(`Error fetching goals for match ${matchId}:`, error)
          return { matchId, goals: [] }
        }
      })

      const goalsResults = await Promise.all(goalsPromises)
      const goalsMap: Record<number, GoalWithPlayer[]> = {}
      goalsResults.forEach(({ matchId, goals }) => {
        goalsMap[matchId] = goals
      })
      setGoalsByMatch(goalsMap)
    } catch (error) {
      console.error('Error fetching all goals:', error)
    }
  }

  // Sortiraj rezultate po created_at opadajuće (najnoviji prvi), pa po id kao fallback
  const sortedResults = [...results].sort((a, b) => {
    const dateA = new Date(a.created_at || 0).getTime()
    const dateB = new Date(b.created_at || 0).getTime()
    if (dateB !== dateA) {
      return dateB - dateA
    }
    return (b.id || 0) - (a.id || 0)
  })

  // Grupiši rezultate po datumu
  const groupedResults = sortedResults.reduce((acc, result) => {
    const date = result.date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(result)
    return acc
  }, {} as Record<string, Result[]>)

  return (
    <main className="min-h-screen hero-bg pb-20 md:pb-0">
      <Header />
      <section className="relative px-2 sm:px-6 lg:px-8 sm:py-12 max-w-7xl mx-auto sm:pt-28 pt-4">
        <div className="space-y-6 sm:space-y-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-8">Utakmice</h2>

          {loading ? (
            <div className="text-white text-center text-sm sm:text-base">Učitavanje utakmica...</div>
          ) : results.length === 0 ? (
            <div className="text-white text-center">
              <p className="text-white/60 text-sm sm:text-base">Nema utakmica za prikaz</p>
            </div>
          ) : (
            Object.entries(groupedResults).map(([date, dateResults]) => (
              <div key={date} className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white text-center">
                    {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                  </h3>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {dateResults.map((result) => (
                    <Link key={result.id} href={`/matches/${result.id}`} className="block">
                      <div className="bg-slate-800/50 border border-white/30 rounded-2xl sm:rounded-3xl p-2 sm:p-6 md:p-8 lg:p-12 backdrop-blur-md shadow-2xl hover:border-white/60 transition-all hover:shadow-2xl hover:scale-[1.01] sm:hover:scale-[1.02] cursor-pointer">
                        {/* Mobile Layout */}
                        <div className="md:hidden space-y-4">
                          {/* Teams - Mobile */}
                          <div className="flex justify-between gap-3">
                            {/* Home team */}
                            <div className="flex items-center justify-between gap-3 p-3 bg-slate-700/30 rounded-xl w-1/2">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-700/50 flex items-center justify-center shadow-md flex-shrink-0">
                                  <Image
                                    src={getTeamLogo(result.home_team)}
                                    alt={result.home_team}
                                    fill
                                    className="object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement
                                      target.src = '/placeholder-logo.svg'
                                    }}
                                  />
                                </div>
                                <h2 className="text-lg font-bold text-white truncate">
                                  {result.home_team}
                                </h2>
                              </div>
                            </div>

                            {/* Away team */}
                            <div className="flex items-center justify-between gap-3 p-3 bg-slate-700/30 rounded-xl w-1/2">
                              <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
                                <h2 className="text-lg font-bold text-white truncate">
                                  {result.away_team}
                                </h2>
                                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-700/50 flex items-center justify-center shadow-md flex-shrink-0">
                                  <Image
                                    src={getTeamLogo(result.away_team)}
                                    alt={result.away_team}
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

                        <div className="text-center space-y-2 lg:hidden">
                          <div className="flex items-center justify-center gap-3">
                            <span className="text-6xl font-bold text-white drop-shadow-lg">
                              {result.home_score}
                            </span>
                            <span className="text-3xl text-white/60 font-light">-</span>
                            <span className="text-6xl font-bold text-white drop-shadow-lg">
                              {result.away_score}
                            </span>
                          </div>
                          {/* Goal Scorers - Mobile */}
                          {goalsByMatch[result.id] && goalsByMatch[result.id].length > 0 && (
                            <div className="flex justify-between gap-3">
                              {/* Home goals */}
                              <div className="w-1/2">
                                {goalsByMatch[result.id].filter(g => g.team_type === 'home').length > 0 ? (
                                  <div className="space-y-2 text-start">
                                    {groupGoalsByPlayer(goalsByMatch[result.id].filter(g => g.team_type === 'home'))
                                      .map((player, index) => (
                                        <div key={index} className="text-white text-sm sm:text-base">
                                          <div className="truncate flex justify-between">
                                            <span>
                                            {player.name}
                                            </span>
                                            <span className="text ml-1 leading-0 inline-flex items-center gap-0.5">{player.count > 1 && <span className="text-bold text-lg leading-0 text-yellow-400">{player.count}</span>} ⚽</span>
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                ) : (
                                  <p className="text-white/60 text-xs sm:text-sm text-center sm:text-left">Nema strijelaca</p>
                                )}
                              </div>

                              {/* Away goals */}
                              <div className="w-1/2">
                                {goalsByMatch[result.id].filter(g => g.team_type === 'away').length > 0 ? (
                                  <div className="space-y-2 text-end">
                                    {groupGoalsByPlayer(goalsByMatch[result.id].filter(g => g.team_type === 'away'))
                                      .map((player, index) => (
                                        <div key={index} className="text-white text-sm sm:text-base">
                                          <div className="truncate flex justify-between">
                                            <span className="text ml-1 leading-0 inline-flex items-center gap-0.5">⚽{player.count > 1 && <span className="text-bold text-lg leading-0 text-yellow-400">{player.count}</span>}</span>
                                            <span>
                                            {player.name}
                                            </span>
                                          </div>
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
                            <span>{format(new Date(result.date), 'dd MMM yyyy')}</span>
                            <span>•</span>
                            <span>{format(new Date(result.date), 'HH:mm')}</span>
                          </div>
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden md:grid md:grid-cols-3 gap-6 lg:gap-8 items-center">
                          {/* Home team */}
                          <div className="text-center md:text-right space-y-3 lg:space-y-4">
                            <div className="flex flex-col md:flex-row items-center md:justify-end gap-3 lg:gap-4">
                              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl lg:rounded-2xl overflow-hidden bg-slate-700/50 flex items-center justify-center shadow-lg">
                                <Image
                                  src={getTeamLogo(result.home_team)}
                                  alt={result.home_team}
                                  fill
                                  className="object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.src = '/placeholder-logo.svg'
                                  }}
                                />
                              </div>
                              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white break-words">
                                {result.home_team}
                              </h2>
                            </div>
                          </div>

                          {/* Score */}
                          <div className="text-center space-y-3 lg:space-y-4">
                            <div className="flex items-center justify-center gap-4 lg:gap-6">
                              <span className="text-6xl md:text-7xl lg:text-8xl font-bold text-white drop-shadow-lg">
                                {result.home_score}
                              </span>
                              <span className="text-3xl md:text-4xl text-white/60 font-light">-</span>
                              <span className="text-6xl md:text-7xl lg:text-8xl font-bold text-white drop-shadow-lg">
                                {result.away_score}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-2 lg:gap-4 text-sm text-white/60">
                              <span>FULL TIME</span>
                              <span>•</span>
                              <span>{format(new Date(result.date), 'dd MMM yyyy')}</span>
                              <span>•</span>
                              <span>{format(new Date(result.date), 'HH:mm')}</span>
                            </div>
                            {/* Goal Scorers - Desktop */}
                            {goalsByMatch[result.id] && goalsByMatch[result.id].length > 0 && (
                              <div className="grid grid-cols-2 gap-4 lg:gap-6 pt-2">
                                {/* Home goals */}
                                <div className="text-right">
                                  {goalsByMatch[result.id].filter(g => g.team_type === 'home').length > 0 ? (
                                    <div className="space-y-1">
                                      {groupGoalsByPlayer(goalsByMatch[result.id].filter(g => g.team_type === 'home'))
                                        .map((player, index) => (
                                          <div key={index} className="text-white text-xs sm:text-sm">
                                            {player.player && player.playerId ? (
                                              <Link
                                                href={`/players/${player.playerId}`}
                                                className="truncate hover:text-[#a80710] transition-colors cursor-pointer inline-block"
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                {player.name}
                                                <span className="text ml-1 leading-0 inline-flex items-center gap-0.5">⚽{player.count > 1 && <span className="text-bold text-lg leading-0 text-yellow-400">{player.count}</span>}</span>
                                              </Link>
                                            ) : (
                                              <span className="truncate">
                                                {player.name}
                                                <span className="text ml-1 leading-0 inline-flex items-center gap-0.5">⚽{player.count > 1 && <span className="text-bold text-lg leading-0 text-yellow-400">{player.count}</span>}</span>
                                              </span>
                                            )}
                                          </div>
                                        ))}
                                    </div>
                                  ) : (
                                    <p className="text-white/60 text-xs">Nema strijelaca</p>
                                  )}
                                </div>

                                {/* Away goals */}
                                <div className="text-left">
                                  {goalsByMatch[result.id].filter(g => g.team_type === 'away').length > 0 ? (
                                    <div className="space-y-1">
                                      {groupGoalsByPlayer(goalsByMatch[result.id].filter(g => g.team_type === 'away'))
                                        .map((player, index) => (
                                          <div key={index} className="text-white text-xs sm:text-sm">
                                            {player.player && player.playerId ? (
                                              <Link
                                                href={`/players/${player.playerId}`}
                                                className="truncate hover:text-[#a80710] transition-colors cursor-pointer inline-block"
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                {player.name}
                                                <span className="text ml-1 leading-0 inline-flex items-center gap-0.5">⚽{player.count > 1 && <span className="text-bold text-lg leading-0 text-yellow-400">{player.count}</span>}</span>
                                              </Link>
                                            ) : (
                                              <span className="truncate">
                                                {player.name}
                                                <span className="text ml-1 leading-0 inline-flex items-center gap-0.5">⚽{player.count > 1 && <span className="text-bold text-lg leading-0 text-yellow-400">{player.count}</span>}</span>
                                              </span>
                                            )}
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
                                {result.away_team}
                              </h2>
                              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl lg:rounded-2xl overflow-hidden bg-slate-700/50 flex items-center justify-center shadow-lg">
                                <Image
                                  src={getTeamLogo(result.away_team)}
                                  alt={result.away_team}
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
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  )
}

