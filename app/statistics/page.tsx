'use client'

import { useEffect, useState } from 'react'
import { Player } from '@/lib/supabase'
import Header from '@/components/header'
import Image from 'next/image'
import Link from 'next/link'
import { getPlayerImageUrl } from '@/lib/image-utils'
import { useSeason } from '@/components/season-provider'
import { toId } from '@/lib/ids'

interface PlayerWithStats extends Player {
  goals: number
  matches_played: number
}

const PLACEHOLDER_SRC = '/no-image-player.png'

function normalizePlayerStats(raw: any): PlayerWithStats | null {
  const id = toId(raw?.id)
  if (id == null) return null
  return {
    ...raw,
    id,
    first_name: raw.first_name || '',
    last_name: raw.last_name || '',
    image_url: raw.image_url ?? null,
    goals: Number(raw.goals) || 0,
    matches_played: Number(raw.matches_played) || 0,
  }
}

function PlayerAvatar({
  imageUrl,
  name,
  className,
  imageClassName,
  priority = false,
}: {
  imageUrl?: string | null
  name: string
  className: string
  imageClassName?: string
  priority?: boolean
}) {
  const resolved = getPlayerImageUrl(imageUrl)
  const [src, setSrc] = useState(resolved)

  useEffect(() => {
    setSrc(getPlayerImageUrl(imageUrl))
  }, [imageUrl])

  return (
    <div className={className}>
      <Image
        src={src}
        alt={name}
        fill
        className={imageClassName || 'object-cover'}
        priority={priority}
        loading="eager"
        unoptimized
        onError={() => setSrc(PLACEHOLDER_SRC)}
      />
    </div>
  )
}

