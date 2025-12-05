'use client'

import { useEffect, useState } from 'react'
import { Player } from '@/lib/supabase'
import Link from 'next/link'
import Header from '@/components/header'

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchPlayers()
  }, [])

  const fetchPlayers = async () => {
    try {
      const response = await fetch('/api/players')
      if (response.ok) {
        const data = await response.json()
        setPlayers(data || [])
      }
    } catch (error) {
      console.error('Error fetching players:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPlayers = players.filter(player => {
    const search = searchTerm.toLowerCase()
    return (
      player.first_name.toLowerCase().includes(search) ||
      player.last_name.toLowerCase().includes(search) ||
      (player.team && player.team.toLowerCase().includes(search))
    )
  })

  // Grupiši igrače po timu
  const groupedPlayers = filteredPlayers.reduce((acc, player) => {
    const team = player.team || 'Bez tima'
    if (!acc[team]) {
      acc[team] = []
    }
    acc[team].push(player)
    return acc
  }, {} as Record<string, Player[]>)

  return (
    <main className="min-h-screen bg-slate-900">
      <Header />
      <section className="relative px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-7xl mx-auto pt-24 sm:pt-28">
        <div className="space-y-6 sm:space-y-8">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">Igrači</h1>
            <p className="text-blue-300/60 text-sm sm:text-base">Svi registrovani igrači</p>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Pretraži igrače..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-blue-500/20 border border-blue-400/30 text-white placeholder-blue-300/60 focus:outline-none focus:border-blue-400/60 focus:ring-2 focus:ring-blue-400/20"
            />
          </div>

          {loading ? (
            <div className="text-white text-center py-12 text-sm sm:text-base">Učitavanje igrača...</div>
          ) : filteredPlayers.length === 0 ? (
            <div className="text-white text-center py-12">
              <p className="text-lg sm:text-xl mb-2">
                {searchTerm ? 'Nema rezultata pretrage' : 'Nema igrača'}
              </p>
              <p className="text-blue-300/60 text-sm sm:text-base">
                {searchTerm ? 'Pokušajte sa drugim terminom' : 'Dodajte igrače u admin panelu'}
              </p>
            </div>
          ) : (
            Object.entries(groupedPlayers).map(([team, teamPlayers]) => (
              <div key={team} className="space-y-4">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                  {team}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {teamPlayers.map((player) => (
                    <div
                      key={player.id}
                      className="bg-slate-800/50 border border-blue-400/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 backdrop-blur-md hover:border-blue-400/60 transition-all hover:shadow-lg hover:scale-[1.02]"
                    >
                      <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-slate-700/50 flex items-center justify-center border-2 border-blue-400/30">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={player.image_url || '/no-image-player.png'}
                            alt={`${player.first_name} ${player.last_name}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = '/no-image-player.png'
                            }}
                          />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold text-base sm:text-lg mb-1">
                            {player.first_name} {player.last_name}
                          </h3>
                          <p className="text-blue-300/60 text-xs sm:text-sm">
                            Godina rođenja: {player.birth_year}
                          </p>
                        </div>
                      </div>
                    </div>
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

