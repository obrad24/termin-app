'use client'

import { useEffect, useState } from 'react'
import { Player } from '@/lib/supabase'
import Header from '@/components/header'
import Image from 'next/image'
import Link from 'next/link'
import { Trophy } from 'lucide-react'
import { getPlayerImageUrl } from '@/lib/image-utils'

interface PlayerWithStats extends Player {
  goals: number
  matches_played: number
}

export default function StatisticsPage() {
  const [players, setPlayers] = useState<PlayerWithStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlayers()
  }, [])

  const fetchPlayers = async () => {
    try {
      const response = await fetch('/api/players/stats')
      const contentType = response.headers.get('content-type')

      if (response.ok) {
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          // Sortiraj po golovima (opadajuće), pa po imenu ako su isti
          const sortedData = (data || []).sort((a: PlayerWithStats, b: PlayerWithStats) => {
            if (b.goals !== a.goals) {
              return b.goals - a.goals
            }
            return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
          })
          setPlayers(sortedData)
        }
      } else {
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

        if (response.status !== 503) {
          console.error('Error fetching players:', errorData)
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error fetching players:', error.message)
      } else {
        console.error('Error fetching players:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  // Filtriraj samo igrače koji imaju golove
  const topScorers = players.filter(player => player.goals > 0)

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-400" />
    return null
  }

  const getRankBadge = (index: number) => {
    if (index === 0) return 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30'
    if (index === 1) return 'bg-gray-300/20 text-gray-300 border-gray-300/30'
    if (index === 2) return 'bg-amber-600/20 text-amber-600 border-amber-600/30'
    return 'bg-slate-700/50 text-white/60 border-slate-600/30'
  }

  return (
    <main className="min-h-screen hero-bg pt-4 pb-20 md:pb-0">
      <Header />
      <section className="relative px-2 sm:px-6 lg:px-8 sm:py-12 max-w-7xl mx-auto sm:pt-28">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-8">Statistika</h2>
        <div className="space-y-6">
          {loading ? (
            <div className="text-white text-center py-12 text-sm sm:text-base">Učitavanje statistike...</div>
          ) : topScorers.length === 0 ? (
            <div className="text-white text-center py-12">
              <p className="text-lg sm:text-xl mb-2">Nema podataka o strijelcima</p>
              <p className="text-white/60 text-sm sm:text-base">
                Dodajte rezultate utakmica u admin panelu
              </p>
            </div>
          ) : (
            <div className="backdrop-blur-xl rounded-3xl sm:p-6">
              {/* Top Scorer */}
              {topScorers.length >= 1 && (
                <Link
                  href={`/players/${topScorers[0].id}`}
                  className="flex flex-col items-center gap-2 mb-8 pb-2 border-b border-white/10 hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-yellow-400/50 bg-slate-700/50 shadow-2xl flex items-center justify-center">
                    <Image
                      src={getPlayerImageUrl(topScorers[0].image_url)}
                      alt={`${topScorers[0].first_name} ${topScorers[0].last_name}`}
                      fill
                      className="object-contain object-center"
                      unoptimized
                      priority
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        if (target.src !== '/no-image-player.png') {
                          console.warn(`Failed to load image for top scorer ${topScorers[0].id}:`, topScorers[0].image_url)
                          target.src = '/no-image-player.png'
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-0">
                    <span className="text-yellow-400 font-bold text-sm sm:text-xl">Najbolji strijelac</span>
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-white text-3xl sm:text-2xl lg:text-3xl">
                      {topScorers[0].first_name} {topScorers[0].last_name}
                    </h3>
                    {topScorers[0].team && (
                      <p className="text-white/60 text-sm sm:text-base mt-1">
                        {topScorers[0].team}
                      </p>
                    )}
                    <div className="flex items-center justify-center gap-4 mt-2">
                      <div className="text-center">
                        <p className="text-white font-bold text-4xl sm:text-5xl lg:text-6xl">
                          {topScorers[0].goals}
                        </p>
                        <p className="text-white/60 text-sm sm:text-base mt-1">
                          {topScorers[0].goals === 1 ? 'gol' : topScorers[0].goals < 5 ? 'gola' : 'golova'}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              <div className="space-y-3">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Kompletna lista</h2>
                {topScorers.map((player, index) => (
                  <Link
                    key={player.id}
                    href={`/players/${player.id}`}
                    className="flex items-center gap-4 px-2 py-4 bg-slate-800/50 rounded-xl border border-white/30 hover:border-white/60 transition-all cursor-pointer"
                  >

                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-white/30 shrink-0 flex items-center justify-center">
                      <Image
                        src={getPlayerImageUrl(player.image_url)}
                        alt={`${player.first_name} ${player.last_name}`}
                        fill
                        className="object-contain object-center"
                        unoptimized
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          if (target.src !== '/no-image-player.png') {
                            console.warn(`Failed to load image for player ${player.id}:`, player.image_url)
                            target.src = '/no-image-player.png'
                          }
                        }}
                      />
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-base sm:text-lg truncate">
                        {player.first_name} {player.last_name}
                      </h3>
                      {player.team && (
                        <p className="text-white/60 text-sm truncate mt-1">
                          {player.team}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-white/40">
                        <span>{player.matches_played} utakmica</span>
                      </div>
                    </div>

                    {/* Goals */}
                    <div className="text-right shrink-0">
                      <div className="text-white font-bold text-2xl sm:text-3xl">
                        {player.goals}
                      </div>

                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

