'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { getPlayerImageUrl } from '@/lib/image-utils'
import { format } from 'date-fns'

interface MatchPlayer {
  id: number
  player_id: number
  team_type: 'home' | 'away'
  players: {
    id: number
    first_name: string
    last_name: string
    image_url: string | null
    team: string | null
  }
}

interface NextMatch {
  home_team: string
  away_team: string
  match_date: string
}

interface Team {
  id: number
  name: string
  logo_url: string | null
}

export default function MatchAnnouncement() {
  const [matchPlayers, setMatchPlayers] = useState<MatchPlayer[]>([])
  const [nextMatch, setNextMatch] = useState<NextMatch | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [playersRes, matchRes, teamsRes] = await Promise.all([
        fetch('/api/next-match/players'),
        fetch('/api/next-match'),
        fetch('/api/teams'),
      ])

      if (playersRes.ok) {
        const playersData = await playersRes.json()
        setMatchPlayers(playersData || [])
      }

      if (matchRes.ok) {
        const matchData = await matchRes.json()
        if (matchData) {
          setNextMatch({
            home_team: matchData.home_team,
            away_team: matchData.away_team,
            match_date: matchData.match_date || '',
          })
        }
      }

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json()
        setTeams(teamsData || [])
      }
    } catch (error) {
      console.error('Error fetching match announcement data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return null
  }

  if (!nextMatch || !nextMatch.home_team || !nextMatch.away_team) {
    return null
  }

  const homePlayers = matchPlayers
    .filter((mp) => mp.team_type === 'home')
    .slice(0, 3)
    .map((mp) => mp.players)

  const awayPlayers = matchPlayers
    .filter((mp) => mp.team_type === 'away')
    .slice(0, 3)
    .map((mp) => mp.players)

  if (homePlayers.length === 0 && awayPlayers.length === 0) {
    return null
  }

  // Pronađi timove
  const homeTeam = teams.find((t) => t.name === nextMatch.home_team)
  const awayTeam = teams.find((t) => t.name === nextMatch.away_team)

  // Formatiraj vreme
  const getTimeLabel = () => {
    if (!nextMatch.match_date) return null

    try {
      const matchDate = new Date(nextMatch.match_date)
      return format(matchDate, 'HH:mm')
    } catch {
      return null
    }
  }

  const timeLabel = getTimeLabel()

  return (
    <section className="absolute bottom-[16%] left-0 w-full">
      <div className="max-w-4xl mx-auto relative pb-6">
        <div className='absolute bottom-[20%] left-0 w-full h-10 bg-gradient-to-t from-[rgba(10,13,26,0.95)] via-[rgba(15,21,37,0.6)] to-transparent z-20'></div>
        {/* Top Section - Date, Time, and Players */}
        <div className="relative flex items-center justify-between mb-1 px-2 sm:px-8">
          <p className='absolute top-[50px] left-1/2 -translate-x-1/2 text-[10px] font-extrabold text-white shadow-2xl hero-bg/50 backdrop-blur-xl z-20'>SLEDEĆI TERMIN</p>
          

          {/* Right Team Players - One in center, two on sides */}
          <div className="relative min-w-[145px] max-w-[145px] h-28 sm:h-32 md:h-36 z-10">
            {awayPlayers.length > 0 ? (
              <>
                {/* Left player */}
                {awayPlayers[0] && (
                  <div className="absolute left-0 bottom-0 w-18 h-[90px] sm:w-20 sm:h-26 md:w-24 md:h-30 overflow-hidden z-10">
                    <Image
                      src={getPlayerImageUrl(awayPlayers[0].image_url)}
                      alt={`${awayPlayers[0].first_name} ${awayPlayers[0].last_name}`}
                      fill
                      className="object-contain"
                      unoptimized
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/no-image-player.png'
                      }}
                    />
                  </div>
                )}
                {/* Center player (taller) */}
                {awayPlayers[1] && (
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-20 h-26 sm:w-24 sm:h-32 md:w-28 md:h-36 overflow-hidden z-20">
                    <Image
                      src={getPlayerImageUrl(awayPlayers[1].image_url)}
                      alt={`${awayPlayers[1].first_name} ${awayPlayers[1].last_name}`}
                      fill
                      className="object-contain"
                      unoptimized
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/no-image-player.png'
                      }}
                    />
                  </div>
                )}
                {/* Right player */}
                {awayPlayers[2] && (
                  <div className="absolute right-0 bottom-0 w-18 h-[90px] sm:w-20 sm:h-26 md:w-24 md:h-30 overflow-hidden z-10">
                    <Image
                      src={getPlayerImageUrl(awayPlayers[2].image_url)}
                      alt={`${awayPlayers[2].first_name} ${awayPlayers[2].last_name}`}
                      fill
                      className="object-contain"
                      unoptimized
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/no-image-player.png'
                      }}
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="absolute left-0 bottom-0 w-16 h-20 sm:w-20 sm:h-26 md:w-24 md:h-30 overflow-hidden bg-gray-300 z-10" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-20 h-26 sm:w-24 sm:h-32 md:w-28 md:h-36 overflow-hidden bg-gray-300 z-20" />
                <div className="absolute right-0 bottom-0 w-16 h-20 sm:w-20 sm:h-26 md:w-24 md:h-30 overflow-hidden bg-gray-300 z-10" />
              </>
            )}
          </div>
          {/* Left Team Players - One in center, two on sides */}
          <div className="relative min-w-[145px] max-w-[145px] h-28 sm:h-32 md:h-36 z-10">
            {homePlayers.length > 0 ? (
              <>
                {/* Left player */}
                {homePlayers[0] && (
                  <div className="absolute left-0 bottom-0 w-18 h-[90px] sm:w-20 sm:h-26 md:w-24 md:h-30 overflow-hidden z-10">
                    <Image
                      src={getPlayerImageUrl(homePlayers[0].image_url)}
                      alt={`${homePlayers[0].first_name} ${homePlayers[0].last_name}`}
                      fill
                      className="object-contain"
                      unoptimized
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/no-image-player.png'
                      }}
                    />
                  </div>
                )}
                {/* Center player (taller) */}
                {homePlayers[1] && (
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-20 h-26 sm:w-24 sm:h-32 md:w-28 md:h-36 overflow-hidden z-20">
                    <Image
                      src={getPlayerImageUrl(homePlayers[1].image_url)}
                      alt={`${homePlayers[1].first_name} ${homePlayers[1].last_name}`}
                      fill
                      className="object-contain"
                      unoptimized
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/no-image-player.png'
                      }}
                    />
                  </div>
                )}
                {/* Right player */}
                {homePlayers[2] && (
                  <div className="absolute right-0 bottom-0 w-18 h-[90px] sm:w-20 sm:h-26 md:w-24 md:h-30 overflow-hidden z-10">
                    <Image
                      src={getPlayerImageUrl(homePlayers[2].image_url)}
                      alt={`${homePlayers[2].first_name} ${homePlayers[2].last_name}`}
                      fill
                      className="object-contain"
                      unoptimized
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/no-image-player.png'
                      }}
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="absolute left-0 bottom-0 w-16 h-20 sm:w-20 sm:h-26 md:w-24 md:h-30 overflow-hidden bg-gray-300 z-10" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-20 h-26 sm:w-24 sm:h-32 md:w-28 md:h-36 overflow-hidden bg-gray-300 z-20" />
                <div className="absolute right-0 bottom-0 w-16 h-20 sm:w-20 sm:h-26 md:w-24 md:h-30 overflow-hidden bg-gray-300 z-10" />
              </>
            )}
          </div>
        </div>

        {/* Bottom Section - Teams Card */}
        <div className="bg-transparent absolute bottom-3 left-0 w-full z-20">
          <div className="flex items-center justify-center sm:gap-6 md:gap-8">
            {/* Home Team */}
            <div className="flex items-center gap-3 sm:gap-4 flex-1 justify-end">
              <div className="relative w-10 h-10 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-gray-200 shrink-0">
                <Image
                  src={homeTeam?.logo_url || '/placeholder-logo.svg'}
                  alt={nextMatch.home_team}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/placeholder-logo.svg'
                  }}
                />
              </div>
            </div>

            {/* VS Separator */}
            <div className="text-gray-400 font-semibold text-xs sm:text-xl md:text-2xl px-1 sm:px-4">
              VS
            </div>

            {/* Away Team */}
            <div className="flex items-center gap-3 sm:gap-4 flex-1 justify-start">
              <div className="relative w-10 h-10 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-gray-200 shrink-0">
                <Image
                  src={awayTeam?.logo_url || '/placeholder-logo.svg'}
                  alt={nextMatch.away_team}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/placeholder-logo.svg'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
