'use client'

import Link from 'next/link'
import Image from 'next/image'
import { getPlayerImageUrl } from '@/lib/image-utils'

export type PitchPlayer = {
  id: number
  first_name: string
  last_name: string
  team: string | null
  image_url?: string | null
  total_points: number
  last_gw_points: number
  avg_points?: number
  goals?: number
}

function PlayerCard({
  player,
  compact = false,
  value,
}: {
  player: PitchPlayer
  compact?: boolean
  value: string | number
}) {
  return (
    <Link
      href={`/fantasy/players/${player.id}`}
      className={`relative flex flex-col items-center ${compact ? 'w-[70px]' : 'w-[80px] sm:w-[88px]'} group`}
    >
      <div
        className={`relative z-0 ${
          compact ? 'w-[58px] h-[70px]' : 'w-[68px] h-[80px] sm:w-[76px] sm:h-[90px]'
        }`}
      >
        <Image
          src={getPlayerImageUrl(player.image_url, true)}
          alt={`${player.first_name} ${player.last_name}`}
          fill
          className="object-contain object-bottom drop-shadow-md group-hover:scale-105 transition-transform"
          unoptimized
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = '/no-image-player.png'
          }}
        />
      </div>
      <div className="relative z-10 w-full -mt-1 overflow-hidden rounded-[4px] bg-white shadow-sm leading-none">
        <p className={`text-[var(--fpl-purple)] font-bold truncate text-center px-1 ${compact ? 'text-[10px] py-[2px]' : 'text-[10px] sm:text-[11px] py-[3px]'}`}>
          {player.last_name}
        </p>
        <p className={`bg-[#e8e8e8] text-[var(--fpl-purple)] font-bold tabular-nums text-center px-1 ${compact ? 'text-[10px] py-[2px]' : 'text-[10px] sm:text-[11px] py-[3px]'}`}>
          {value}
        </p>
      </div>
    </Link>
  )
}

export default function FantasyPitch({
  players,
  sortBy = 'total',
}: {
  players: PitchPlayer[]
  sortBy?: 'total' | 'last_gw' | 'avg' | 'goals'
}) {
  const ranked = [...players].sort((a, b) => {
    if (sortBy === 'last_gw') {
      if (b.last_gw_points !== a.last_gw_points) return b.last_gw_points - a.last_gw_points
      return b.total_points - a.total_points
    }
    if (sortBy === 'avg') {
      const avgA = a.avg_points ?? 0
      const avgB = b.avg_points ?? 0
      if (avgB !== avgA) return avgB - avgA
      return b.total_points - a.total_points
    }
    if (sortBy === 'goals') {
      const gA = a.goals ?? 0
      const gB = b.goals ?? 0
      if (gB !== gA) return gB - gA
      return b.total_points - a.total_points
    }
    if (b.total_points !== a.total_points) return b.total_points - a.total_points
    return b.last_gw_points - a.last_gw_points
  })

  const cardValue = (p: PitchPlayer): string | number => {
    if (sortBy === 'last_gw') return p.last_gw_points
    if (sortBy === 'avg') return (p.avg_points ?? 0).toFixed(1)
    if (sortBy === 'goals') return p.goals ?? 0
    return p.total_points
  }

  if (ranked.length === 0) return null

  const starters = ranked.slice(0, 5)
  const subs = ranked.slice(5)

  const top = starters[0]
  const mid = starters.slice(1, 3)
  const bottom = starters.slice(3, 5)

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-white/10 bg-[var(--fpl-purple)]">
      <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-white font-bold text-sm">Top of the pitch</h2>
        <span className="text-white/45 text-[11px]">
          {sortBy === 'last_gw'
            ? 'Last GW top 5 + bench'
            : sortBy === 'avg'
              ? 'Avg / match top 5 + bench'
              : sortBy === 'goals'
                ? 'Goals top 5 + bench'
                : 'Top 5 + bench'}
        </span>
      </div>

      <div className="relative w-full aspect-[344/389] min-h-[360px] sm:min-h-[420px]">
        <Image
          src="/pitch-graphic.svg"
          alt=""
          fill
          className="object-cover object-[center_12%] pointer-events-none select-none"
          priority
          unoptimized
        />

        <div className="absolute inset-0 z-10 flex flex-col justify-between py-4 sm:py-5 px-2">
          <div className="relative z-[3] flex justify-center">
            {top && <PlayerCard player={top} value={cardValue(top)} />}
          </div>

          <div className="relative z-[2] flex justify-center gap-12 sm:gap-16">
            {mid.map((p) => (
              <PlayerCard key={p.id} player={p} value={cardValue(p)} />
            ))}
          </div>

          <div className="relative z-[1] flex justify-center gap-12 sm:gap-16 pb-1">
            {bottom.map((p) => (
              <PlayerCard key={p.id} player={p} value={cardValue(p)} />
            ))}
          </div>
        </div>
      </div>

      <div className="bg-black/35 border-t border-white/10 pt-3 pb-2">
        {subs.length === 0 ? (
          <p className="text-white/50 text-xs text-center py-6">Not enough players for substitutes</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto px-3 pb-1 scrollbar-hide">
            {subs.map((p, i) => (
              <div key={p.id} className="flex flex-col items-center gap-1 shrink-0">
                <span className="text-white/55 text-[10px] font-semibold">
                  {i + 1}. SUB
                </span>
                <PlayerCard player={p} compact value={cardValue(p)} />
              </div>
            ))}
          </div>
        )}
        <p className="text-center text-white font-bold text-xs pt-1">Substitutes</p>
      </div>
    </div>
  )
}
