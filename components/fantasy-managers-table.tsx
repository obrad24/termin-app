'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSeason } from '@/components/season-provider'

type ManagerRow = {
  rank: number
  account_id: number
  team_name: string
  manager_name: string
  nickname: string
  last_gw_points: number
  total_points: number
}

export default function FantasyManagersTable() {
  const { currentSeason } = useSeason()
  const [rows, setRows] = useState<ManagerRow[]>([])
  const [lastGw, setLastGw] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [meNickname, setMeNickname] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/player-auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) setMeNickname(data.account?.nickname || null)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchTable()
  }, [currentSeason?.id])

  const fetchTable = async () => {
    try {
      setLoading(true)
      const seasonQuery = currentSeason?.id ? `?season_id=${currentSeason.id}` : ''
      const response = await fetch(`/api/fantasy/managers${seasonQuery}`)
      if (!response.ok) {
        setRows([])
        return
      }
      const data = await response.json()
      setRows(data.leaderboard || [])
      setLastGw(data.last_gameweek ?? null)
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  if (!loading && rows.length === 0) return null

  return (
    <section className="relative bg-[var(--fpl-p120)] px-3 sm:px-6 py-6 sm:py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
              Fantasy league
            </h2>
            <p className="text-white/45 text-xs mt-1">
              Managers
              {lastGw ? ` · GW${lastGw}` : ''}
              {currentSeason?.name ? ` · ${currentSeason.name}` : ''}
            </p>
          </div>
          <Link
            href="/fantasy"
            className="text-[var(--fpl-green)] text-xs sm:text-sm font-semibold hover:underline shrink-0"
          >
            View all
          </Link>
        </div>

        {loading ? (
          <p className="text-white/60 text-center py-10 text-sm">Loading league...</p>
        ) : (
          <div className="rounded-2xl bg-[var(--fpl-purple)] border border-white/10 overflow-hidden">
            <div className="grid grid-cols-[52px_1fr_48px_56px] gap-x-2 px-3 py-2.5 text-[11px] text-white/45 font-semibold border-b border-white/10">
              <span>Rank</span>
              <span>Team & Manager</span>
              <span className="text-right">GW</span>
              <span className="text-right">Total</span>
            </div>

            <div>
              {rows.map((row) => {
                const isMe =
                  meNickname != null &&
                  row.nickname.toLowerCase() === meNickname.toLowerCase()

                return (
                  <div
                    key={row.account_id}
                    className={`grid grid-cols-[52px_1fr_48px_56px] gap-x-2 items-center px-3 py-3 border-b border-white/10 last:border-b-0 ${
                      isMe
                        ? 'bg-gradient-to-r from-[var(--fpl-cyan)]/35 via-[#5b8cff]/25 to-transparent'
                        : ''
                    }`}
                  >
                    <span className="text-white text-sm font-bold tabular-nums">
                      {row.rank}
                    </span>

                    <div className="min-w-0">
                      <p className="text-white text-sm font-bold truncate leading-tight">
                        {row.team_name}
                      </p>
                      <p className="text-white/50 text-xs truncate mt-0.5">
                        {row.manager_name}
                      </p>
                    </div>

                    <span className="text-right text-white text-sm tabular-nums">
                      {row.last_gw_points}
                    </span>
                    <span className="text-right text-white text-sm font-semibold tabular-nums">
                      {row.total_points}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
