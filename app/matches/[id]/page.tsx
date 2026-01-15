'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Result, Player, MatchGoal, MatchPlayer, Team, MatchComment } from '@/lib/supabase'
import { format } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/header'
import { ArrowLeft, Star, MessageSquare, Send } from 'lucide-react'
import { getPlayerImageUrl } from '@/lib/image-utils'
import PlayerRatingDialog from '@/components/player-rating-dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

interface GoalWithPlayer extends MatchGoal {
  players: Player
}

interface MatchPlayerWithPlayer extends MatchPlayer {
  players: Player
}

interface ResultWithDetails extends Result {
  goals: GoalWithPlayer[]
  players: MatchPlayerWithPlayer[]
}

export default function MatchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [match, setMatch] = useState<ResultWithDetails | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [averageRatings, setAverageRatings] = useState<Record<number, { average: number; count: number }>>({})
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [comments, setComments] = useState<MatchComment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [commentNickname, setCommentNickname] = useState('')
  const [commentText, setCommentText] = useState('')

  useEffect(() => {
    if (params.id) {
      fetchMatch()
      fetchTeams()
      fetchComments()
    }
  }, [params.id])

  useEffect(() => {
    if (match?.id) {
      fetchAverageRatings()
    }
  }, [match?.id])

  const handlePlayerClick = (e: React.MouseEvent, player: Player | null) => {
    e.preventDefault()
    if (player) {
      setSelectedPlayer(player)
      setRatingDialogOpen(true)
    }
  }

  const handleRatingSubmitted = () => {
    if (match?.id) {
      fetchAverageRatings()
    }
  }

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

  const fetchAverageRatings = async () => {
    if (!match?.id) return
    try {
      const response = await fetch(`/api/match-ratings?match_id=${match.id}`)
      if (response.ok) {
        const data = await response.json()
        // API vraća Record<number, { average: number; count: number }>
        setAverageRatings(data || {})
      }
    } catch (error) {
      console.error('Error fetching average ratings:', error)
    }
  }

  const getTeamLogo = (teamName: string) => {
    const team = teams.find(t => t.name === teamName)
    return team?.logo_url || '/placeholder-logo.svg'
  }

  // Grupiše golove po igraču i vraća niz sa imenom i brojem golova
  const groupGoalsByPlayer = (goals: GoalWithPlayer[]) => {
    const grouped = new Map<string, { name: string; count: number; playerId: number | null; player: Player | null }>()

    goals.forEach((goal) => {
      const playerKey = goal.player_id?.toString() || 'unknown'
      const playerName = goal.players
        ? `${goal.players.first_name} ${goal.players.last_name}`
        : `Igrač #${goal.player_id}`

      if (grouped.has(playerKey)) {
        grouped.get(playerKey)!.count++
      } else {
        grouped.set(playerKey, {
          name: playerName,
          count: 1,
          playerId: goal.player_id || null,
          player: goal.players
        })
      }
    })

    return Array.from(grouped.values())
  }

  const fetchMatch = async () => {
    try {
      const response = await fetch(`/api/results/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setMatch(data)
      } else if (response.status === 404) {
        router.push('/matches')
      }
    } catch (error) {
      console.error('Error fetching match:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    if (!params.id) return
    setLoadingComments(true)
    try {
      const response = await fetch(`/api/matches/${params.id}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data || [])
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoadingComments(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!match?.id || !commentNickname.trim() || !commentText.trim() || submittingComment) return

    setSubmittingComment(true)
    try {
      const response = await fetch(`/api/matches/${match.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname: commentNickname.trim(),
          comment: commentText.trim(),
        }),
      })

      if (response.ok) {
        const newComment = await response.json()
        setComments([newComment, ...comments])
        setCommentNickname('')
        setCommentText('')
      } else {
        const error = await response.json()
        alert(error.error || 'Greška pri dodavanju komentara')
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
      alert('Greška pri dodavanju komentara')
    } finally {
      setSubmittingComment(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen hero-bg pb-20 md:pb-0">
        <Header />
        <section className="relative px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-7xl mx-auto pt-24 sm:pt-28">
          <div className="text-white text-center py-12">Učitavanje...</div>
        </section>
      </main>
    )
  }

  if (!match) {
    return (
      <main className="min-h-screen hero-bg pb-20 md:pb-0">
        <Header />
        <section className="relative px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-7xl mx-auto pt-24 sm:pt-28">
          <div className="text-white text-center py-12">
            <p className="text-lg sm:text-xl mb-4">Utakmica nije pronađena</p>
            <Link href="/matches" className="text-white/80 hover:text-white underline z-50 relative">
              Nazad na utakmice
            </Link>
          </div>
        </section>
      </main>
    )
  }

  const homeGoals = match.goals?.filter(g => g.team_type === 'home') || []
  const awayGoals = match.goals?.filter(g => g.team_type === 'away') || []
  const homePlayers = match.players?.filter(p => p.team_type === 'home') || []
  const awayPlayers = match.players?.filter(p => p.team_type === 'away') || []

  return (
    <main className="min-h-screen hero-bg">
      <Header />
      <section className="relative px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-7xl mx-auto pb-20">
        <div className="space-y-6 sm:space-y-8">
          {/* Back button */}
          <Link
            href="/matches"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition text-sm sm:text-base z-50 relative"
          >
            <ArrowLeft className="w-4 h-4" />
            Nazad na utakmice
          </Link>

          {/* Match header */}
          <div className="bg-slate-800/50 border border-white/30 rounded-2xl sm:rounded-3xl p-2 sm:p-6 md:p-8 lg:p-12 backdrop-blur-md shadow-2xl">
            {/* Mobile Layout */}
            <div className="md:hidden space-y-4">
              {/* Teams - Mobile */}
              <div className="flex justify-between gap-3">
                {/* Home team */}
                <div className="flex items-center justify-between gap-3 p-3 bg-slate-700/30 rounded-xl w-1/2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-700/50 flex items-center justify-center shadow-md flex-shrink-0">
                      <Image
                        src={getTeamLogo(match.home_team)}
                        alt={match.home_team}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/placeholder-logo.svg'
                        }}
                      />
                    </div>
                    <h1 className="text-lg font-bold text-white truncate">
                      {match.home_team}
                    </h1>
                  </div>
                </div>

                {/* Away team */}
                <div className="flex items-center justify-between gap-3 p-3 bg-slate-700/30 rounded-xl w-1/2">
                  <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
                    <h1 className="text-lg font-bold text-white truncate">
                      {match.away_team}
                    </h1>
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-700/50 flex items-center justify-center shadow-md flex-shrink-0">
                      <Image
                        src={getTeamLogo(match.away_team)}
                        alt={match.away_team}
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

            <div className="text-center space-y-2 lg:hidden">
              <div className="flex items-center justify-center gap-3">
                <span className="text-6xl font-bold text-white drop-shadow-lg">
                  {match.home_score}
                </span>
                <span className="text-3xl text-white/60 font-light">-</span>
                <span className="text-6xl font-bold text-white drop-shadow-lg">
                  {match.away_score}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-white/60">
                <span>{format(new Date(match.date), 'dd MMM yyyy')}</span>
                <span>•</span>
                <span>{format(new Date(match.date), 'HH:mm')}</span>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:grid md:grid-cols-3 gap-6 lg:gap-8 items-center">
              {/* Home team */}
              <div className="text-center md:text-right space-y-3 lg:space-y-4">
                <div className="flex flex-col md:flex-row items-center md:justify-end gap-3 lg:gap-4">
                  <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl lg:rounded-2xl overflow-hidden bg-slate-700/50 flex items-center justify-center shadow-lg">
                    <Image
                      src={getTeamLogo(match.home_team)}
                      alt={match.home_team}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/placeholder-logo.svg'
                      }}
                    />
                  </div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white break-words">
                    {match.home_team}
                  </h1>
                </div>
              </div>

              {/* Score */}
              <div className="text-center space-y-3 lg:space-y-4">
                <div className="flex items-center justify-center gap-4 lg:gap-6">
                  <span className="text-6xl md:text-7xl lg:text-8xl font-bold text-white drop-shadow-lg">
                    {match.home_score}
                  </span>
                  <span className="text-3xl md:text-4xl text-white/60 font-light">-</span>
                  <span className="text-6xl md:text-7xl lg:text-8xl font-bold text-white drop-shadow-lg">
                    {match.away_score}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 lg:gap-4 text-sm text-white/60">
                  <span>FULL TIME</span>
                  <span>•</span>
                  <span>{format(new Date(match.date), 'dd MMM yyyy')}</span>
                  <span>•</span>
                  <span>{format(new Date(match.date), 'HH:mm')}</span>
                </div>
              </div>

              {/* Away team */}
              <div className="text-center md:text-left space-y-3 lg:space-y-4">
                <div className="flex flex-col md:flex-row items-center md:justify-start gap-3 lg:gap-4">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white break-words">
                    {match.away_team}
                  </h1>
                  <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl lg:rounded-2xl overflow-hidden bg-slate-700/50 flex items-center justify-center shadow-lg">
                    <Image
                      src={getTeamLogo(match.away_team)}
                      alt={match.away_team}
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

          {/* Goals */}
          {(homeGoals.length > 0 || awayGoals.length > 0) && (
            <div className="bg-slate-800/50 border border-white/30 rounded-2xl sm:rounded-3xl p-2 sm:p-8 backdrop-blur-md shadow-2xl">
              <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-4">Strijelci</h2>
              <div className="flex gap-4 sm:gap-6">
                {/* Home goals */}
                <div className="flex-1">
                  {homeGoals.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {groupGoalsByPlayer(homeGoals).map((player, index) => (
                        <div key={index} className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-700/30 hover:bg-slate-700/50 transition-all hover:scale-105 cursor-pointer group">
                          {player.player && player.playerId ? (
                            <Link
                              href={`/players/${player.playerId}`}
                              className="block w-full h-full player-card-bg"
                            >
                              {/* Player Image */}
                              <div className="relative w-full h-full bg-slate-800/50">
                                <Image
                                  src={getPlayerImageUrl(player.player.image_url)}
                                  alt={player.name}
                                  fill
                                  className="object-contain object-bottom"
                                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 50vw, 33vw"
                                  unoptimized
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.src = '/no-image-player.png'
                                  }}
                                />
                              </div>

                              {/* Goals Badge - Top Right */}
                              <div className="absolute top-2 right-2 bg-yellow-500/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center justify-center gap-1 shadow-lg">
                                <span className='text-sm'>⚽</span>
                                <span className="text-white font-bold text-sm">{player.count}</span>
                              </div>

                              {/* Player Name - Bottom Left */}
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-3">
                                <div className="text-white">
                                  <div className="font-semibold text-sm">{player.player.first_name}</div>
                                  <div className="font-bold text-base">{player.player.last_name}</div>
                                </div>
                              </div>
                            </Link>
                          ) : (
                            <div className="w-full h-full">
                              {/* Player Image */}
                              <div className="relative w-full h-full bg-slate-800/50">
                                <Image
                                  src="/no-image-player.png"
                                  alt={player.name}
                                  fill
                                  className="object-contain object-bottom"
                                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 50vw, 33vw"
                                  unoptimized
                                />
                              </div>

                              {/* Goals Badge - Top Right */}
                              <div className="absolute top-2 right-2 bg-yellow-500/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center justify-center gap-1 shadow-lg">
                                <span>⚽</span>
                                <span className="text-white font-bold text-sm">{player.count}</span>
                              </div>

                              {/* Player Name - Bottom Left */}
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-3">
                                <div className="text-white">
                                  <div className="font-semibold text-sm">{player.name}</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/60 text-sm">Nema strijelaca</p>
                  )}
                </div>

                {/* Away goals */}
                <div className="flex-1">
                  {awayGoals.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {groupGoalsByPlayer(awayGoals).map((player, index) => (
                        <div key={index} className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-700/30 hover:bg-slate-700/50 transition-all hover:scale-105 cursor-pointer group">
                          {player.player && player.playerId ? (
                            <Link
                              href={`/players/${player.playerId}`}
                              className="block w-full h-full player-card-bg"
                            >
                              {/* Player Image */}
                              <div className="relative w-full h-full bg-slate-800/50">
                                <Image
                                  src={getPlayerImageUrl(player.player.image_url)}
                                  alt={player.name}
                                  fill
                                  className="object-contain object-bottom"
                                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 50vw, 33vw"
                                  unoptimized
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.src = '/no-image-player.png'
                                  }}
                                />
                              </div>

                              {/* Goals Badge - Top Right */}
                              <div className="absolute top-2 right-2 bg-yellow-500/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center justify-center gap-1 shadow-lg">
                                <span>⚽</span>
                                <span className="text-white font-bold text-sm">{player.count}</span>
                              </div>

                              {/* Player Name - Bottom Left */}
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-3">
                                <div className="text-white">
                                  <div className="font-semibold text-sm">{player.player.first_name}</div>
                                  <div className="font-bold text-base">{player.player.last_name}</div>
                                </div>
                              </div>
                            </Link>
                          ) : (
                            <div className="w-full h-full">
                              {/* Player Image */}
                              <div className="relative w-full h-full bg-slate-800/50">
                                <Image
                                  src="/no-image-player.png"
                                  alt={player.name}
                                  fill
                                  className="object-contain object-bottom"
                                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 50vw, 33vw"
                                  unoptimized
                                />
                              </div>

                              {/* Goals Badge - Top Right */}
                              <div className="absolute top-2 right-2 bg-yellow-500/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center justify-center gap-1 shadow-lg">
                                <span>⚽</span>
                                <span className="text-white font-bold text-sm">{player.count}</span>
                              </div>

                              {/* Player Name - Bottom Left */}
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-3">
                                <div className="text-white">
                                  <div className="font-semibold text-sm">{player.name}</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/60 text-sm">Nema strijelaca</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MVP Section */}
          {(() => {
            // Pronađi igrača sa najboljom prosječnom ocjenom
            let mvpPlayer: MatchPlayerWithPlayer | null = null
            let mvpRating: { average: number; count: number } | null = null

            if (match?.players && Object.keys(averageRatings).length > 0) {
              let highestRating = 0
              let bestPlayerId: number | null = null

              Object.entries(averageRatings).forEach(([playerId, rating]) => {
                if (rating.average > highestRating) {
                  highestRating = rating.average
                  bestPlayerId = parseInt(playerId, 10)
                }
              })

              if (bestPlayerId) {
                mvpPlayer = match.players.find(mp => mp.players?.id === bestPlayerId) || null
                mvpRating = averageRatings[bestPlayerId]
              }
            }

            if (!mvpPlayer || !mvpRating) return null

            return (
              <div className="bg-gradient-to-br from-yellow-500/20 via-yellow-600/20 to-yellow-700/20 border-2 border-yellow-400/50 rounded-2xl sm:rounded-3xl p-4 sm:p-8 backdrop-blur-md shadow-2xl">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-white">MVP</h2>
                  </div>
                  
                  <div 
                    className="flex flex-col items-center gap-4 cursor-pointer hover:scale-105 transition-transform"
                    onClick={(e) => handlePlayerClick(e, mvpPlayer!.players || null)}
                  >
                    <div className="relative w-32 h-40 sm:w-40 sm:h-52">
                      <Image
                        src={getPlayerImageUrl(mvpPlayer.players?.image_url)}
                        alt={`${mvpPlayer.players?.first_name} ${mvpPlayer.players?.last_name}`}
                        fill
                        className="object-contain object-bottom"
                        sizes="(max-width: 640px) 128px, 160px"
                        unoptimized
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/no-image-player.png'
                        }}
                      />
                    </div>
                    
                    <div className="text-center">
                      <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">
                        {mvpPlayer.players?.first_name} {mvpPlayer.players?.last_name}
                      </h3>
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-5 h-5 ${
                                star <= Math.round(mvpRating.average)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "fill-transparent text-white/30"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-white/90 font-semibold text-lg">
                          {mvpRating.average.toFixed(1)}
                        </span>
                        <span className="text-white/60 text-sm">
                          ({mvpRating.count} {mvpRating.count === 1 ? 'ocjena' : 'ocjena'})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Players */}
          {(homePlayers.length > 0 || awayPlayers.length > 0) && (
            <div className="bg-slate-800/50 border border-white/30 rounded-2xl sm:rounded-3xl p-2 sm:p-8 backdrop-blur-md shadow-2xl">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">Igrači</h2>
              <div className="flex gap-2 sm:gap-8">
                {/* Home players */}
                <div className='w-1/2'>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-slate-700/50 flex items-center justify-center shadow-md flex-shrink-0">
                      <Image
                        src={getTeamLogo(match.home_team)}
                        alt={match.home_team}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/placeholder-logo.svg'
                        }}
                      />
                    </div>
                    <h3 className="text-lg font-semibold text-white">{match.home_team}</h3>
                  </div>
                  {homePlayers.length > 0 ? (
                    <div className="space-y-2">
                      {homePlayers.map((mp) => {
                        const playerId = mp.players?.id
                        const rating = playerId ? averageRatings[playerId] : null
                        return (
                          <div
                            key={mp.id}
                            className="flex items-center gap-1 bg-slate-700/30 rounded-lg text-white hover:bg-slate-700/50 transition-colors justify-between pt-2"
                          >
                            <div
                              className="flex items-center gap-1 flex-1 min-w-0 cursor-pointer"
                              onClick={(e) => handlePlayerClick(e, mp.players || null)}
                            >
                              <div className='flex flex-col py-2 pl-2 flex-1 min-w-0'>
                                <span className='text-xs text-start'>
                                  {mp.players?.first_name}
                                </span>
                                <span className='text-sm'>
                                  {mp.players?.last_name}
                                </span>
                                <div className="flex items-center gap-2 px-1 py-1 shrink-0">
                                  {rating && rating.average > 0 && (
                                    <div className="text-xs text-white/70">
                                      ⭐ {rating.average.toFixed(1)} ({rating.count})
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="relative w-18 h-18 shrink-0">
                                <Image
                                  src={getPlayerImageUrl(mp.players?.image_url)}
                                  alt={`${mp.players?.first_name} ${mp.players?.last_name}`}
                                  fill
                                  className="object-contain"
                                  sizes="40px"
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
                      })}
                    </div>
                  ) : (
                    <p className="text-white/60 text-sm">Nema igrača</p>
                  )}
                </div>

                {/* Away players */}
                <div className='w-1/2'>
                  <div className="flex items-center gap-3 mb-4 justify-end">
                    <h3 className="text-lg font-semibold text-white">{match.away_team}</h3>
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-slate-700/50 flex items-center justify-center shadow-md flex-shrink-0">
                      <Image
                        src={getTeamLogo(match.away_team)}
                        alt={match.away_team}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/placeholder-logo.svg'
                        }}
                      />
                    </div>
                  </div>
                  {awayPlayers.length > 0 ? (
                    <div className="space-y-2">
                      {awayPlayers.map((mp) => {
                        const playerId = mp.players?.id
                        const rating = playerId ? averageRatings[playerId] : null
                        return (
                          <div
                            key={mp.id}
                            className="flex items-center gap-1 bg-slate-700/30 rounded-lg text-white hover:bg-slate-700/50 transition-colors justify-between pt-2"
                          >

                            <div
                              className="flex items-center gap-1 flex-1 min-w-0 justify-end cursor-pointer"
                              onClick={(e) => handlePlayerClick(e, mp.players || null)}
                            >
                              <div className="relative w-18 h-18 shrink-0">
                                <Image
                                  src={getPlayerImageUrl(mp.players?.image_url)}
                                  alt={`${mp.players?.first_name} ${mp.players?.last_name}`}
                                  fill
                                  className="object-contain"
                                  sizes="40px"
                                  unoptimized
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.src = '/no-image-player.png'
                                  }}
                                />
                              </div>
                              <div className='flex flex-col py-2 pr-2 flex-1 min-w-0'>
                                <span className='text-xs text-end'>
                                  {mp.players?.first_name}
                                </span>
                                <span className='text-sm text-end'>
                                  {mp.players?.last_name}
                                </span>
                                <div className="flex items-center gap-2 px-1 py-1 shrink-0 justify-end">
                                  {rating && rating.average > 0 && (
                                    <div className="text-xs text-white/70">
                                      ⭐ {rating.average.toFixed(1)} ({rating.count})
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-white/60 text-sm">Nema igrača</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="bg-slate-800/50 border border-white/30 rounded-2xl sm:rounded-3xl p-4 sm:p-8 backdrop-blur-md shadow-2xl">
            <div className="flex items-center gap-2 mb-6">
              <MessageSquare className="w-5 h-5 text-white" />
              <h2 className="text-xl sm:text-2xl font-bold text-white">Komentari</h2>
            </div>

            {/* Comment Form */}
            <form onSubmit={handleSubmitComment} className="mb-8 space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Vaš nadimak"
                  value={commentNickname}
                  onChange={(e) => setCommentNickname(e.target.value)}
                  maxLength={50}
                  className="bg-slate-700/50 border-white/20 text-white placeholder:text-white/50"
                  required
                />
                <Textarea
                  placeholder="Ostavite komentar..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  maxLength={1000}
                  rows={4}
                  className="bg-slate-700/50 border-white/20 text-white placeholder:text-white/50 resize-none"
                  required
                />
                <div className="flex justify-between items-center text-xs text-white/60">
                  <span>{commentText.length}/1000</span>
                  <Button
                    type="submit"
                    disabled={submittingComment || !commentNickname.trim() || !commentText.trim()}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white"
                  >
                    {submittingComment ? (
                      'Šalje se...'
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Pošalji
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>

            {/* Comments List */}
            {loadingComments ? (
              <div className="text-center py-8 text-white/60">Učitavanje komentara...</div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-white/60">Nema komentara. Budite prvi koji će komentarisati!</div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-slate-700/30 rounded-xl p-4 border border-white/10"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <div className="font-semibold text-white mb-1">{comment.nickname}</div>
                        <p className="text-white/80 text-sm whitespace-pre-wrap break-words">
                          {comment.comment}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-white/50 mt-2">
                      {comment.created_at ? format(new Date(comment.created_at), 'dd MMM yyyy, HH:mm') : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Rating Dialog */}
      {selectedPlayer && match && (
        <PlayerRatingDialog
          open={ratingDialogOpen}
          onOpenChange={setRatingDialogOpen}
          player={selectedPlayer}
          matchId={match.id}
          currentAverageRating={selectedPlayer.id ? averageRatings[selectedPlayer.id]?.average : 0}
          ratingCount={selectedPlayer.id ? averageRatings[selectedPlayer.id]?.count : 0}
          onRatingSubmitted={handleRatingSubmitted}
        />
      )}
    </main>
  )
}

