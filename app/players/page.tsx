'use client'

import { useEffect, useState } from 'react'
import { Player } from '@/lib/supabase'
import Header from '@/components/header'
import Image from 'next/image'

interface PlayerWithStats extends Player {
  goals: number
  matches_played: number
}

type FilterType = 'goals' | 'matches'

export default function PlayersPage() {
  const [players, setPlayers] = useState<PlayerWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterType>('goals')

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
          setPlayers(data || [])
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
          console.error('Error fetching players:', errorData)
        }
      }
    } catch (error) {
      // Loguj samo ako nije network error ili slično
      if (error instanceof Error) {
        console.error('Error fetching players:', error.message)
      } else {
        console.error('Error fetching players:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  // Sortiraj i filtriraj igrače
  const sortedPlayers = [...players].sort((a, b) => {
    if (activeFilter === 'goals') {
      // Sortiraj po golovima (opadajuće), pa po imenu ako su isti
      if (b.goals !== a.goals) {
        return b.goals - a.goals
      }
      return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
    } else {
      // Sortiraj po odigranim mečevima (opadajuće), pa po imenu ako su isti
      if (b.matches_played !== a.matches_played) {
        return b.matches_played - a.matches_played
      }
      return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
    }
  })

  return (
    <main className="min-h-screen bg-[#a80710]">
      <Header />
      <section className="relative px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-7xl mx-auto pt-24 sm:pt-28">
        <div className="space-y-6 sm:space-y-8">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">Igrači</h1>
            <p className="text-white/60 text-sm sm:text-base">Statistike igrača</p>
          </div>

          {/* Tabs za filtriranje */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={() => setActiveFilter('goals')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeFilter === 'goals'
                  ? 'bg-[#a80710] text-white shadow-lg border border-[#a80710]/60'
                  : 'bg-slate-800/50 text-white/60 hover:bg-slate-700/50 hover:text-white border border-slate-700/50'
              }`}
            >
              Najbolji strelac
            </button>
            <button
              onClick={() => setActiveFilter('matches')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeFilter === 'matches'
                  ? 'bg-[#a80710] text-white shadow-lg border border-[#a80710]/60'
                  : 'bg-slate-800/50 text-white/60 hover:bg-slate-700/50 hover:text-white border border-slate-700/50'
              }`}
            >
              Najviše odigranih mečeva
            </button>
          </div>

          {loading ? (
            <div className="text-white text-center py-12 text-sm sm:text-base">Učitavanje igrača...</div>
          ) : sortedPlayers.length === 0 ? (
            <div className="text-white text-center py-12">
              <p className="text-lg sm:text-xl mb-2">Nema igrača</p>
              <p className="text-white/60 text-sm sm:text-base">Dodajte igrače u admin panelu</p>
            </div>
          ) : (
            <div className="bg-slate-800/50 border border-[#a80710]/30 rounded-2xl sm:rounded-3xl backdrop-blur-md shadow-2xl overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto">
                <div className="divide-y divide-slate-700/50">
                  {sortedPlayers.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-4 p-4 sm:p-6 hover:bg-slate-700/30 transition-colors"
                    >
                      {/* Rank */}
                      <div className="shrink-0 w-12 text-center">
                        <span className="text-lg font-bold text-white">
                          {index + 1}.
                        </span>
                      </div>

                      {/* Avatar */}
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-slate-700/50 shrink-0 border-2 border-[#a80710]/30">
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

                      {/* Name and Team */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-base sm:text-lg truncate">
                          {player.first_name} {player.last_name}
                        </h3>
                        <p className="text-sm text-white/60 truncate">
                          {player.team || 'Bez tima'}
                        </p>
                      </div>

                      {/* Statistic */}
                      <div className="shrink-0">
                        <span className="text-2xl sm:text-3xl font-bold text-white">
                          {activeFilter === 'goals' ? player.goals : player.matches_played}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

