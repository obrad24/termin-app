'use client'

import { useEffect, useState } from 'react'
import { Result, Team } from '@/lib/supabase'
import { format } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useSeason } from '@/components/season-provider'
import { getPlayerImageUrl } from '@/lib/image-utils'

function shortName(name: string, team?: Team | null) {
  if (team?.short_name) return team.short_name.toUpperCase()
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase()
  return parts.map((p) => p[0]).join('').slice(0, 3).toUpperCase()
}

export default function ResultsSection() {
  const [results, setResults] = useState<Result[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const { currentSeason } = useSeason()

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        const seasonQuery = currentSeason ? `?season_id=${currentSeason.id}` : ''
        const [teamsRes, resultsRes] = await Promise.all([
          fetch('/api/teams'),
          fetch(`/api/results${seasonQuery}`),
        ])
        if (cancelled) return
        if (teamsRes.ok) setTeams((await teamsRes.json()) || [])
        if (resultsRes.ok) {
          const data = await resultsRes.json()
          setResults(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error('Error fetching results section:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [currentSeason?.id])

  const getTeam = (teamName: string) => teams.find((t) => t.name === teamName) || null
  const getTeamLogo = (teamName: string) => getTeam(teamName)?.logo_url || '/placeholder-logo.svg'

  const sortedResults = [...results].sort((a, b) => {
    const dateA = new Date(a.date || a.created_at || 0).getTime()
    const dateB = new Date(b.date || b.created_at || 0).getTime()
    if (dateB !== dateA) return dateB - dateA
    return (b.id || 0) - (a.id || 0)
  })

  const latestResults = sortedResults.slice(0, 4)

  return (
    <section className="relative bg-[var(--fpl-p120)] px-3 sm:px-6 py-6 sm:py-8">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
            Results
          </h2>
          <Link
            href="/matches"
            className="text-[var(--fpl-green)] text-xs sm:text-sm font-semibold hover:underline shrink-0"
          >
            View all
          </Link>
        </div>

        {loading ? (
          <div className="text-white/60 text-center py-10 text-sm">Loading results...</div>
        ) : latestResults.length === 0 ? (
          <div className="text-white/60 text-center py-10 text-sm">No results to show</div>
        ) : (
          <div className="space-y-2.5">
            {latestResults.map((result) => {
              const homeTeam = getTeam(result.home_team)
              const awayTeam = getTeam(result.away_team)
              const comment =
                result.summary_comment?.trim() ||
                `${result.home_team} ${result.home_score}-${result.away_score} ${result.away_team}`
              const imageUrl = result.image_url
                ? getPlayerImageUrl(result.image_url)
                : null

              return (
                <Link
                  key={result.id}
                  href={`/matches/${result.id}`}
                  className="block rounded-2xl bg-[var(--fpl-purple)] border border-white/10 px-3 py-2.5 hover:border-white/20 transition"
                >
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-1.5">
                    <span className="text-white font-bold text-xs sm:text-sm tracking-wide min-w-[2rem] text-right">
                      {shortName(result.home_team, homeTeam)}
                    </span>
                    <div className="relative w-7 h-7 sm:w-8 sm:h-8">
                      <Image
                        src={getTeamLogo(result.home_team)}
                        alt={result.home_team}
                        fill
                        className="object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/placeholder-logo.svg'
                        }}
                      />
                    </div>

                    <span className="font-display text-2xl sm:text-3xl font-bold text-white px-1 tabular-nums leading-none">
                      {result.home_score}-{result.away_score}
                    </span>

                    <div className="relative w-7 h-7 sm:w-8 sm:h-8">
                      <Image
                        src={getTeamLogo(result.away_team)}
                        alt={result.away_team}
                        fill
                        className="object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/placeholder-logo.svg'
                        }}
                      />
                    </div>
                    <span className="text-white font-bold text-xs sm:text-sm tracking-wide min-w-[2rem] text-left">
                      {shortName(result.away_team, awayTeam)}
                    </span>
                  </div>

                  <div className="flex gap-2.5 items-center">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm sm:text-[15px] leading-snug line-clamp-2">
                        {comment}
                      </p>
                      <p className="text-white/45 text-[11px] mt-1">
                        Match Report · {format(new Date(result.date), 'd MMM yyyy')}
                      </p>
                    </div>

                    {imageUrl ? (
                      <div className="relative w-[112px] h-[80px] sm:w-[128px] sm:h-[90px] rounded-xl overflow-hidden shrink-0 bg-white/5">
                        <Image
                          src={imageUrl}
                          alt="Match"
                          fill
                          className="object-cover"
                          unoptimized
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-[112px] h-[80px] sm:w-[128px] sm:h-[90px] rounded-xl shrink-0 bg-white/5 border border-white/10 flex items-center justify-center">
                        <span className="text-white/25 text-[10px] font-semibold tracking-wide">
                          NO IMAGE
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {results.length > 4 && (
          <div className="flex justify-center pt-1">
            <Link href="/matches">
              <Button
                variant="outline"
                size="lg"
                className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                Show more
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
