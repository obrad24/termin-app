'use client'

import { useEffect, useState, useRef } from 'react'
import { Team, Result, Player } from '@/lib/supabase'
import Image from 'next/image'
import { format } from 'date-fns'
import Link from 'next/link'
import MatchAnnouncement from './match-announcement'
import { useSeason } from '@/components/season-provider'
import { getPlayerImageUrl } from '@/lib/image-utils'
import { SHOW_TERMINBET } from '@/lib/features'

interface HeadToHeadStats {
  team1Wins: number
  team2Wins: number
  draws: number
  totalMatches: number
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Prefer players with photos; pick 1 or up to 3 at random each visit. */
function pickHeroPlayers(players: Player[]): Player[] {
  if (players.length === 0) return []

  const withImage = players.filter((p) => p.image_url && p.image_url.trim() !== '')
  const pool = shuffle(withImage.length > 0 ? withImage : players)
  const wantThree = pool.length >= 3 && Math.random() < 0.45
  const count = wantThree ? 3 : 1
  return pool.slice(0, count)
}

function HeroPlayerSide({
  players,
  side,
}: {
  players: Player[]
  side: 'left' | 'right'
}) {
  if (players.length === 0) return null

  const isTriple = players.length >= 3
  const sideClass = side === 'left' ? 'left-0' : 'right-0'

  if (!isTriple) {
    const player = players[0]
    return (
      <div
        className={`absolute bottom-0 ${
          side === 'left' ? 'left-[-2%] sm:left-[4%]' : 'right-[-2%] sm:right-[4%]'
        } w-[58%] sm:w-[46%] md:w-[40%] h-[92%] z-[5] pointer-events-none`}
      >
        <div
          className="relative w-full h-full hero-player-enter"
          style={{ animationDelay: side === 'left' ? '0ms' : '120ms' }}
        >
          <Image
            src={getPlayerImageUrl(player.image_url)}
            alt={`${player.first_name} ${player.last_name}`}
            fill
            className="object-contain object-bottom"
            priority
            unoptimized
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = '/no-image-player.png'
            }}
          />
        </div>
      </div>
    )
  }

  const [a, b, c] = players
  const flankLeft = side === 'left' ? a : c
  const center = b
  const flankRight = side === 'left' ? c : a

  return (
    <div className={`absolute bottom-0 ${sideClass} w-[56%] sm:w-[48%] md:w-[42%] h-[90%] z-[5] pointer-events-none`}>
      <div className="relative w-full h-full">
        <div className="absolute left-[2%] bottom-0 w-[38%] h-[78%] hero-player-enter" style={{ animationDelay: '40ms' }}>
          <Image
            src={getPlayerImageUrl(flankLeft.image_url)}
            alt={`${flankLeft.first_name} ${flankLeft.last_name}`}
            fill
            className="object-contain object-bottom opacity-90"
            priority
            unoptimized
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = '/no-image-player.png'
            }}
          />
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[48%] h-full z-20 hero-player-enter" style={{ animationDelay: '100ms' }}>
          <Image
            src={getPlayerImageUrl(center.image_url)}
            alt={`${center.first_name} ${center.last_name}`}
            fill
            className="object-contain object-bottom"
            priority
            unoptimized
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = '/no-image-player.png'
            }}
          />
        </div>
        <div className="absolute right-[2%] bottom-0 w-[38%] h-[78%] hero-player-enter" style={{ animationDelay: '160ms' }}>
          <Image
            src={getPlayerImageUrl(flankRight.image_url)}
            alt={`${flankRight.first_name} ${flankRight.last_name}`}
            fill
            className="object-contain object-bottom opacity-90"
            priority
            unoptimized
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = '/no-image-player.png'
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default function HeroSection() {
  const { currentSeason } = useSeason()
  const [team1, setTeam1] = useState<Team | null>(null)
  const [team2, setTeam2] = useState<Team | null>(null)
  const [leftPlayers, setLeftPlayers] = useState<Player[]>([])
  const [rightPlayers, setRightPlayers] = useState<Player[]>([])
  const [stats, setStats] = useState<HeadToHeadStats>({
    team1Wins: 0,
    team2Wins: 0,
    draws: 0,
    totalMatches: 0,
  })
  const [loading, setLoading] = useState(true)
  const [isScrolled, setIsScrolled] = useState(false)
  const [nextMatch, setNextMatch] = useState<{
    home_team: string
    away_team: string
    match_date: string
    odds_1: number | null
    odds_x: number | null
    odds_2: number | null
  } | null>(null)
  const heroRef = useRef<HTMLElement>(null)

  useEffect(() => {
    fetchHeadToHead()
    fetchNextMatch()
  }, [currentSeason?.id])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const fetchHeadToHead = async () => {
    try {
      const seasonQuery = currentSeason ? `?season_id=${currentSeason.id}` : ''
      const [teamsResponse, resultsResponse, playersResponse] = await Promise.all([
        fetch(`/api/teams${seasonQuery}`),
        fetch(`/api/results${seasonQuery}`),
        fetch(`/api/players${seasonQuery}`),
      ])
      if (!teamsResponse.ok) return

      const teams: Team[] = await teamsResponse.json()
      if (teams.length < 2) {
        setLoading(false)
        return
      }

      const firstTeam = teams[0]
      const secondTeam = teams[1]

      setTeam1(firstTeam)
      setTeam2(secondTeam)

      if (resultsResponse.ok) {
        const results: Result[] = await resultsResponse.json()

        const headToHeadMatches = results.filter(
          (result) =>
            (result.home_team === firstTeam.name && result.away_team === secondTeam.name) ||
            (result.home_team === secondTeam.name && result.away_team === firstTeam.name)
        )

        let team1Wins = 0
        let team2Wins = 0
        let draws = 0

        headToHeadMatches.forEach((match) => {
          const isTeam1Home = match.home_team === firstTeam.name
          const team1Score = isTeam1Home ? match.home_score : match.away_score
          const team2Score = isTeam1Home ? match.away_score : match.home_score

          if (team1Score > team2Score) {
            team1Wins++
          } else if (team2Score > team1Score) {
            team2Wins++
          } else {
            draws++
          }
        })

        setStats({
          team1Wins,
          team2Wins,
          draws,
          totalMatches: headToHeadMatches.length,
        })
      }

      if (playersResponse.ok) {
        const players: Player[] = await playersResponse.json()
        const team1Players = players.filter((p) => p.team === firstTeam.name)
        const team2Players = players.filter((p) => p.team === secondTeam.name)

        const isSecondSeason = currentSeason?.id === 2
        const leftPool = isSecondSeason ? team1Players : team2Players
        const rightPool = isSecondSeason ? team2Players : team1Players

        setLeftPlayers(pickHeroPlayers(leftPool))
        setRightPlayers(pickHeroPlayers(rightPool))
      }
    } catch (error) {
      console.error('Error fetching head to head:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchNextMatch = async () => {
    try {
      const response = await fetch('/api/next-match')
      if (!response.ok) return

      const data = await response.json()
      if (data) {
        setNextMatch({
          home_team: data.home_team,
          away_team: data.away_team,
          match_date: data.match_date || new Date().toISOString(),
          odds_1: data.odds_1,
          odds_x: data.odds_x,
          odds_2: data.odds_2,
        })
      }
    } catch (error) {
      console.error('Error fetching next match:', error)
    }
  }

  if (loading) {
    return (
      <section className="relative h-[52vh] min-h-[360px] max-h-[480px] flex items-center justify-center">
        <div className="text-white text-center">Loading...</div>
      </section>
    )
  }

  if (!team1 || !team2) {
    return (
      <section className="relative h-[52vh] min-h-[360px] max-h-[480px] flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-lg">Not enough teams for head-to-head</p>
        </div>
      </section>
    )
  }

  const isSecondSeason = currentSeason?.id === 2
  const leftWins = isSecondSeason ? stats.team2Wins : stats.team1Wins
  const rightWins = isSecondSeason ? stats.team1Wins : stats.team2Wins

  return (
    <section ref={heroRef} className="relative overflow-hidden">
      {/* Visual stage — shorter than viewport, mockup framing */}
      <div className="relative h-[48vh] min-h-[340px] max-h-[460px] sm:h-[52vh] sm:max-h-[500px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-balona.jpg"
            alt="Zlatni Termin Semberije"
            fill
            className="object-cover object-[48%_28%]"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[rgba(55,0,60,0.22)]" />
        </div>

        <div className="relative z-10 w-full h-full max-w-5xl mx-auto">
          <HeroPlayerSide players={leftPlayers} side="left" />
          <HeroPlayerSide players={rightPlayers} side="right" />

          <div
            className={`absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-500 ${
              isScrolled ? 'opacity-40 scale-95' : 'opacity-100 scale-100'
            }`}
          >
            <div className="score-glass px-5 sm:px-8 py-2 sm:py-3">
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                <span className="gold-score text-[72px] sm:text-6xl md:text-7xl lg:text-8xl leading-none">
                  {leftWins}
                </span>
                <span className="gold-score text-[40px] sm:text-4xl md:text-5xl leading-none opacity-70">:</span>
                <span
                  className="gold-score text-[72px] sm:text-6xl md:text-7xl lg:text-8xl leading-none"
                  style={{ animationDelay: '80ms' }}
                >
                  {rightWins}
                </span>
              </div>
            </div>
          </div>
        </div>

        <Link
          href="/my-team"
          className="absolute bottom-0 left-0 bg-[var(--fpl-p120)] w-full h-8 flex items-center overflow-hidden hover:bg-[var(--fpl-p110)] transition-colors cursor-pointer z-40"
        >
          <div className="terminbet-scroll flex items-center font-bold text-2xl whitespace-nowrap">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center justify-center px-3 gap-1">
                <span className="text-white">MY</span>
                <span className="text-[var(--fpl-green)]">FANTASY</span>
                <span className="text-white">TEAM</span>
              </div>
            ))}
          </div>
        </Link>
      </div>

      {SHOW_TERMINBET && (
        <div className="relative z-20">
          <MatchAnnouncement />
          <div className="w-full bg-[var(--fpl-p120)] border-t border-white/10 flex rounded-none text-white">
            {nextMatch && nextMatch.home_team && nextMatch.away_team ? (
              <div className="w-full max-w-7xl mx-auto flex py-2 border-y border-white/10 h-auto">
                <div className="flex-1 flex flex-col px-2">
                  <div className="text-[var(--fpl-cyan)] text-xs sm:text-sm font-medium flex gap-1 h-5 items-center">
                    {nextMatch.match_date && (
                      <>
                        <span>{format(new Date(nextMatch.match_date), 'd.M')}.</span>
                        <span>{format(new Date(nextMatch.match_date), 'EEE')}</span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 h-11 justify-center">
                    <div className="text-[var(--champagne)] text-sm sm:text-base font-medium truncate">
                      {nextMatch.home_team}
                    </div>
                    <div className="text-[var(--champagne)] text-sm sm:text-base font-medium truncate">
                      {nextMatch.away_team}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col px-2 items-end">
                  <div className="flex items-center gap-3 sm:gap-4 w-full justify-around h-5">
                    <span className="text-[var(--gold-400)]/70 text-sm sm:text-base font-medium">1</span>
                    <span className="text-[var(--gold-400)]/70 text-sm sm:text-base font-medium">X</span>
                    <span className="text-[var(--gold-400)]/70 text-sm sm:text-base font-medium">2</span>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 h-11">
                    <span className="text-[var(--champagne)] text-sm sm:text-base font-medium">
                      {nextMatch.odds_1 ? nextMatch.odds_1.toFixed(2) : '-'}
                    </span>
                    <span className="text-[var(--champagne)] text-sm sm:text-base font-medium">
                      {nextMatch.odds_x ? nextMatch.odds_x.toFixed(2) : '-'}
                    </span>
                    <span className="text-[var(--champagne)] text-sm sm:text-base font-medium">
                      {nextMatch.odds_2 ? nextMatch.odds_2.toFixed(2) : '-'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-7xl mx-auto h-12 flex items-center justify-center">
                <p className="text-white/55 text-sm">Odds coming soon</p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
