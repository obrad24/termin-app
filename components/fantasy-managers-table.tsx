'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSeason } from '@/components/season-provider'
import { getPlayerImageUrl } from '@/lib/image-utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

type ManagerRow = {
  rank: number
  account_id: number
  team_name: string
  manager_name: string
  nickname: string
  last_gw_points: number
  total_points: number
}

type SquadPlayer = {
  id: number
  first_name: string
  last_name: string
  team: string | null
  image_url?: string | null
  price?: number | null
  is_captain?: boolean
}

type ManagerSquad = {
  account_id: number
  nickname: string
  team_name: string
  gameweek: number | null
  players: SquadPlayer[]
}

function formatPrice(price?: number | null) {
  if (price == null || Number.isNaN(Number(price))) return null
  const n = Number(price)
  return `£${n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)}m`
}

export default function FantasyManagersTable() {
  const { currentSeason } = useSeason()
  const [rows, setRows] = useState<ManagerRow[]>([])
  const [lastGw, setLastGw] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [meNickname, setMeNickname] = useState<string | null>(null)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [selected, setSelected] = useState<ManagerRow | null>(null)
  const [squad, setSquad] = useState<ManagerSquad | null>(null)
  const [squadLoading, setSquadLoading] = useState(false)
  const [squadError, setSquadError] = useState<string | null>(null)

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

  const openManager = async (row: ManagerRow) => {
    setSelected(row)
    setSheetOpen(true)
    setSquad(null)
    setSquadError(null)
    setSquadLoading(true)
    try {
      const seasonQuery = currentSeason?.id ? `?season_id=${currentSeason.id}` : ''
      const res = await fetch(`/api/fantasy/managers/${row.account_id}${seasonQuery}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not load squad')
      setSquad(data)
    } catch (err: any) {
      setSquadError(err.message || 'Could not load squad')
    } finally {
      setSquadLoading(false)
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
                  <button
                    key={row.account_id}
                    type="button"
                    onClick={() => openManager(row)}
                    className={`w-full grid grid-cols-[52px_1fr_48px_56px] gap-x-2 items-center px-3 py-3 border-b border-white/10 last:border-b-0 text-left hover:bg-white/5 transition ${
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
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open)
          if (!open) {
            setSelected(null)
            setSquad(null)
            setSquadError(null)
          }
        }}
      >
        <SheetContent
          side="bottom"
          className="bg-[var(--fpl-p120)] border-white/10 text-white rounded-t-2xl max-h-[85vh] overflow-y-auto"
        >
          <SheetHeader className="text-left pb-2">
            <SheetTitle className="text-white text-lg">
              {selected?.team_name || 'Fantasy team'}
            </SheetTitle>
            <SheetDescription className="text-white/50">
              {selected?.manager_name || selected?.nickname || 'Manager'}
              {squad?.gameweek ? ` · GW${squad.gameweek}` : ''}
            </SheetDescription>
          </SheetHeader>

          <div className="px-4 pb-6">
            {squadLoading ? (
              <p className="text-white/60 text-sm text-center py-8">Loading squad...</p>
            ) : squadError ? (
              <p className="text-red-300 text-sm text-center py-8">{squadError}</p>
            ) : !squad?.players?.length ? (
              <p className="text-white/50 text-sm text-center py-8">
                No squad saved yet
              </p>
            ) : (
              <div className="space-y-1.5">
                {squad.players.map((p) => (
                  <Link
                    key={p.id}
                    href={`/players/${p.id}`}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-[var(--fpl-purple)] px-3 py-2.5 hover:bg-white/5 transition"
                    onClick={() => setSheetOpen(false)}
                  >
                    <div className="relative w-10 h-12 shrink-0 overflow-hidden">
                      <Image
                        src={getPlayerImageUrl(p.image_url, true)}
                        alt={`${p.first_name} ${p.last_name}`}
                        fill
                        className="object-contain object-bottom"
                        unoptimized
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/no-image-player.png'
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-semibold truncate leading-tight">
                        {p.first_name} {p.last_name}
                      </p>
                      <p className="text-white/45 text-xs truncate mt-0.5">
                        {p.team || 'No club'}
                        {formatPrice(p.price) ? ` · ${formatPrice(p.price)}` : ''}
                      </p>
                    </div>
                    {p.is_captain && (
                      <span className="shrink-0 rounded-full bg-[var(--fpl-green)] text-[var(--fpl-purple)] text-[10px] font-black px-2 py-1">
                        C · x2
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </section>
  )
}
