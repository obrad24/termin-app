'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Result, Player, MatchGoal, MatchPlayer, Team, MatchComment } from '@/lib/supabase'
import { format } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/header'
import { ArrowLeft, Star, MessageSquare, Send, ThumbsUp, ThumbsDown, Info } from 'lucide-react'
import { getPlayerImageUrl } from '@/lib/image-utils'
import PlayerRatingDialog from '@/components/player-rating-dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { SHOW_PLAYER_RATINGS } from '@/lib/features'
import { getOrCreateVoterId } from '@/lib/voter-id'

interface GoalWithPlayer extends MatchGoal {
  players: Player
}

interface MatchPlayerWithPlayer extends MatchPlayer {
  players: Player
}

interface ResultWithDetails extends Result {
  goals: GoalWithPlayer[]
  players: MatchPlayerWithPlayer[]
  fantasy_points?: Record<number, number>
}

type MainTab = 'details' | 'stats'
type TeamFilter = 'all' | 'home' | 'away'
type StatsSort = 'player' | 'pts' | 'gs'

function shortName(name: string, team?: Team | null) {
  if (team?.short_name) return team.short_name.toUpperCase()
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase()
  return parts.map((p) => p[0]).join('').slice(0, 3).toUpperCase()
}

function groupGoalsByPlayer(goals: GoalWithPlayer[]) {
  const grouped = new Map<
    string,
    { name: string; count: number; playerId: number | null; player: Player | null }
  >()

  goals.forEach((goal) => {
    const playerKey = goal.player_id?.toString() || 'unknown'
    const playerName = goal.players
      ? `${goal.players.first_name} ${goal.players.last_name}`
      : `Player #${goal.player_id}`

    if (grouped.has(playerKey)) {
      grouped.get(playerKey)!.count++
    } else {
      grouped.set(playerKey, {
        name: playerName,
        count: 1,
        playerId: goal.player_id || null,
        player: goal.players || null,
      })
    }
  })

  return Array.from(grouped.values())
}

