'use client'

import { useEffect, useState } from 'react'
import { Player } from '@/lib/supabase'
import Header from '@/components/header'
import Image from 'next/image'
import Link from 'next/link'
import { getPlayerImageUrl } from '@/lib/image-utils'

interface PlayerWithStats extends Player {
  goals: number
  matches_played: number
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<PlayerWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([])

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

  // Filtriraj igrače po search termu
  const filteredPlayers = players.filter(player => {
    const search = searchTerm.toLowerCase()
    const fullName = `${player.first_name} ${player.last_name}`.toLowerCase()
    const team = (player.team || '').toLowerCase()
    return fullName.includes(search) || team.includes(search)
  })

  const togglePlayerSelection = (playerId: number) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    )
  }

  return (
    <main className="min-h-screen bg-[#a80710] pb-20 md:pb-0">
      <Header />
      <section className="relative px-2 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-7xl mx-auto pt-4 sm:pt-28">
        <div className="space-y-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">Igrači</h1>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Pretraži igrače..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-12 py-4 rounded-2xl bg-slate-800/50 border border-[#a80710]/30 text-white placeholder-white/40 focus:outline-none focus:border-[#a80710]/60 focus:ring-2 focus:ring-[#a80710]/20 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-white text-center py-12 text-sm sm:text-base">Učitavanje igrača...</div>
          ) : filteredPlayers.length === 0 ? (
            <div className="text-white text-center py-12">
              <p className="text-lg sm:text-xl mb-2">
                {searchTerm ? 'Nema rezultata pretrage' : 'Nema igrača'}
              </p>
              <p className="text-white/60 text-sm sm:text-base">
                {searchTerm ? 'Pokušajte sa drugim terminom' : 'Dodajte igrače u admin panelu'}
              </p>
            </div>
          ) : (
            <div className=" backdrop-blur-xl rounded-3xl border border-[#a80710]/30 sm:p-6">
              {/* Players Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredPlayers.map((player) => {
                  const isSelected = selectedPlayers.includes(player.id)
                  return (
                    <Link
                      key={player.id}
                      href={`/players/${player.id}`}
                      className="relative bg-slate-800/50 rounded-2xl border border-[#a80710]/30 hover:border-[#a80710]/60 transition-all cursor-pointer overflow-hidden group block"
                    >

                      {/* Player Image */}
                      <div className="relative w-full aspect-square rounded-t-2xl overflow-hidden bg-slate-700/50">
                        <Image
                          src={getPlayerImageUrl(player.image_url)}
                          alt={`${player.first_name} ${player.last_name}`}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                          unoptimized
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/no-image-player.png'
                          }}
                        />
                      </div>

                      {/* Player Name */}
                      <div className="p-3 text-center bg-red-950">
                        <h3 className="font-bold text-white text-sm sm:text-base truncate uppercase">
                          {player.first_name} {player.last_name}
                        </h3>
                        {player.team && (
                          <p className="text-xs text-white/60 truncate mt-1">
                            {player.team}
                          </p>
                        )}
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

