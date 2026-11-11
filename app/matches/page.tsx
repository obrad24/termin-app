'use client'

import { useEffect, useState } from 'react'
import { Result, Team } from '@/lib/supabase'
import { format } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/header'
import { useSeason } from '@/components/season-provider'
import { getPlayerImageUrl } from '@/lib/image-utils'
import { ArrowLeft } from 'lucide-react'

function shortName(name: string, team?: Team | null) {
  if (team?.short_name) return team.short_name.toUpperCase()
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase()
  return parts.map((p) => p[0]).join('').slice(0, 3).toUpperCase()
}

export default function MatchesPage() {
  const [results, setResults] = useState<Result[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const { currentSeason } = useSeason()

  useEffect(() => {
    fetchTeams()
  }, [])

  useEffect(() => {
    fetchResults()
  }, [currentSeason])

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams')
      if (response.ok) {
        const data = await response.json()
        setTeams(data || [])
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }

  const getTeam = (teamName: string) => teams.find((t) => t.name === teamName) || null
  const getTeamLogo = (teamName: string) => getTeam(teamName)?.logo_url || '/placeholder-logo.svg'

  const fetchResults = async () => {
    try {
      const seasonQuery = currentSeason ? `?season_id=${currentSeason.id}` : ''
      const response = await fetch(`/api/results${seasonQuery}`)
      if (response.ok) {
        const data = await response.json()
        setResults(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching results:', error)
    } finally {
      setLoading(false)
    }
  }

  const sortedResults = [...results].sort((a, b) => {
    const dateA = new Date(a.date || a.created_at || 0).getTime()
    const dateB = new Date(b.date || b.created_at || 0).getTime()
    if (dateB !== dateA) return dateB - dateA
    return (b.id || 0) - (a.id || 0)
  })

  return (
    <main className="min-h-screen bg-[var(--fpl-p120)] pb-24 md:pb-8">
      <Header />

      <section className="relative px-3 sm:px-6 py-4 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <Link
            href="/"
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/15 transition"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="flex-1 text-center font-display text-lg sm:text-xl font-bold text-white pr-9">
            {currentSeason?.name ? `${currentSeason.name} Fixtures` : 'Fixtures & Results'}
          </h1>
        </div>

        {loading ? (
          <div className="text-white/60 text-center py-16 text-sm">Loading fixtures...</div>
        ) : sortedResults.length === 0 ? (
          <div className="text-white/60 text-center py-16 text-sm">No fixtures to display</div>
        ) : (
          <div className="space-y-2.5">
            {sortedResults.map((result) => {
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
                  {/* Crests + score */}
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

                  {/* Comment + image */}
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
      </section>
    </main>
  )
}