export default function StatisticsPage() {
  const [players, setPlayers] = useState<PlayerWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { currentSeason, loading: seasonLoading } = useSeason()

  useEffect(() => {
    if (seasonLoading) return

    let cancelled = false

    const fetchPlayers = async () => {
      setLoading(true)
      setError(null)
      try {
        const seasonQuery = currentSeason?.id != null ? `?season_id=${currentSeason.id}` : ''
        const response = await fetch(`/api/players/stats${seasonQuery}`, {
          cache: 'no-store',
        })

        if (!response.ok) {
          if (response.status !== 503) {
            setError('Could not load statistics')
          }
          if (!cancelled) setPlayers([])
          return
        }

        const data = await response.json()
        const list = (Array.isArray(data) ? data : [])
          .map(normalizePlayerStats)
          .filter((p): p is PlayerWithStats => !!p)
          .sort((a, b) => {
            if (b.goals !== a.goals) return b.goals - a.goals
            if (b.matches_played !== a.matches_played) return b.matches_played - a.matches_played
            return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
          })

        if (!cancelled) setPlayers(list)
      } catch (err) {
        console.error('Error fetching players:', err)
        if (!cancelled) {
          setPlayers([])
          setError('Could not load statistics')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchPlayers()
    return () => {
      cancelled = true
    }
  }, [currentSeason?.id, seasonLoading])

  const topScorers = players.filter((player) => player.goals > 0)
  const leader = topScorers[0]
  const restScorers = topScorers.slice(1)

  return (
    <main className="min-h-screen bg-[var(--fpl-p120)] pb-20 md:pb-0">
      <Header />
      <section className="relative px-3 sm:px-6 lg:px-8 py-6 sm:py-10 max-w-3xl mx-auto pt-4 sm:pt-28">
        <div className="mb-5">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Statistics</h1>
          {currentSeason?.name && (
            <p className="text-white/45 text-sm mt-1">{currentSeason.name}</p>
          )}
        </div>

        {loading ? (
          <div className="text-white/60 text-center py-12 text-sm">Loading statistics...</div>
        ) : error ? (
          <div className="text-white text-center py-12">
            <p className="text-lg mb-2">{error}</p>
            <p className="text-white/50 text-sm">Refresh the page or try again later</p>
          </div>
        ) : topScorers.length === 0 ? (
          <div className="text-white text-center py-12">
            <p className="text-lg mb-2">No scorers data</p>
            <p className="text-white/50 text-sm">Add match results in the admin panel</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leader && (
              <Link
                href={`/players/${leader.id}`}
                className="block relative overflow-hidden rounded-2xl bg-gradient-to-r from-[var(--fpl-cyan)] via-[#7a5cff] to-[var(--fpl-lilac)] min-h-[148px] hover:opacity-95 transition"
              >
                <PlayerAvatar
                  imageUrl={leader.image_url}
                  name={`${leader.first_name} ${leader.last_name}`}
                  className="absolute left-0 bottom-0 w-[42%] h-full"
                  imageClassName="object-contain object-bottom"
                  priority
                />

                <div className="relative z-10 pl-[40%] pr-4 py-5 flex flex-col justify-center min-h-[148px]">
                  <p className="text-[var(--fpl-purple)]/80 text-xs font-semibold mb-0.5">
                    Top scorer
                  </p>
                  <p className="text-[var(--fpl-purple)] text-base font-medium leading-tight">
                    {leader.first_name}
                  </p>
                  <h2 className="text-[var(--fpl-purple)] text-2xl sm:text-3xl font-black leading-tight">
                    {leader.last_name}
                  </h2>
                  {leader.team && (
                    <p className="text-[var(--fpl-purple)]/80 text-sm font-semibold mt-1">
                      {leader.team}
                    </p>
                  )}
                  <p className="text-[var(--fpl-purple)] text-3xl font-black mt-2 leading-none">
                    {leader.goals}
                    <span className="text-sm font-bold ml-1.5 opacity-70">
                      {leader.goals === 1 ? 'goal' : 'goals'}
                    </span>
                  </p>
                </div>
              </Link>
            )}

            {restScorers.length > 0 && (
              <div className="rounded-2xl bg-[var(--fpl-purple)] border border-white/10 overflow-hidden">
                <div className="px-3 sm:px-4 py-3 border-b border-white/10 flex items-center justify-between">
                  <h2 className="text-white font-bold text-sm">Goal scorers</h2>
                  <span className="text-white/40 text-[11px]">
                    {restScorers.length} players
                  </span>
                </div>

                <div className="grid grid-cols-[36px_1fr_48px_48px] gap-2 px-3 sm:px-4 py-2 text-[11px] text-white/45 font-semibold uppercase tracking-wide border-b border-white/10">
                  <span>#</span>
                  <span>Player</span>
                  <span className="text-center">Apps</span>
                  <span className="text-center">G</span>
                </div>

                <div>
                  {restScorers.map((player, index) => {
                    const rank = index + 2
                    return (
                      <Link
                        key={player.id}
                        href={`/players/${player.id}`}
                        className="grid grid-cols-[36px_1fr_48px_48px] gap-2 items-center px-3 sm:px-4 py-3 border-b border-white/10 last:border-b-0 hover:bg-white/5 transition"
                      >
                        <span
                          className={`text-sm font-bold tabular-nums ${
                            rank <= 3 ? 'text-white' : 'text-white/45'
                          }`}
                        >
                          {rank}
                        </span>

                        <div className="flex items-center gap-2.5 min-w-0">
                          <PlayerAvatar
                            imageUrl={player.image_url}
                            name={`${player.first_name} ${player.last_name}`}
                            className="relative w-10 h-10 rounded-full overflow-hidden bg-white/10 shrink-0"
                            imageClassName="object-contain object-bottom"
                          />
                          <div className="min-w-0">
                            <p className="text-white text-sm font-semibold truncate">
                              {player.first_name} {player.last_name}
                            </p>
                            {player.team && (
                              <p className="text-white/45 text-[11px] truncate">
                                {player.team}
                              </p>
                            )}
                          </div>
                        </div>

                        <span className="text-center text-sm text-white/70 tabular-nums">
                          {player.matches_played}
                        </span>
                        <span className="text-center text-sm text-white font-bold tabular-nums">
                          {player.goals}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  )
}