function SplitStatSection({
  title,
  homeItems,
  awayItems,
  onPlayerClick,
}: {
  title: string
  homeItems: { label: string; player: Player | null }[]
  awayItems: { label: string; player: Player | null }[]
  onPlayerClick: (e: React.MouseEvent, player: Player | null) => void
}) {
  if (homeItems.length === 0 && awayItems.length === 0) return null

  return (
    <div className="py-4 border-t border-white/10">
      <h3 className="text-center text-white font-bold text-base mb-3">{title}</h3>
      <div className="relative grid grid-cols-2 gap-3 min-h-[28px]">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/15 -translate-x-1/2" />
        <div className="pr-3 text-right space-y-1.5">
          {homeItems.map((item, i) => (
            <button
              key={`h-${i}`}
              type="button"
              onClick={(e) => onPlayerClick(e, item.player)}
              className="block w-full text-right text-sm text-white/90 hover:text-[var(--fpl-cyan)] transition"
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="pl-3 text-left space-y-1.5">
          {awayItems.map((item, i) => (
            <button
              key={`a-${i}`}
              type="button"
              onClick={(e) => onPlayerClick(e, item.player)}
              className="block w-full text-left text-sm text-white/90 hover:text-[var(--fpl-cyan)] transition"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function MatchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [match, setMatch] = useState<ResultWithDetails | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [averageRatings, setAverageRatings] = useState<Record<number, { average: number; count: number }>>({})
  const [myRatings, setMyRatings] = useState<Record<number, number>>({})
  const [votingLocked, setVotingLocked] = useState(false)
  const [ratingLocksAt, setRatingLocksAt] = useState<string | null>(null)
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [comments, setComments] = useState<MatchComment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [commentNickname, setCommentNickname] = useState('')
  const [commentText, setCommentText] = useState('')
  const [commentsOffset, setCommentsOffset] = useState(0)
  const [hasMoreComments, setHasMoreComments] = useState(false)
  const [loadingMoreComments, setLoadingMoreComments] = useState(false)
  const [mainTab, setMainTab] = useState<MainTab>('details')
  const [teamFilter, setTeamFilter] = useState<TeamFilter>('all')
  const [statsSort, setStatsSort] = useState<StatsSort>('pts')
  const [statsSortDir, setStatsSortDir] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    if (!params.id) return
    let cancelled = false
    const load = async () => {
      try {
        setLoading(true)
        const [matchRes, teamsRes, commentsRes] = await Promise.all([
          fetch(`/api/results/${params.id}`),
          fetch('/api/teams'),
          fetch(`/api/matches/${params.id}/comments?limit=8&offset=0`),
        ])
        if (cancelled) return

        if (teamsRes.ok) setTeams((await teamsRes.json()) || [])

        if (matchRes.ok) {
          const data = await matchRes.json()
          setMatch(data)
        } else if (matchRes.status === 404) {
          router.push('/matches')
          return
        }

        if (commentsRes.ok) {
          const data = await commentsRes.json()
          setComments(data.comments || [])
          setHasMoreComments(!!data.hasMore)
          setCommentsOffset((data.comments || []).length)
        }
      } catch (error) {
        console.error('Error loading match page:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [params.id])

  useEffect(() => {
    if (SHOW_PLAYER_RATINGS && match?.id) {
      fetchAverageRatings()
      fetchMyRatings()
    }
  }, [match?.id])

  const handlePlayerClick = (e: React.MouseEvent, player: Player | null) => {
    e.preventDefault()
    if (!player?.id) return
    router.push(`/players/${player.id}`)
  }

  const handleRatePlayer = (e: React.MouseEvent, player: Player | null) => {
    e.preventDefault()
    e.stopPropagation()
    if (!player || !SHOW_PLAYER_RATINGS || votingLocked) return
    setSelectedPlayer(player)
    setRatingDialogOpen(true)
  }

  const handleRatingSubmitted = (playerId: number, rating: number) => {
    setMyRatings((prev) => ({ ...prev, [playerId]: rating }))
    if (match?.id) {
      fetchAverageRatings()
    }
  }

  const fetchMyRatings = async () => {
    if (!match?.id) return
    try {
      const voterId = getOrCreateVoterId()
      const response = await fetch(
        `/api/match-ratings/user-rating?match_id=${match.id}&voter_id=${encodeURIComponent(voterId)}`,
      )
      if (!response.ok) return
      const data = await response.json()
      const next: Record<number, number> = {}
      Object.entries(data.ratings || {}).forEach(([key, value]) => {
        const id = parseInt(key, 10)
        if (!Number.isFinite(id)) return
        next[id] = Number(value) || 0
      })
      setMyRatings(next)
    } catch (error) {
      console.error('Error fetching my ratings:', error)
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
        const averages = data.averages && typeof data.averages === 'object' ? data.averages : {}
        // Keep only numeric player-id keys for the ratings map
        const cleaned: Record<number, { average: number; count: number }> = {}
        Object.entries(averages).forEach(([key, value]) => {
          const id = parseInt(key, 10)
          if (!Number.isFinite(id) || !value || typeof value !== 'object') return
          const v = value as { average?: number; count?: number }
          cleaned[id] = { average: Number(v.average) || 0, count: Number(v.count) || 0 }
        })
        // Fallback if API returned legacy flat map
        if (Object.keys(cleaned).length === 0) {
          Object.entries(data || {}).forEach(([key, value]) => {
            const id = parseInt(key, 10)
            if (!Number.isFinite(id) || !value || typeof value !== 'object') return
            if ('average' in (value as any)) {
              cleaned[id] = {
                average: Number((value as any).average) || 0,
                count: Number((value as any).count) || 0,
              }
            }
          })
        }
        setAverageRatings(cleaned)
        setVotingLocked(!!(data.voting_locked ?? data.rating_window?.locked))
        setRatingLocksAt(data.rating_window?.locks_at || null)
      }
    } catch (error) {
      console.error('Error fetching average ratings:', error)
    }
  }

  const getTeam = (teamName: string) => teams.find((t) => t.name === teamName) || null
  const getTeamLogo = (teamName: string) => getTeam(teamName)?.logo_url || '/placeholder-logo.svg'

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

  const fetchComments = async (offset: number = 0, append: boolean = false) => {
    if (!params.id) return
    if (append) {
      setLoadingMoreComments(true)
    } else {
      setLoadingComments(true)
    }
    try {
      const response = await fetch(`/api/matches/${params.id}/comments?limit=8&offset=${offset}`)
      if (response.ok) {
        const data = await response.json()
        if (append) {
          setComments([...comments, ...(data.comments || [])])
        } else {
          setComments(data.comments || [])
        }
        setHasMoreComments(data.hasMore || false)
        setCommentsOffset(offset + (data.comments?.length || 0))
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoadingComments(false)
      setLoadingMoreComments(false)
    }
  }

  const handleLoadMoreComments = () => {
    fetchComments(commentsOffset, true)
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!match?.id || !commentNickname.trim() || !commentText.trim() || submittingComment) return

    setSubmittingComment(true)
    try {
      const response = await fetch(`/api/matches/${match.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: commentNickname.trim(),
          comment: commentText.trim(),
        }),
      })

      if (response.ok) {
        setCommentsOffset(0)
        setCommentNickname('')
        setCommentText('')
        fetchComments(0, false)
      } else {
        const error = await response.json()
        alert(error.error || 'Error adding comment')
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
      alert('Error adding comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleLikeComment = async (commentId: number, likeType: 'like' | 'dislike') => {
    if (!match?.id) return
    try {
      const response = await fetch(`/api/matches/${match.id}/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ like_type: likeType }),
      })
      if (response.ok) {
        fetchComments()
      }
    } catch (error) {
      console.error('Error liking comment:', error)
    }
  }

  const toggleSort = (key: StatsSort) => {
    if (statsSort === key) {
      setStatsSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setStatsSort(key)
      setStatsSortDir(key === 'player' ? 'asc' : 'desc')
    }
  }

  const homeGoals = match?.goals?.filter((g) => g.team_type === 'home') || []
  const awayGoals = match?.goals?.filter((g) => g.team_type === 'away') || []
  const homePlayers = match?.players?.filter((p) => p.team_type === 'home') || []
  const awayPlayers = match?.players?.filter((p) => p.team_type === 'away') || []

  const getAverageRating = (playerId: number | string | null | undefined) => {
    if (playerId == null) return undefined
    const n = typeof playerId === 'string' ? parseInt(playerId, 10) : Number(playerId)
    if (!Number.isFinite(n)) return undefined
    return averageRatings[n] || averageRatings[String(n) as any]
  }

  const goalsByPlayerId = useMemo(() => {
    const map = new Map<number, number>()
    ;(match?.goals || []).forEach((g) => {
      if (!g.player_id) return
      const pid =
        typeof g.player_id === 'string' ? parseInt(g.player_id, 10) : Number(g.player_id)
      if (!Number.isFinite(pid)) return
      map.set(pid, (map.get(pid) || 0) + 1)
    })
    return map
  }, [match?.goals])

  const fantasyPointsByPlayer = useMemo(() => {
    const map = new Map<number, number>()
    const raw = match?.fantasy_points
    if (!raw || typeof raw !== 'object') return map
    Object.entries(raw).forEach(([key, value]) => {
      const id = typeof key === 'string' ? parseInt(key, 10) : Number(key)
      if (!Number.isFinite(id)) return
      map.set(id, Number(value) || 0)
    })
    return map
  }, [match?.fantasy_points])

  const statsRows = useMemo(() => {
    if (!match) return []
    const pool =
      teamFilter === 'home' ? homePlayers : teamFilter === 'away' ? awayPlayers : match.players || []

    const rows = pool.map((mp) => {
      const player = mp.players
      const rawId = player?.id ?? mp.player_id
      const id =
        typeof rawId === 'string' ? parseInt(rawId, 10) : Number(rawId)
      const pts = fantasyPointsByPlayer.get(id) || 0
      const gs = goalsByPlayerId.get(id) || 0
      const name = player ? `${player.last_name}` : `Player #${id}`
      const fullName = player ? `${player.first_name} ${player.last_name}` : name
      const teamName = mp.team_type === 'home' ? match.home_team : match.away_team
      return { mp, player, id, pts, gs, name, fullName, teamName }
    })

    rows.sort((a, b) => {
      let cmp = 0
      if (statsSort === 'player') cmp = a.name.localeCompare(b.name)
      else if (statsSort === 'gs') cmp = a.gs - b.gs
      else cmp = a.pts - b.pts
      return statsSortDir === 'asc' ? cmp : -cmp
    })

    return rows
  }, [
    match,
    teamFilter,
    homePlayers,
    awayPlayers,
    fantasyPointsByPlayer,
    goalsByPlayerId,
    statsSort,
    statsSortDir,
  ])

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--fpl-p120)] pb-20 md:pb-0">
        <Header />
        <section className="relative px-4 py-8 max-w-3xl mx-auto">
          <div className="text-white text-center py-12">Loading...</div>
        </section>
      </main>
    )
  }

  if (!match) {
    return (
      <main className="min-h-screen bg-[var(--fpl-p120)] pb-20 md:pb-0">
        <Header />
        <section className="relative px-4 py-8 max-w-3xl mx-auto">
          <div className="text-white text-center py-12">
            <p className="text-lg mb-4">Match not found</p>
            <Link href="/matches" className="text-white/80 hover:text-white underline">
              Back to fixtures
            </Link>
          </div>
        </section>
      </main>
    )
  }

  const homeTeam = getTeam(match.home_team)
  const awayTeam = getTeam(match.away_team)
  const homeShort = shortName(match.home_team, homeTeam)
  const awayShort = shortName(match.away_team, awayTeam)

  const homeGoalItems = groupGoalsByPlayer(homeGoals).map((g) => ({
    label: g.count > 1 ? `${g.player?.last_name || g.name} (${g.count})` : g.player?.last_name || g.name,
    player: g.player,
  }))
  const awayGoalItems = groupGoalsByPlayer(awayGoals).map((g) => ({
    label: g.count > 1 ? `${g.player?.last_name || g.name} (${g.count})` : g.player?.last_name || g.name,
    player: g.player,
  }))

  let mvpPlayer: MatchPlayerWithPlayer | null = null
  let mvpRating: { average: number; count: number } | null = null
  if (match.players && Object.keys(averageRatings).length > 0) {
    let highest = 0
    let bestId: number | null = null
    Object.entries(averageRatings).forEach(([playerId, rating]) => {
      if (rating.average > highest) {
        highest = rating.average
        bestId = parseInt(playerId, 10)
      }
    })
    if (bestId) {
      mvpPlayer =
        match.players.find((mp) => Number(mp.players?.id ?? mp.player_id) === bestId) || null
      mvpRating = getAverageRating(bestId) || null
    }
  }

  const allPlayerRatingRows = (match.players || [])
    .map((mp) => {
      const player = mp.players
      const id = Number(player?.id ?? mp.player_id)
      const rating = getAverageRating(id)
      return {
        mp,
        player,
        id,
        name: player ? `${player.first_name} ${player.last_name}` : `Player #${id}`,
        teamName: mp.team_type === 'home' ? match.home_team : match.away_team,
        average: rating?.average || 0,
        count: rating?.count || 0,
      }
    })
    .sort((a, b) => {
      if (b.average !== a.average) return b.average - a.average
      return a.name.localeCompare(b.name)
    })

  return (
    <main className="min-h-screen bg-[var(--fpl-p120)] pb-24 md:pb-8">
      <Header />

      <section className="relative px-3 sm:px-6 py-4 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-3 px-1">
          <Link
            href="/matches"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Fixtures & Results
          </Link>
        </div>

        <div className="rounded-2xl overflow-hidden bg-[var(--fpl-p120)] shadow-xl border border-white/10">
          {/* Split scoreboard */}
          <div className="relative grid grid-cols-2 min-h-[120px] sm:min-h-[140px]">
            <div className="bg-[#1a2f8c] flex flex-col items-center justify-center gap-2 py-5 px-3">
              <div className="relative w-12 h-12 sm:w-14 sm:h-14">
                <Image
                  src={getTeamLogo(match.home_team)}
                  alt={match.home_team}
                  fill
                  className="object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/placeholder-logo.svg'
                  }}
                />
              </div>
              <span className="text-white font-bold text-lg tracking-wide">{homeShort}</span>
            </div>
            <div className="bg-[#5eb3e4] flex flex-col items-center justify-center gap-2 py-5 px-3">
              <div className="relative w-12 h-12 sm:w-14 sm:h-14">
                <Image
                  src={getTeamLogo(match.away_team)}
                  alt={match.away_team}
                  fill
                  className="object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/placeholder-logo.svg'
                  }}
                />
              </div>
              <span className="text-[var(--fpl-purple)] font-bold text-lg tracking-wide">{awayShort}</span>
            </div>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="bg-[#1a0a1e] rounded-xl px-4 sm:px-5 py-2 sm:py-2.5 shadow-lg border border-white/10">
                <span className="font-display text-2xl sm:text-3xl font-bold text-white tracking-wide">
                  {match.home_score} - {match.away_score}
                </span>
              </div>
            </div>
          </div>

          <div className="text-center py-3 text-sm text-white/55 border-b border-white/10">
            {format(new Date(match.date), 'dd MMM yyyy')} • {format(new Date(match.date), 'HH:mm')}
          </div>

          {/* Tabs */}
          <div className="flex gap-6 px-4 border-b border-white/10">
            <button
              type="button"
              onClick={() => setMainTab('details')}
              className={`relative py-3 text-sm sm:text-base font-semibold transition ${
                mainTab === 'details' ? 'text-white' : 'text-white/45 hover:text-white/70'
              }`}
            >
              Match Details
              {mainTab === 'details' && (
                <span className="absolute left-0 right-0 -bottom-px h-[3px] bg-white rounded-t" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setMainTab('stats')}
              className={`relative py-3 text-sm sm:text-base font-semibold transition ${
                mainTab === 'stats' ? 'text-white' : 'text-white/45 hover:text-white/70'
              }`}
            >
              Player Stats
              {mainTab === 'stats' && (
                <span className="absolute left-0 right-0 -bottom-px h-[3px] bg-white rounded-t" />
              )}
            </button>
          </div>

          {/* Tab content */}
          <div className="px-4 pb-5 pt-2">
            {mainTab === 'details' ? (
              <div>
                <SplitStatSection
                  title="Goals"
                  homeItems={homeGoalItems}
                  awayItems={awayGoalItems}
                  onPlayerClick={handlePlayerClick}
                />

                {SHOW_PLAYER_RATINGS && mvpPlayer && mvpRating && (
                  <div className="py-4 border-t border-white/10">
                    <h3 className="text-center text-white font-bold text-base mb-3">MVP</h3>
                    <button
                      type="button"
                      onClick={(e) => handlePlayerClick(e, mvpPlayer!.players || null)}
                      className="mx-auto flex flex-col items-center gap-2 hover:opacity-90 transition"
                    >
                      <div className="relative w-20 h-24">
                        <Image
                          src={getPlayerImageUrl(mvpPlayer.players?.image_url)}
                          alt={`${mvpPlayer.players?.first_name} ${mvpPlayer.players?.last_name}`}
                          fill
                          className="object-contain object-bottom"
                          unoptimized
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/no-image-player.png'
                          }}
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-white font-semibold">
                          {mvpPlayer.players?.first_name} {mvpPlayer.players?.last_name}
                        </p>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= Math.round(mvpRating!.average)
                                  ? 'fill-[var(--fpl-green)] text-[var(--fpl-green)]'
                                  : 'fill-transparent text-white/25'
                              }`}
                            />
                          ))}
                          <span className="text-white/80 text-sm ml-1">
                            {mvpRating.average.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </button>
                  </div>
                )}

                {(homePlayers.length > 0 || awayPlayers.length > 0) && (
                  <div className="py-4 border-t border-white/10">
                    <h3 className="text-center text-white font-bold text-base mb-3">Lineups</h3>
                    <div className="relative grid grid-cols-2 gap-3">
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/15 -translate-x-1/2" />
                      <div className="pr-3 space-y-1">
                        {homePlayers.map((mp) => (
                          <button
                            key={mp.id}
                            type="button"
                            onClick={(e) => handlePlayerClick(e, mp.players || null)}
                            className="block w-full text-right text-sm text-white/85 hover:text-[var(--fpl-cyan)]"
                          >
                            {mp.players?.last_name || mp.players?.first_name}
                          </button>
                        ))}
                      </div>
                      <div className="pl-3 space-y-1">
                        {awayPlayers.map((mp) => (
                          <button
                            key={mp.id}
                            type="button"
                            onClick={(e) => handlePlayerClick(e, mp.players || null)}
                            className="block w-full text-left text-sm text-white/85 hover:text-[var(--fpl-cyan)]"
                          >
                            {mp.players?.last_name || mp.players?.first_name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {SHOW_PLAYER_RATINGS && allPlayerRatingRows.length > 0 && (
                  <div className="py-4 border-t border-white/10">
                    <h3 className="text-center text-white font-bold text-base mb-1">Player ratings</h3>
                    <p className="text-center text-white/45 text-xs mb-3">
                      {votingLocked
                        ? 'Voting locked · MVP 3pts · 2nd 2pts · 3rd 1pt'
                        : ratingLocksAt
                          ? `Open profile, or tap stars · closes ${new Date(ratingLocksAt).toLocaleString('sr-Latn', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}`
                          : 'Open profile, or tap stars to rate this termin'}
                    </p>
                    <div className="space-y-1.5">
                      {allPlayerRatingRows.map((row) => {
                        const myRating = myRatings[row.id] || 0
                        return (
                          <div
                            key={row.mp.id}
                            className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl border border-white/10 bg-white/[0.03]"
                          >
                            <button
                              type="button"
                              onClick={(e) => handlePlayerClick(e, row.player || null)}
                              className="flex items-center gap-3 min-w-0 flex-1 text-left hover:opacity-90 transition"
                            >
                              <div className="relative w-9 h-9 rounded-full overflow-hidden bg-white/10 shrink-0">
                                <Image
                                  src={getPlayerImageUrl(row.player?.image_url)}
                                  alt={row.name}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.src = '/no-image-player.png'
                                  }}
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-white text-sm font-semibold truncate">{row.name}</p>
                                <p className="text-white/45 text-[11px] truncate">{row.teamName}</p>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleRatePlayer(e, row.player || null)}
                              disabled={votingLocked}
                              className="shrink-0 text-right hover:opacity-90 transition disabled:opacity-70 disabled:cursor-not-allowed"
                              aria-label={
                                votingLocked ? `${row.name} rating locked` : `Rate ${row.name}`
                              }
                            >
                              <div className="flex items-center gap-0.5 justify-end">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-3 h-3 ${
                                      myRating > 0 && star <= myRating
                                        ? 'fill-[var(--fpl-green)] text-[var(--fpl-green)]'
                                        : 'fill-transparent text-white/25'
                                    }`}
                                  />
                                ))}
                              </div>
                              <p className="text-white/70 text-[11px] mt-0.5 tabular-nums">
                                {myRating > 0
                                  ? `You ${myRating}`
                                  : row.average > 0
                                    ? `Avg ${row.average.toFixed(1)} · ${row.count}`
                                    : 'Rate'}
                              </p>
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Comments under Match Details */}
                <div className="py-4 border-t border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="w-4 h-4 text-white" />
                    <h3 className="text-white font-bold text-base">Comments</h3>
                  </div>

                  <form onSubmit={handleSubmitComment} className="mb-5 space-y-3">
                    <Input
                      type="text"
                      placeholder="Your nickname"
                      value={commentNickname}
                      onChange={(e) => setCommentNickname(e.target.value)}
                      maxLength={50}
                      className="bg-white/10 border-white/15 text-white placeholder:text-white/40"
                      required
                    />
                    <Textarea
                      placeholder="Leave a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      maxLength={1000}
                      rows={3}
                      className="bg-white/10 border-white/15 text-white placeholder:text-white/40 resize-none"
                      required
                    />
                    <div className="flex justify-between items-center text-xs text-white/50">
                      <span>{commentText.length}/1000</span>
                      <Button
                        type="submit"
                        disabled={submittingComment || !commentNickname.trim() || !commentText.trim()}
                        className="bg-[var(--fpl-green)] hover:brightness-110 text-[var(--fpl-purple)] font-bold"
                      >
                        {submittingComment ? 'Sending...' : (
                          <>
                            <Send className="w-4 h-4" />
                            Send
                          </>
                        )}
                      </Button>
                    </div>
                  </form>

                  {loadingComments ? (
                    <div className="text-center py-6 text-white/50 text-sm">Loading comments...</div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-6 text-white/50 text-sm">
                      No comments yet. Be the first to comment!
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {comments.map((comment) => (
                          <div key={comment.id} className="bg-white/5 rounded-xl p-3 border border-white/10">
                            <div className="text-xs text-white/50 mb-1">{comment.nickname}</div>
                            <p className="text-white/90 text-sm font-medium whitespace-pre-wrap break-words">
                              {comment.comment}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <div className="text-[11px] text-white/40">
                                {comment.created_at
                                  ? format(new Date(comment.created_at), 'dd MMM yyyy, HH:mm')
                                  : ''}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleLikeComment(comment.id, 'like')}
                                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                                    comment.user_like_type === 'like'
                                      ? 'bg-[var(--fpl-green)]/20 text-[var(--fpl-green)]'
                                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                                  }`}
                                >
                                  <ThumbsUp className="w-3.5 h-3.5" />
                                  <span>{comment.likes_count || 0}</span>
                                </button>
                                <button
                                  onClick={() => handleLikeComment(comment.id, 'dislike')}
                                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                                    comment.user_like_type === 'dislike'
                                      ? 'bg-[var(--fpl-pink)]/20 text-[var(--fpl-pink)]'
                                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                                  }`}
                                >
                                  <ThumbsDown className="w-3.5 h-3.5" />
                                  <span>{comment.dislikes_count || 0}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {hasMoreComments && (
                        <div className="flex justify-center mt-4">
                          <Button
                            onClick={handleLoadMoreComments}
                            disabled={loadingMoreComments}
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10"
                          >
                            {loadingMoreComments ? 'Loading...' : 'Show more'}
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div>
                {/* Team filter pills */}
                <div className="mt-2 mb-4 rounded-full bg-[var(--fpl-p90)] p-1 flex">
                  {(
                    [
                      { key: 'all' as const, label: 'All' },
                      { key: 'home' as const, label: match.home_team },
                      { key: 'away' as const, label: match.away_team },
                    ]
                  ).map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setTeamFilter(opt.key)}
                      className={`flex-1 min-w-0 truncate px-2 py-2 rounded-full text-xs sm:text-sm font-semibold transition ${
                        teamFilter === opt.key
                          ? 'bg-[var(--fpl-p80)] text-white shadow-sm'
                          : 'text-white/55 hover:text-white/80'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Stats table — fantasy points + goals */}
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-[1fr_48px_48px] gap-2 px-1 pb-2 text-[11px] sm:text-xs text-white/50 font-semibold uppercase tracking-wide border-b border-white/10">
                    <button type="button" className="text-left hover:text-white" onClick={() => toggleSort('player')}>
                      Player {statsSort === 'player' ? (statsSortDir === 'asc' ? '↑' : '↓') : '↕'}
                    </button>
                    <button type="button" className="text-center hover:text-white" onClick={() => toggleSort('pts')}>
                      FPL {statsSort === 'pts' ? (statsSortDir === 'asc' ? '↑' : '↓') : '↕'}
                    </button>
                    <button type="button" className="text-center hover:text-white" onClick={() => toggleSort('gs')}>
                      GS {statsSort === 'gs' ? (statsSortDir === 'asc' ? '↑' : '↓') : '↕'}
                    </button>
                  </div>

                  {statsRows.length === 0 ? (
                    <p className="text-center text-white/50 text-sm py-8">No players to display</p>
                  ) : (
                    <div>
                      {statsRows.map((row) => (
                        <button
                          key={row.mp.id}
                          type="button"
                          onClick={(e) => handlePlayerClick(e, row.player)}
                          className="w-full grid grid-cols-[1fr_48px_48px] gap-2 items-center px-1 py-3 border-b border-white/10 hover:bg-white/5 transition text-left"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Info className="w-3.5 h-3.5 text-white/35 shrink-0" />
                            <div className="relative w-7 h-7 rounded-full overflow-hidden bg-white/10 shrink-0">
                              <Image
                                src={getPlayerImageUrl(row.player?.image_url)}
                                alt={row.fullName}
                                fill
                                className="object-cover"
                                unoptimized
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = '/no-image-player.png'
                                }}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="text-white text-sm font-semibold truncate">{row.name}</div>
                              <div className="text-white/45 text-[11px] truncate">{row.teamName}</div>
                            </div>
                          </div>
                          <div
                            className={`text-center text-sm font-semibold tabular-nums ${
                              row.pts > 0
                                ? 'text-[var(--fpl-green)]'
                                : row.pts < 0
                                  ? 'text-[var(--fpl-pink)]'
                                  : 'text-white/50'
                            }`}
                          >
                            {row.pts > 0 ? `+${row.pts}` : row.pts}
                          </div>
                          <div className="text-center text-sm text-white font-medium">{row.gs}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {SHOW_PLAYER_RATINGS && selectedPlayer && match && (
        <PlayerRatingDialog
          open={ratingDialogOpen}
          onOpenChange={setRatingDialogOpen}
          player={selectedPlayer}
          matchId={match.id}
          currentAverageRating={selectedPlayer.id ? averageRatings[selectedPlayer.id]?.average : 0}
          ratingCount={selectedPlayer.id ? averageRatings[selectedPlayer.id]?.count : 0}
          votingLocked={votingLocked}
          onRatingSubmitted={handleRatingSubmitted}
        />
      )}
    </main>
  )
}
