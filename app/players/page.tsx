'use client'

import { useEffect, useState } from 'react'
import { Player } from '@/lib/supabase'
import Header from '@/components/header'
import Image from 'next/image'
import Link from 'next/link'
import { getPlayerImageUrl } from '@/lib/image-utils'
import { Ambulance } from 'lucide-react'
import { useSeason } from '@/components/season-provider'
import { SHOW_PLAYER_RATINGS } from '@/lib/features'

interface PlayerWithStats extends Player {
  goals: number
  matches_played: number
  average_rating: number | null
  fantasy_points?: number
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<PlayerWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { currentSeason } = useSeason()

  useEffect(() => {
    fetchPlayers()
  }, [currentSeason?.id])

  const fetchPlayers = async () => {
    try {
      const seasonQuery = currentSeason ? `?season_id=${currentSeason.id}` : ''
      const response = await fetch(`/api/players/stats${seasonQuery}`)
      const contentType = response.headers.get('content-type')

      if (response.ok) {
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          setPlayers(data || [])
        }
      } else if (response.status !== 503) {
        console.error('Error fetching players:', response.statusText)
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error fetching players:', error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const filteredPlayers = players.filter((player) => {
    const search = searchTerm.toLowerCase()
    const fullName = `${player.first_name} ${player.last_name}`.toLowerCase()
    const team = (player.team || '').toLowerCase()
    return fullName.includes(search) || team.includes(search)
  })

  return (
    <main className="min-h-screen bg-[var(--fpl-p120)] pb-20 md:pb-0">
      <Header />
      <section className="relative px-3 sm:px-6 lg:px-8 py-6 sm:py-10 max-w-3xl mx-auto pt-4 sm:pt-28">
        <div className="mb-5">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Players</h1>
        </div>

        <div className="relative mb-5">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10">
            <svg className="w-4.5 h-4.5 text-white/45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-10 py-3 rounded-xl bg-[var(--fpl-purple)] border border-white/10 text-white placeholder:text-white/35 focus:outline-none focus:border-white/25 transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="Clear search"
            >
              <svg className="w-3.5 h-3.5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-white/60 text-center py-12 text-sm">Loading players...</div>
        ) : filteredPlayers.length === 0 ? (
          <div className="text-white text-center py-12">
            <p className="text-lg mb-2">{searchTerm ? 'No search results' : 'No players'}</p>
            <p className="text-white/50 text-sm">
              {searchTerm ? 'Try a different search term' : 'Add players in the admin panel'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {filteredPlayers.map((player) => (
              <Link
                key={player.id}
                href={`/players/${player.id}`}
                className="group relative overflow-hidden rounded-2xl bg-[var(--fpl-purple)] border border-white/10 hover:border-white/20 transition"
              >
                <div className="relative aspect-[3/4] bg-gradient-to-b from-[var(--fpl-cyan)] via-[#7a5cff] to-[var(--fpl-lilac)]">
                  <Image
                    src={getPlayerImageUrl(player.image_url, true)}
                    alt={`${player.first_name} ${player.last_name}`}
                    fill
                    className="object-contain object-bottom group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 33vw, 220px"
                    unoptimized
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/no-image-player.png'
                    }}
                  />

                  {SHOW_PLAYER_RATINGS && player.average_rating !== null && (
                    <div className="absolute left-1.5 top-1.5 rounded-md bg-[var(--fpl-purple)]/85 px-1.5 py-0.5">
                      <span className="text-white text-xs font-black leading-none">
                        {player.average_rating}
                      </span>
                    </div>
                  )}

                  <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
                    {player.injury === true && (
                      <div className="flex items-center justify-center bg-white rounded-full p-0.5 border border-red-600">
                        <Ambulance className="w-3.5 h-3.5 text-red-600" strokeWidth={2.5} />
                      </div>
                    )}
                    <div className="rounded-md bg-white px-1.5 py-0.5 shadow-sm">
                      <span className="text-[var(--fpl-purple)] text-xs font-black tabular-nums leading-none">
                        {player.fantasy_points ?? 0}
                      </span>
                    </div>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 bg-[var(--fpl-purple)]/92 px-1.5 py-2 backdrop-blur-[2px]">
                    <h3 className="text-white text-[11px] sm:text-xs font-bold truncate text-center leading-tight">
                      {player.first_name.charAt(0).toUpperCase()}. {player.last_name}
                    </h3>
                    {player.team && (
                      <p className="text-white/50 text-[10px] truncate text-center mt-0.5">
                        {player.team}
                      </p>
                    )}
                    {SHOW_PLAYER_RATINGS && (
                      <div className="mt-1.5 flex justify-around text-[9px] leading-none">
                        {player.pace != null && (
                          <span className="text-white/80 font-semibold">PAC {player.pace}</span>
                        )}
                        {player.shooting != null && (
                          <span className="text-white/80 font-semibold">SHO {player.shooting}</span>
                        )}
                        {player.passing != null && (
                          <span className="text-white/80 font-semibold">PAS {player.passing}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
