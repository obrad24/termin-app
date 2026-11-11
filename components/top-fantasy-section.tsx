'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getPlayerImageUrl } from '@/lib/image-utils'
import { useSeason } from '@/components/season-provider'

type FantasyRow = {
  id: number
  first_name: string
  last_name: string
  team: string | null
  image_url?: string | null
  total_points: number
}

export default function TopFantasySection() {
  const { currentSeason } = useSeason()
  const [top, setTop] = useState<FantasyRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTop()
  }, [currentSeason?.id])

  const fetchTop = async () => {
    try {
      setLoading(true)
      const seasonQuery = currentSeason?.id ? `&season_id=${currentSeason.id}` : ''
      const response = await fetch(`/api/fantasy/leaderboard?sort=total${seasonQuery}`)
      if (!response.ok) {
        setTop([])
        return
      }
      const data = await response.json()
      const rows: FantasyRow[] = (data.leaderboard || [])
        .filter((p: FantasyRow) => (p.total_points || 0) > 0)
        .slice(0, 3)
      setTop(rows)
    } catch (error) {
      console.error('Error fetching top fantasy:', error)
      setTop([])
    } finally {
      setLoading(false)
    }
  }

  if (!loading && top.length === 0) return null

  const first = top[0]
  const second = top[1]
  const third = top[2]

  return (
    <section className="relative bg-[var(--fpl-p120)] px-3 sm:px-6 py-6 sm:py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
            Fantasy top 3
          </h2>
          <Link
            href="/fantasy"
            className="text-[var(--fpl-green)] text-xs sm:text-sm font-semibold hover:underline shrink-0"
          >
            View all
          </Link>
        </div>

        {loading ? (
          <div className="text-white/60 text-center py-10 text-sm">Loading...</div>
        ) : (
          <div className="flex items-end justify-center gap-2 sm:gap-3">
            {second && (
              <PodiumCard player={second} place={2} />
            )}
            {first && (
              <PodiumCard player={first} place={1} />
            )}
            {third && (
              <PodiumCard player={third} place={3} />
            )}
          </div>
        )}
      </div>
    </section>
  )
}

function PodiumCard({ player, place }: { player: FantasyRow; place: 1 | 2 | 3 }) {
  const isFirst = place === 1

  return (
    <Link
      href={`/fantasy/players/${player.id}`}
      className={`group relative flex flex-col items-center rounded-2xl bg-[var(--fpl-purple)] border border-white/10 hover:border-white/25 transition overflow-hidden ${
        isFirst ? 'w-[38%] sm:w-[34%] -mb-1' : 'w-[30%] sm:w-[28%]'
      }`}
    >
      <div
        className={`relative w-full bg-gradient-to-b from-[var(--fpl-cyan)] via-[#7a5cff] to-[var(--fpl-lilac)] ${
          isFirst ? 'aspect-[3/4]' : 'aspect-[3/3.6]'
        }`}
      >
        <Image
          src={getPlayerImageUrl(player.image_url, true)}
          alt={`${player.first_name} ${player.last_name}`}
          fill
          className="object-contain object-bottom group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 33vw, 200px"
          unoptimized
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = '/no-image-player.png'
          }}
        />

        <div
          className={`absolute left-1.5 top-1.5 flex items-center justify-center rounded-full font-black ${
            isFirst
              ? 'w-7 h-7 bg-[var(--fpl-green)] text-[var(--fpl-purple)] text-sm'
              : 'w-6 h-6 bg-white/90 text-[var(--fpl-purple)] text-xs'
          }`}
        >
          {place}
        </div>

        <div className="absolute right-1.5 top-1.5 rounded-md bg-white px-1.5 py-0.5 shadow-sm">
          <span className="text-[var(--fpl-purple)] text-xs font-black tabular-nums leading-none">
            {player.total_points}
          </span>
        </div>
      </div>

      <div className={`w-full px-1.5 ${isFirst ? 'py-2.5' : 'py-2'}`}>
        <p className={`text-white font-bold truncate text-center leading-tight ${isFirst ? 'text-sm' : 'text-xs'}`}>
          {player.last_name}
        </p>
        {player.team && (
          <p className="text-white/45 text-[10px] truncate text-center mt-0.5">
            {player.team}
          </p>
        )}
      </div>
    </Link>
  )
}
