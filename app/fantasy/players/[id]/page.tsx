'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
import Header from '@/components/header'
import { getPlayerImageUrl } from '@/lib/image-utils'
import { useSeason } from '@/components/season-provider'

interface BreakdownItem {
  key: string
  label: string
  points: number
}

interface HistoryRow {
  id: number
  result_id: number
  gameweek: number
  total_points: number
  goals_scored: number
  appearance_points: number
  result_points: number
  goals_points: number
  team_scored_bonus: number
  team_conceded_penalty: number
  manual_adjustment: number
  manual_adjustment_reason?: string | null
  breakdown: BreakdownItem[]
  match: {
    id: number
    date: string
    opponent: string
    isHome: boolean
    home_score: number
    away_score: number
    home_team: string
    away_team: string
  } | null
}

export default function FantasyPlayerPage() {
  const params = useParams()
  const router = useRouter()
  const { currentSeason } = useSeason()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => {
    if (params.id) fetchData()
  }, [params.id, currentSeason?.id])

  const fetchData = async () => {
    try {
      setLoading(true)
      const seasonQuery = currentSeason?.id ? `?season_id=${currentSeason.id}` : ''
      const response = await fetch(`/api/fantasy/players/${params.id}${seasonQuery}`)
      if (response.status === 404) {
        router.push('/fantasy')
        return
      }
      if (!response.ok) throw new Error('Failed to load')
      setData(await response.json())
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--fpl-p120)] pb-20">
        <Header />
        <div className="text-white/60 text-center py-16 text-sm">Loading...</div>
      </main>
    )
  }

  if (!data?.player) {
    return (
      <main className="min-h-screen bg-[var(--fpl-p120)] pb-20">
        <Header />
        <div className="text-white text-center py-16">
          <p className="mb-4">Player not found</p>
          <Link href="/fantasy" className="text-white/70 underline">
            Back to Fantasy
          </Link>
        </div>
      </main>
    )
  }

  const { player, totals, history } = data as {
    player: any
    totals: any
    history: HistoryRow[]
  }

  return (
    <main className="min-h-screen bg-[var(--fpl-p120)] pb-20 md:pb-0">
      <Header />
      <section className="relative px-3 sm:px-6 max-w-3xl mx-auto pt-4 sm:pt-28 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/fantasy"
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/15 transition"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <p className="text-white/45 text-xs font-semibold uppercase tracking-wide">Fantasy profile</p>
            <h1 className="text-white text-xl font-bold leading-tight">
              {player.first_name} {player.last_name}
            </h1>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[var(--fpl-cyan)] via-[#7a5cff] to-[var(--fpl-lilac)] min-h-[140px] mb-3">
          <div className="absolute left-0 bottom-0 w-[40%] h-full">
            <Image
              src={getPlayerImageUrl(player.image_url)}
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
          <div className="relative z-10 pl-[38%] pr-4 py-5">
            <p className="text-[var(--fpl-purple)]/80 text-xs font-semibold">Fantasy points</p>
            <p className="text-[var(--fpl-purple)] text-4xl font-black leading-none mt-1">
              {totals.total_points}
            </p>
            <p className="text-[var(--fpl-purple)]/80 text-sm font-semibold mt-2">
              {player.team || 'No club'}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--fpl-purple)] border border-white/10 mb-3">
          <div className="grid grid-cols-4 divide-x divide-white/10">
            <div className="px-2 py-3 text-center">
              <p className="text-white/45 text-[10px]">Apps</p>
              <p className="text-white text-lg font-bold">{totals.matches_played}</p>
            </div>
            <div className="px-2 py-3 text-center">
              <p className="text-white/45 text-[10px]">Goals</p>
              <p className="text-white text-lg font-bold">{totals.goals}</p>
            </div>
            <div className="px-2 py-3 text-center">
              <p className="text-white/45 text-[10px]">Avg</p>
              <p className="text-white text-lg font-bold">{totals.avg_points}</p>
            </div>
            <div className="px-2 py-3 text-center">
              <p className="text-white/45 text-[10px]">
                {totals.last_gameweek ? `GW${totals.last_gameweek}` : 'Last'}
              </p>
              <p className="text-white text-lg font-bold">{totals.last_gw_points}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--fpl-purple)] border border-white/10 overflow-hidden">
          <div className="px-3 sm:px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-white font-bold text-sm">Points history</h2>
            <span className="text-white/40 text-[11px]">{history.length} matches</span>
          </div>

          {history.length === 0 ? (
            <p className="text-white/50 text-sm text-center py-8">No fantasy points yet</p>
          ) : (
            <div>
              {[...history].reverse().map((row) => (
                <div key={row.id} className="border-b border-white/10 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                    className="w-full flex items-center gap-3 px-3 sm:px-4 py-3 hover:bg-white/5 transition text-left"
                  >
                    <div className="w-10 shrink-0">
                      <p className="text-[var(--fpl-cyan)] text-xs font-bold">GW{row.gameweek}</p>
                      {row.match && (
                        <p className="text-white/40 text-[10px]">
                          {format(new Date(row.match.date), 'd MMM')}
                        </p>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">
                        {row.match
                          ? `${row.match.isHome ? 'vs' : '@'} ${row.match.opponent}`
                          : `Match #${row.result_id}`}
                      </p>
                      {row.match && (
                        <p className="text-white/45 text-[11px]">
                          {row.match.home_score}-{row.match.away_score}
                          {row.goals_scored > 0 ? ` · ${row.goals_scored}g` : ''}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        row.total_points > 0
                          ? 'text-[var(--fpl-green)]'
                          : row.total_points < 0
                            ? 'text-[var(--fpl-pink)]'
                            : 'text-white/60'
                      }`}
                    >
                      {row.total_points > 0 ? '+' : ''}
                      {row.total_points}
                    </span>
                  </button>

                  {expanded === row.id && (
                    <div className="px-3 sm:px-4 pb-3">
                      <div className="rounded-xl bg-[var(--fpl-p90)] border border-white/10 p-3 space-y-1.5">
                        {(row.breakdown || []).map((item) => (
                          <div
                            key={item.key}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-white/70">{item.label}</span>
                            <span
                              className={`font-semibold tabular-nums ${
                                item.points > 0
                                  ? 'text-[var(--fpl-green)]'
                                  : item.points < 0
                                    ? 'text-[var(--fpl-pink)]'
                                    : 'text-white/50'
                              }`}
                            >
                              {item.points > 0 ? '+' : ''}
                              {item.points}
                            </span>
                          </div>
                        ))}
                        {row.manual_adjustment_reason && (
                          <p className="text-white/40 text-[11px] pt-1 border-t border-white/10">
                            Reason: {row.manual_adjustment_reason}
                          </p>
                        )}
                        {row.match && (
                          <Link
                            href={`/matches/${row.match.id}`}
                            className="inline-block text-[var(--fpl-cyan)] text-xs font-semibold pt-1"
                          >
                            View match →
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-3 text-center">
          <Link
            href={`/players/${player.id}`}
            className="text-white/50 text-xs hover:text-white/80 transition"
          >
            Open player profile
          </Link>
        </div>
      </section>
    </main>
  )
}
