'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/header'
import { getPlayerImageUrl } from '@/lib/image-utils'
import { useSeason } from '@/components/season-provider'
import FantasyPitch from '@/components/fantasy-pitch'

type SortKey = 'total' | 'last_gw' | 'avg' | 'goals'

interface LeaderboardRow {
  id: number
  first_name: string
  last_name: string
  team: string | null
  image_url?: string | null
  total_points: number
  matches_played: number
  goals: number
  avg_points: number
  last_gw_points: number
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'total', label: 'Total pts' },
  { key: 'last_gw', label: 'Last GW' },
  { key: 'avg', label: 'Avg / match' },
  { key: 'goals', label: 'Goals' },
]

export default function FantasyPage() {
  const { currentSeason } = useSeason()
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [lastGw, setLastGw] = useState<number | null>(null)
  const [sort, setSort] = useState<SortKey>('total')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchLeaderboard()
  }, [currentSeason?.id, sort])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      setMessage(null)
      const seasonQuery = currentSeason?.id ? `&season_id=${currentSeason.id}` : ''
      const response = await fetch(`/api/fantasy/leaderboard?sort=${sort}${seasonQuery}`)
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to load')
      }
      const data = await response.json()
      setRows(data.leaderboard || [])
      setLastGw(data.last_gameweek ?? null)
      if (data.message) setMessage(data.message)
    } catch (error: any) {
      console.error(error)
      setRows([])
      setMessage(error.message || 'Failed to load fantasy data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--fpl-p120)] pb-20 md:pb-0">
      <Header />
      <section className="relative px-3 sm:px-6 lg:px-8 py-6 sm:py-10 max-w-3xl mx-auto pt-4 sm:pt-28">
        <div className="mb-5">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Fantasy</h1>
          <p className="text-white/45 text-sm mt-1">
            {currentSeason?.name ? `${currentSeason.name} · ` : ''}
            Automatic player scoring
            {lastGw ? ` · GW${lastGw}` : ''}
          </p>
        </div>

        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setSort(opt.key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                sort === opt.key
                  ? 'bg-[var(--fpl-green)] text-[var(--fpl-purple)]'
                  : 'bg-[var(--fpl-purple)] text-white/70 border border-white/10 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-white/60 text-center py-12 text-sm">Loading fantasy...</div>
        ) : message && rows.length === 0 ? (
          <div className="rounded-2xl bg-[var(--fpl-purple)] border border-white/10 px-4 py-8 text-center">
            <p className="text-white text-sm mb-2">Fantasy not ready</p>
            <p className="text-white/50 text-xs">{message}</p>
          </div>
        ) : (
          <>
            <FantasyPitch players={rows} sortBy={sort} />

            <div className="rounded-2xl bg-[var(--fpl-purple)] border border-white/10 overflow-hidden">
              <div className="grid grid-cols-[24px_1fr_44px_44px_48px_48px] gap-x-1.5 px-2 sm:px-3 py-2 text-[10px] sm:text-[11px] text-white/45 font-semibold uppercase tracking-wide border-b border-white/10">
                <span>#</span>
                <span>Player</span>
                <span className="text-center">GW</span>
                <span className="text-center">G</span>
                <span className="text-center">Avg</span>
                <span className="text-center">Pts</span>
              </div>

              <div>
                {rows.map((player, index) => (
                  <Link
                    key={player.id}
                    href={`/fantasy/players/${player.id}`}
                    className="grid grid-cols-[24px_1fr_44px_44px_48px_48px] gap-x-1.5 items-center px-2 sm:px-3 py-2 border-b border-white/10 last:border-b-0 hover:bg-white/5 transition"
                  >
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        index === 0
                          ? 'text-[var(--fpl-green)]'
                          : index < 3
                            ? 'text-white'
                            : 'text-white/45'
                      }`}
                    >
                      {index + 1}
                    </span>

                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="relative w-8 h-11 shrink-0 overflow-hidden">
                        <Image
                          src={getPlayerImageUrl(player.image_url, true)}
                          alt={`${player.first_name} ${player.last_name}`}
                          fill
                          className="object-contain object-bottom"
                          unoptimized
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/no-image-player.png'
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-semibold truncate">
                          {player.first_name.charAt(0)}. {player.last_name}
                        </p>
                        {player.team && (
                          <p className="text-white/45 text-[11px] truncate">{player.team}</p>
                        )}
                      </div>
                    </div>

                    <span
                      className={`text-center text-sm tabular-nums ${
                        sort === 'last_gw' ? 'text-white font-bold' : 'text-white/70'
                      }`}
                    >
                      {player.last_gw_points}
                    </span>
                    <span
                      className={`text-center text-sm tabular-nums ${
                        sort === 'goals' ? 'text-white font-bold' : 'text-white/70'
                      }`}
                    >
                      {player.goals}
                    </span>
                    <span
                      className={`text-center text-sm tabular-nums ${
                        sort === 'avg' ? 'text-white font-bold' : 'text-white/70'
                      }`}
                    >
                      {player.avg_points.toFixed(1)}
                    </span>
                    <span
                      className={`text-center text-sm tabular-nums ${
                        sort === 'total' ? 'text-white font-bold' : 'text-white/70'
                      }`}
                    >
                      {player.total_points}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  )
}
