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
}

function PlayerCard({
  player,
  compact = false,
}: {
  player: PitchPlayer
  compact?: boolean
}) {
  return (
    <Link
      href={`/fantasy/players/${player.id}`}
      className={`relative flex flex-col items-center ${compact ? 'w-[82px]' : 'w-[96px]'} group`}
    >
      <div className={`relative z-0 ${compact ? 'w-[68px] h-[82px]' : 'w-[84px] h-[100px]'}`}>
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
        <p className={`text-[var(--fpl-purple)] font-bold truncate text-center px-1 ${compact ? 'text-[10px] py-[3px]' : 'text-[11px] py-[4px]'}`}>
          {player.last_name}
        </p>
        <p className={`bg-[#e8e8e8] text-[var(--fpl-purple)] font-bold tabular-nums text-center px-1 ${compact ? 'text-[10px] py-[3px]' : 'text-[11px] py-[4px]'}`}>
          {player.total_points}
        </p>
      </div>
    </Link>
  )
}

export default function FantasyPitch({ players }: { players: PitchPlayer[] }) {
  const ranked = [...players].sort((a, b) => {
    if (b.total_points !== a.total_points) return b.total_points - a.total_points
    return b.last_gw_points - a.last_gw_points
  })

  if (ranked.length === 0) return null

  const starters = ranked.slice(0, 5)
  const subs = ranked.slice(5)

  // 1-2-2 matching the reference crop
  const top = starters[0]
  const mid = starters.slice(1, 3)
  const bottom = starters.slice(3, 5)

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-white/10 bg-[var(--fpl-purple)]">
      <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-white font-bold text-sm">Top of the pitch</h2>
        <span className="text-white/45 text-[11px]">Top 5 + bench</span>
      </div>

      {/* Portrait pitch — same proportions as the reference screenshot */}
      <div className="relative w-full aspect-[344/389] min-h-[360px] sm:min-h-[420px]">
        <Image
          src="/pitch-graphic.svg"
          alt=""
          fill
          className="object-cover object-[center_12%] pointer-events-none select-none"
          priority
          unoptimized
        />

        <div className="absolute inset-0 z-10">
          {/* 1 — centered, slightly below the box */}
          {top && (
            <div className="absolute left-1/2 -translate-x-1/2 top-[8%]">
              <PlayerCard player={top} />
            </div>
          )}

          {/* 2 — wide pair */}
          {mid.length > 0 && (
            <div className="absolute inset-x-0 top-[28%] flex justify-between px-[8%] sm:px-[12%]">
              {mid.map((p) => (
                <PlayerCard key={p.id} player={p} />
              ))}
            </div>
          )}

          {/* 2 — lower pair, more gap from the row above */}
          {bottom.length > 0 && (
            <div className="absolute inset-x-0 top-[58%] flex justify-between px-[10%] sm:px-[14%]">
              {bottom.map((p) => (
                <PlayerCard key={p.id} player={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Substitutes — everyone outside top 5, horizontal scroll */}
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
                <PlayerCard player={p} compact />
              </div>
            ))}
          </div>
        )}
        <p className="text-center text-white font-bold text-xs pt-1">Substitutes</p>
      </div>
    </div>
  )
}
