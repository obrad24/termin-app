'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Result, Player, Team, Season } from '@/lib/supabase'
import { format } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'
import { getPlayerImageUrl } from '@/lib/image-utils'
import { SHOW_TERMINBET, SHOW_PLAYER_RATINGS } from '@/lib/features'
import FantasyAdminPanel from '@/components/fantasy-admin-panel'
import {
  Home,
  LogOut,
  Plus,
  Minus,
  Trash2,
  TrendingUp,
  Calendar,
  Trophy,
  UserPlus,
  Users,
  Pencil,
  Sparkles,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Newspaper } from 'lucide-react'
import { useSeason } from '@/components/season-provider'

type FriendlyTeamType = 'home' | 'away'

const adminPanel =
  'bg-[var(--fpl-purple)] border-white/10 text-white shadow-none'
const adminDialog =
  'bg-[var(--fpl-purple)] border-white/10 text-white'
const adminOutlineBtn =
  'border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white'
const adminPrimaryBtn =
  'bg-[var(--fpl-green)] text-[var(--fpl-purple)] hover:bg-[var(--fpl-green)]/90'

interface FriendlyGoal {
  id: string
  player_id: string
  team_type: FriendlyTeamType
}

interface FriendlyMatchPlayer {
  id: string
  player_id: string
  team_type: FriendlyTeamType
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Result[]>([])
  const [loadingResults, setLoadingResults] = useState(true)
  const [players, setPlayers] = useState<Player[]>([])
  const [loadingPlayers, setLoadingPlayers] = useState(true)
  const [teams, setTeams] = useState<Team[]>([])
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [seasons, setSeasons] = useState<Season[]>([])
  const [loadingSeasons, setLoadingSeasons] = useState(true)
  const [newSeasonName, setNewSeasonName] = useState('')
  const [playerForm, setPlayerForm] = useState({
    first_name: '',
    last_name: '',
    birth_year: '',
    team: '',
    image_url: '',
    price: '',
  })
  const [teamForm, setTeamForm] = useState({
    name: '',
    short_name: '',
  })
  const [teamLogoFile, setTeamLogoFile] = useState<File | null>(null)
  const [playerImageFile, setPlayerImageFile] = useState<File | null>(null)
  const [editingResult, setEditingResult] = useState<Result | null>(null)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [editTeamLogoFile, setEditTeamLogoFile] = useState<File | null>(null)
  const [editPlayerImageFile, setEditPlayerImageFile] = useState<File | null>(null)
  const [editResultForm, setEditResultForm] = useState({
    home_team: '',
    away_team: '',
    home_score: '',
    away_score: '',
    date: '',
  })
  const [editPlayerTeam, setEditPlayerTeam] = useState<string>('')
  const [editPlayerInjury, setEditPlayerInjury] = useState<boolean>(false)
  const [editPlayerRatings, setEditPlayerRatings] = useState({
    pace: '',
    shooting: '',
    passing: '',
    dribbling: '',
    defending: '',
    physical: '',
    stamina: '',
  })
  const [ratingBonus, setRatingBonus] = useState<string>('')
  const [nextMatch, setNextMatch] = useState<{
    home_team: string
    away_team: string
    match_date: string
    odds_1: string
    odds_x: string
    odds_2: string
    match_result: '1' | 'X' | '2' | ''
    home_score: string
    away_score: string
    total_goals: string
    goals: Array<{
      player_id: string
      team_type: 'home' | 'away'
      goal_count: string
    }>
    // Dodatne kvote
    total_goals_odds: Array<{
      goals: string
      odd: string
    }>
    player_goals_odds: Array<{
      player_id: string
      goals: string
      odd: string
    }>
    over_under_odds: Array<{
      goals: string
      over_odd: string
      under_odd: string
    }>
  }>({
    home_team: '',
    away_team: '',
    match_date: new Date().toISOString().split('T')[0],
    odds_1: '',
    odds_x: '',
    odds_2: '',
    match_result: '',
    home_score: '',
    away_score: '',
    total_goals: '',
    goals: [],
    total_goals_odds: [],
    player_goals_odds: [],
    over_under_odds: [],
  })
  const [loadingNextMatch, setLoadingNextMatch] = useState(true)
  const [showTerminBetDialog, setShowTerminBetDialog] = useState(false)
  const [showMatchAnnouncementDialog, setShowMatchAnnouncementDialog] = useState(false)
  const [selectedMatchPlayers, setSelectedMatchPlayers] = useState<Set<string>>(new Set())
  const [loadingMatchPlayers, setLoadingMatchPlayers] = useState(false)
  const [existingMatchPlayers, setExistingMatchPlayers] = useState<Array<{
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
  }>>([])
  // TerminNews je uklonjen iz admin panela
  const [showFriendlyMatchDialog, setShowFriendlyMatchDialog] = useState(false)
  const [friendlyMatchForm, setFriendlyMatchForm] = useState({
    home_team: '',
    away_team: '',
    home_score: '',
    away_score: '',
    date: new Date().toISOString().split('T')[0],
  })
  const [friendlyStep, setFriendlyStep] = useState<'teams' | 'players' | 'results'>('teams')
  const [friendlySelectedPlayers, setFriendlySelectedPlayers] = useState<Set<string>>(new Set())
  const [friendlyGoals, setFriendlyGoals] = useState<FriendlyGoal[]>([])
  const { toast } = useToast()
  const { currentSeason, setCurrentSeasonId, refreshSeasons } = useSeason()

  const toggleFriendlyPlayerSelection = (playerId: string, teamType: FriendlyTeamType) => {
    const key = `${playerId}-${teamType}`
    setFriendlySelectedPlayers((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        // Ako je igrač već izabran za drugi tim, ukloni tu vezu
        const otherKey = `${playerId}-${teamType === 'home' ? 'away' : 'home'}`
        newSet.delete(otherKey)
        newSet.add(key)
      }
      return newSet
    })
  }

  const isFriendlyPlayerSelected = (playerId: string, teamType: FriendlyTeamType) => {
    return friendlySelectedPlayers.has(`${playerId}-${teamType}`)
  }

  const getFriendlySelectedPlayers = (): FriendlyMatchPlayer[] => {
    const selected: FriendlyMatchPlayer[] = []
    friendlySelectedPlayers.forEach((key) => {
      const [playerId, teamType] = key.split('-')
      selected.push({
        id: key,
        player_id: playerId,
        team_type: teamType as FriendlyTeamType,
      })
    })
    return selected
  }

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/check')
      if (response.ok) {
        const data = await response.json()
        if (data.authenticated) {
          setIsAuthenticated(true)
          fetchResults()
          fetchPlayers()
          fetchTeams()
          fetchNextMatch()
          fetchSeasons()
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error)
    } finally {
      setCheckingAuth(false)
    }
  }

  const handleLogin = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      if (response.ok) {
        setIsAuthenticated(true)
        setPassword('')
        fetchResults()
        fetchPlayers()
        fetchTeams()
        fetchNextMatch()
        fetchSeasons()
        toast({
          title: 'Login successful',
          description: 'Welcome to the admin dashboard',
        })
      } else {
        toast({
          title: 'Incorrect password',
          description: 'Please try again',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' })
      setIsAuthenticated(false)
      toast({
        title: 'Logged out successfully',
        description: 'You have been logged out successfully',
      })
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const fetchResults = async () => {
    setLoadingResults(true)
    try {
      const seasonQuery = currentSeason ? `?season_id=${currentSeason.id}` : ''
      const response = await fetch(`/api/results${seasonQuery}`)
      if (response.ok) {
        const data = await response.json()
        setResults(data || [])
      }
    } catch (error) {
      console.error('Error fetching results:', error)
    } finally {
      setLoadingResults(false)
    }
  }

  const fetchPlayers = async () => {
    setLoadingPlayers(true)
    try {
      const seasonQuery = currentSeason ? `?season_id=${currentSeason.id}` : ''
      const response = await fetch(`/api/players${seasonQuery}`)
      if (response.ok) {
        const data = await response.json()
        setPlayers(data || [])
      }
    } catch (error) {
      console.error('Error fetching players:', error)
    } finally {
      setLoadingPlayers(false)
    }
  }

  const fetchTeams = async () => {
    setLoadingTeams(true)
    try {
      const seasonQuery = currentSeason ? `?season_id=${currentSeason.id}` : ''
      const response = await fetch(`/api/teams${seasonQuery}`)
      if (response.ok) {
        const data = await response.json()
        setTeams(data || [])
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    } finally {
      setLoadingTeams(false)
    }
  }

  const fetchNextMatch = async () => {
    setLoadingNextMatch(true)
    try {
      const response = await fetch('/api/next-match')
      if (response.ok) {
        const data = await response.json()
        if (data) {
          setNextMatch({
            home_team: data.home_team || '',
            away_team: data.away_team || '',
            match_date: data.match_date ? new Date(data.match_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            odds_1: data.odds_1?.toString() || '',
            odds_x: data.odds_x?.toString() || '',
            odds_2: data.odds_2?.toString() || '',
            match_result: data.match_result || '',
            home_score: data.home_score?.toString() || '',
            away_score: data.away_score?.toString() || '',
            total_goals: data.total_goals?.toString() || '',
            goals: data.goals || [],
            total_goals_odds: (data.total_goals_odds || []).map((item: any) => ({
              goals: item.goals?.toString() || '',
              odd: item.odd?.toString() || '',
            })),
            player_goals_odds: (data.player_goals_odds || []).map((item: any) => ({
              player_id: item.player_id?.toString() || '',
              goals: item.goals?.toString() || '',
              odd: item.odd?.toString() || '',
            })),
            over_under_odds: (data.over_under_odds || []).map((item: any) => ({
              goals: item.goals?.toString() || '',
              over_odd: item.over_odd?.toString() || '',
              under_odd: item.under_odd?.toString() || '',
            })),
          })
        }
      }
    } catch (error) {
      console.error('Error fetching next match:', error)
    } finally {
      setLoadingNextMatch(false)
    }
  }

  const fetchSeasons = async () => {
    setLoadingSeasons(true)
    try {
      const response = await fetch('/api/seasons', { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        setSeasons(data || [])
        await refreshSeasons()
      }
    } catch (error) {
      console.error('Error fetching seasons:', error)
    } finally {
      setLoadingSeasons(false)
    }
  }

  const fetchMatchPlayers = async () => {
    setLoadingMatchPlayers(true)
    try {
      const response = await fetch('/api/next-match/players')
      if (response.ok) {
        const data = await response.json()
        setExistingMatchPlayers(data || [])
        // Postavi izabrane igrače
        const selected = new Set<string>()
        data.forEach((item: any) => {
          selected.add(`${item.player_id}-${item.team_type}`)
        })
        setSelectedMatchPlayers(selected)
      }
    } catch (error) {
      console.error('Error fetching match players:', error)
    } finally {
      setLoadingMatchPlayers(false)
    }
  }

  const toggleMatchPlayerSelection = (playerId: string, teamType: 'home' | 'away') => {
    const key = `${playerId}-${teamType}`
    setSelectedMatchPlayers((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  const isMatchPlayerSelected = (playerId: string, teamType: 'home' | 'away') => {
    return selectedMatchPlayers.has(`${playerId}-${teamType}`)
  }

  const handleSaveMatchPlayers = async () => {
    setLoading(true)
    try {
      if (!nextMatch.home_team || !nextMatch.away_team) {
        toast({
          title: 'Error',
          description: 'You must first set the teams in the TerminBet section',
          variant: 'destructive',
        })
        return
      }

      const playerIds = Array.from(selectedMatchPlayers).map((key) => {
        const [playerId, teamType] = key.split('-')
        return {
          player_id: parseInt(playerId),
          team_type: teamType as 'home' | 'away',
        }
      })

      const response = await fetch('/api/next-match/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ player_ids: playerIds }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error saving players')
      }

      toast({
        title: 'Success!',
        description: 'Players saved',
      })

      fetchMatchPlayers()
      setShowMatchAnnouncementDialog(false)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNextMatch = async () => {
    setLoading(true)
    try {
      if (!nextMatch.home_team || !nextMatch.away_team) {
        toast({
          title: 'Error',
          description: 'You must select both teams',
          variant: 'destructive',
        })
        return
      }

      // Pripremi golove za slanje
      const goalsToSend = nextMatch.goals
        .filter((g) => g.player_id && g.goal_count)
        .flatMap((goal) => {
          // Kreiraj niz golova za svakog igrača (ako je goal_count > 1)
          const count = parseInt(goal.goal_count) || 1
          return Array(count).fill(null).map(() => ({
            player_id: parseInt(goal.player_id),
            team_type: goal.team_type,
          }))
        })

      // Pripremi dodatne kvote
      const totalGoalsOddsToSend = nextMatch.total_goals_odds
        .filter((item) => item.goals && item.odd)
        .map((item) => ({
          goals: parseInt(item.goals),
          odd: parseFloat(item.odd),
        }))

      const playerGoalsOddsToSend = nextMatch.player_goals_odds
        .filter((item) => item.player_id && item.goals && item.odd)
        .map((item) => ({
          player_id: parseInt(item.player_id),
          goals: parseInt(item.goals),
          odd: parseFloat(item.odd),
        }))

      const overUnderOddsToSend = nextMatch.over_under_odds
        .filter((item) => item.goals && (item.over_odd || item.under_odd))
        .map((item) => ({
          goals: parseFloat(item.goals),
          over_odd: item.over_odd ? parseFloat(item.over_odd) : null,
          under_odd: item.under_odd ? parseFloat(item.under_odd) : null,
        }))

      const response = await fetch('/api/next-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          home_team: nextMatch.home_team,
          away_team: nextMatch.away_team,
          match_date: nextMatch.match_date,
          odds_1: nextMatch.odds_1 ? parseFloat(nextMatch.odds_1) : null,
          odds_x: nextMatch.odds_x ? parseFloat(nextMatch.odds_x) : null,
          odds_2: nextMatch.odds_2 ? parseFloat(nextMatch.odds_2) : null,
          match_result: nextMatch.match_result || null,
          home_score: nextMatch.home_score ? parseInt(nextMatch.home_score) : null,
          away_score: nextMatch.away_score ? parseInt(nextMatch.away_score) : null,
          total_goals: nextMatch.total_goals ? parseInt(nextMatch.total_goals) : null,
          goals: goalsToSend.length > 0 ? goalsToSend : null,
          total_goals_odds: totalGoalsOddsToSend.length > 0 ? totalGoalsOddsToSend : null,
          player_goals_odds: playerGoalsOddsToSend.length > 0 ? playerGoalsOddsToSend : null,
          over_under_odds: overUnderOddsToSend.length > 0 ? overUnderOddsToSend : null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error saving next match')
      }

      toast({
        title: 'Success!',
        description: 'Next match saved',
      })

      fetchNextMatch()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this result?')) {
      return
    }

    try {
      const response = await fetch(`/api/results/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error deleting result')
      }

      toast({
        title: 'Success!',
        description: 'Result deleted',
      })

      fetchResults()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      })
    }
  }

  const handleEditResult = async (updatedResult: Result) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/results/${updatedResult.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          home_team: updatedResult.home_team,
          away_team: updatedResult.away_team,
          home_score: updatedResult.home_score,
          away_score: updatedResult.away_score,
          date: updatedResult.date,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error updating result')
      }

      toast({
        title: 'Success!',
        description: 'Result updated',
      })

      setEditingResult(null)
      setEditResultForm({
        home_team: '',
        away_team: '',
        home_score: '',
        away_score: '',
        date: '',
      })
      fetchResults()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditPlayer = async (updatedPlayer: Player) => {
    setLoading(true)
    try {
      let imageUrl = updatedPlayer.image_url

      // Ako je uploadovana nova slika, uploaduj je
      if (editPlayerImageFile) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', editPlayerImageFile)

        const uploadResponse = await fetch('/api/players/upload', {
          method: 'POST',
          body: uploadFormData,
          credentials: 'include',
        })

        let uploadData: any = null
        try {
          uploadData = await uploadResponse.json()
        } catch {
          uploadData = null
        }

        if (uploadResponse.status === 401) {
          throw new Error('Admin session expired. Please log in again.')
        }
        if (!uploadResponse.ok) {
          throw new Error(
            uploadData?.details || uploadData?.error || uploadData?.message || 'Error uploading image'
          )
        }
        if (!uploadData?.url) {
          throw new Error('Image URL was not returned from the server')
        }

        imageUrl = uploadData.url
      }

      const ratingBonusValue = parseInt(ratingBonus, 10)
      const finalRatingBonus = isNaN(ratingBonusValue) ? null : ratingBonusValue

      const ratingPayload = SHOW_PLAYER_RATINGS
        ? {
            pace: editPlayerRatings.pace || null,
            shooting: editPlayerRatings.shooting || null,
            passing: editPlayerRatings.passing || null,
            dribbling: editPlayerRatings.dribbling || null,
            defending: editPlayerRatings.defending || null,
            physical: editPlayerRatings.physical || null,
            stamina: editPlayerRatings.stamina || null,
            rating_bonus: finalRatingBonus,
          }
        : {
            pace: updatedPlayer.pace ?? null,
            shooting: updatedPlayer.shooting ?? null,
            passing: updatedPlayer.passing ?? null,
            dribbling: updatedPlayer.dribbling ?? null,
            defending: updatedPlayer.defending ?? null,
            physical: updatedPlayer.physical ?? null,
            stamina: updatedPlayer.stamina ?? null,
            rating_bonus: updatedPlayer.rating_bonus ?? null,
          }

      const response = await fetch(`/api/players/${updatedPlayer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: updatedPlayer.first_name,
          last_name: updatedPlayer.last_name,
          birth_year: updatedPlayer.birth_year,
          team: updatedPlayer.team || '',
          season_id: currentSeason?.id ?? null,
          image_url: imageUrl || '',
          price: updatedPlayer.price ?? null,
          ...ratingPayload,
          injury: editPlayerInjury,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error updating player')
      }

      toast({
        title: 'Success!',
        description: 'Player updated',
      })

      setEditingPlayer(null)
      setEditPlayerImageFile(null)
      fetchPlayers()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditTeam = async (updatedTeam: Team) => {
    setLoading(true)
    try {
      let logoUrl = updatedTeam.logo_url

      // Ako je uploadovana nova slika, uploaduj je
      if (editTeamLogoFile) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', editTeamLogoFile)

        const uploadResponse = await fetch('/api/teams/upload', {
          method: 'POST',
          body: uploadFormData,
          credentials: 'include',
        })

        let uploadData: any = null
        try {
          uploadData = await uploadResponse.json()
        } catch {
          uploadData = null
        }

        if (uploadResponse.status === 401) {
          throw new Error('Admin session expired. Please log in again.')
        }
        if (!uploadResponse.ok) {
          throw new Error(
            uploadData?.details || uploadData?.error || uploadData?.message || 'Error uploading image'
          )
        }
        if (!uploadData?.url) {
          throw new Error('Logo URL was not returned from the server')
        }

        logoUrl = uploadData.url
      }

      const response = await fetch(`/api/teams/${updatedTeam.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: updatedTeam.name,
          short_name: updatedTeam.short_name || '',
          logo_url: logoUrl,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error updating team')
      }

      toast({
        title: 'Success!',
        description: 'Team updated',
      })

      setEditingTeam(null)
      setEditTeamLogoFile(null)
      fetchTeams()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  // Osveži podatke kada se otvori TerminBet dijalog
  useEffect(() => {
    if (showTerminBetDialog) {
      fetchNextMatch()
      fetchPlayers()
    }
  }, [showTerminBetDialog])

  useEffect(() => {
    if (!isAuthenticated) return
    fetchPlayers()
    fetchTeams()
    fetchResults()
  }, [currentSeason?.id, isAuthenticated])

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[var(--fpl-p120)] flex items-center justify-center px-4">
        <Card className={`w-full max-w-md ${adminPanel}`}>
          <CardContent className="pt-6">
            <div className="text-center text-white/70 text-sm">Checking authentication...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--fpl-p120)] flex items-center justify-center px-4">
        <Card className={`w-full max-w-md ${adminPanel}`}>
          <CardHeader>
            <CardTitle className="text-white">Admin Login</CardTitle>
            <CardDescription className="text-white/50">
              Enter the password to access the admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="password" className="text-white/80">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !loading && handleLogin()}
                  placeholder="Enter password"
                  disabled={loading}
                  className="mt-1.5 bg-[var(--fpl-p90)] border-white/15 text-white placeholder:text-white/35"
                />
              </div>
              <Button onClick={handleLogin} className={`w-full ${adminPrimaryBtn}`} disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stats = {
    totalResults: results.length,
    latestResult: results[0] || null,
    todayResults: results.filter(r => {
      const today = new Date().toISOString().split('T')[0]
      return r.date === today
    }).length,
  }

  return (
    <div className="min-h-screen bg-[var(--fpl-p120)] py-4 sm:py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Admin Dashboard</h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="outline" className={`gap-2 w-full sm:w-auto ${adminOutlineBtn}`}>
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Main site</span>
                <span className="sm:hidden">Home</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={handleLogout}
              className={`gap-2 w-full sm:w-auto ${adminOutlineBtn}`}
            >
              <LogOut className="w-4 h-4" />
              Log out
            </Button>
          </div>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          {SHOW_TERMINBET && (
            <>
              <Button
                onClick={() => setShowTerminBetDialog(true)}
                className="w-full sm:w-auto relative overflow-hidden bg-[#280071] border-white/20"
                size="lg"
                variant="outline"
              >
                <div className="absolute top-0 left-0 w-[25%] h-full bg-amber-400 z-0"></div>
                <div className="absolute top-0 right-0 w-[25%] h-full bg-amber-400 z-0"></div>
                <span className='text-white text-2xl font-bold'>
                  TerminBet
                </span>
              </Button>
              <Button
                onClick={() => {
                  setShowMatchAnnouncementDialog(true)
                  fetchMatchPlayers()
                }}
                className={`w-full sm:w-auto ${adminPrimaryBtn}`}
                size="lg"
              >
                <Calendar className="w-5 h-5 mr-2" />
                MATCH ANNOUNCEMENT
              </Button>
            </>
          )}
          <Button
            onClick={() => {
              setShowFriendlyMatchDialog(true)
              setFriendlyStep('teams')
              setFriendlySelectedPlayers(new Set())
              setFriendlyGoals([])
              setFriendlyMatchForm({
                home_team: '',
                away_team: '',
                home_score: '',
                away_score: '',
                date: new Date().toISOString().split('T')[0],
              })
            }}
            className={`w-full sm:w-auto ${adminPrimaryBtn}`}
            size="lg"
          >
            FRIENDLY
          </Button>
        </div>

        {/* TerminBet Dialog */}
        <Dialog open={showTerminBetDialog} onOpenChange={setShowTerminBetDialog}>
          <DialogContent className={`${adminDialog} max-w-2xl h-[80vh] sm:h-[85vh] flex flex-col w-[95%] sm:w-full max-h-[90vh]`}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl text-white">
                TerminBet
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 sm:pr-2">
              {loadingNextMatch ? (
                <div className="text-center py-4 text-white/50">Loading...</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="next_home_team">Home team</Label>
                      {teams.length === 0 ? (
                        <div className="text-sm text-white/50 py-2">
                          No teams. Add teams first.
                        </div>
                      ) : (
                        <Select
                          value={nextMatch.home_team}
                          onValueChange={(value) =>
                            setNextMatch({ ...nextMatch, home_team: value })
                          }
                        >
                          <SelectTrigger id="next_home_team">
                            <SelectValue placeholder="Select team" />
                          </SelectTrigger>
                          <SelectContent>
                            {teams.map((team) => (
                              <SelectItem key={team.id} value={team.name}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="next_away_team">Away team</Label>
                      {teams.length === 0 ? (
                        <div className="text-sm text-white/50 py-2">
                          No teams. Add teams first.
                        </div>
                      ) : (
                        <Select
                          value={nextMatch.away_team}
                          onValueChange={(value) =>
                            setNextMatch({ ...nextMatch, away_team: value })
                          }
                        >
                          <SelectTrigger id="next_away_team">
                            <SelectValue placeholder="Select team" />
                          </SelectTrigger>
                          <SelectContent>
                            {teams.map((team) => (
                              <SelectItem key={team.id} value={team.name}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="next_match_date">Match date</Label>
                    <Input
                      id="next_match_date"
                      type="date"
                      value={nextMatch.match_date}
                      onChange={(e) =>
                        setNextMatch({ ...nextMatch, match_date: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold mb-3">Odds (1 X 2)</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="next_odds_1">
                            1 (Win {nextMatch.home_team || 'home team'})
                          </Label>
                          <Input
                            id="next_odds_1"
                            type="number"
                            step="0.01"
                            min="0"
                            value={nextMatch.odds_1}
                            onChange={(e) =>
                              setNextMatch({ ...nextMatch, odds_1: e.target.value })
                            }
                            placeholder="e.g. 7.75"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="next_odds_x">X (Draw)</Label>
                          <Input
                            id="next_odds_x"
                            type="number"
                            step="0.01"
                            min="0"
                            value={nextMatch.odds_x}
                            onChange={(e) =>
                              setNextMatch({ ...nextMatch, odds_x: e.target.value })
                            }
                            placeholder="e.g. 4.80"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="next_odds_2">
                            2 (Win {nextMatch.away_team || 'away team'})
                          </Label>
                          <Input
                            id="next_odds_2"
                            type="number"
                            step="0.01"
                            min="0"
                            value={nextMatch.odds_2}
                            onChange={(e) =>
                              setNextMatch({ ...nextMatch, odds_2: e.target.value })
                            }
                            placeholder="e.g. 1.40"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Broj golova na terminu */}
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-3">
                        <h3 className="text-sm sm:text-base font-semibold">Total goals on Termin</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setNextMatch({
                              ...nextMatch,
                              total_goals_odds: [
                                ...nextMatch.total_goals_odds,
                                { goals: '', odd: '' },
                              ],
                            })
                          }}
                          className={`w-full sm:w-auto ${adminOutlineBtn}`}>
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {nextMatch.total_goals_odds.map((item, index) => (
                          <div
                            key={index}
                            className="flex flex-col sm:flex-row gap-2 sm:items-end p-3 bg-[var(--fpl-p90)] border border-white/10 rounded-lg"
                          >
                            <div className="flex-1 space-y-2">
                              <Label className="text-xs">Number of goals</Label>
                              <Input
                                type="number"
                                min="0"
                                value={item.goals}
                                onChange={(e) => {
                                  const updated = [...nextMatch.total_goals_odds]
                                  updated[index].goals = e.target.value
                                  setNextMatch({ ...nextMatch, total_goals_odds: updated })
                                }}
                                placeholder="e.g. 2"
                              />
                            </div>
                            <div className="flex-1 space-y-2">
                              <Label className="text-xs">Odds</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.odd}
                                onChange={(e) => {
                                  const updated = [...nextMatch.total_goals_odds]
                                  updated[index].odd = e.target.value
                                  setNextMatch({ ...nextMatch, total_goals_odds: updated })
                                }}
                                placeholder="e.g. 3.50"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const updated = nextMatch.total_goals_odds.filter((_, i) => i !== index)
                                setNextMatch({ ...nextMatch, total_goals_odds: updated })
                              }}
                              className="w-full sm:w-auto sm:self-end"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        {nextMatch.total_goals_odds.length === 0 && (
                          <p className="text-sm text-white/50 text-center py-4">
                            No odds added. Click "Add" to add some.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Igrač sa termina i broj golova */}
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-3">
                        <h3 className="text-sm sm:text-base font-semibold">Player goals on Termin</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setNextMatch({
                              ...nextMatch,
                              player_goals_odds: [
                                ...nextMatch.player_goals_odds,
                                { player_id: '', goals: '', odd: '' },
                              ],
                            })
                          }}
                          className={`w-full sm:w-auto ${adminOutlineBtn}`}>
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {nextMatch.player_goals_odds.map((item, index) => {
                          const allPlayers = players.filter(
                            (p) => p.team === nextMatch.home_team || p.team === nextMatch.away_team
                          )
                          
                          // Pronađi trenutno izabranog igrača (može biti iz bilo kog tima)
                          const selectedPlayer = players.find(
                            (p) => p.id.toString() === item.player_id
                          )

                          return (
                            <div
                              key={index}
                              className="flex flex-col sm:flex-row gap-2 sm:items-end p-3 bg-[var(--fpl-p90)] border border-white/10 rounded-lg"
                            >
                              <div className="flex-1 space-y-2 min-w-0">
                                <Label className="text-xs">Player</Label>
                                <Select
                                  value={item.player_id}
                                  onValueChange={(value) => {
                                    const updated = [...nextMatch.player_goals_odds]
                                    updated[index].player_id = value
                                    setNextMatch({ ...nextMatch, player_goals_odds: updated })
                                  }}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select player" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {/* Ako je izabran igrač koji nije u allPlayers, dodaj ga na vrh liste */}
                                    {selectedPlayer && !allPlayers.find(p => p.id === selectedPlayer.id) && (
                                      <SelectItem key={selectedPlayer.id} value={selectedPlayer.id.toString()}>
                                        {selectedPlayer.first_name} {selectedPlayer.last_name} ({selectedPlayer.team})
                                      </SelectItem>
                                    )}
                                    {allPlayers.map((player) => (
                                      <SelectItem key={player.id} value={player.id.toString()}>
                                        {player.first_name} {player.last_name} ({player.team})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="w-full sm:w-24 space-y-2">
                                <Label className="text-xs">Number of goals</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={item.goals}
                                  onChange={(e) => {
                                    const updated = [...nextMatch.player_goals_odds]
                                    updated[index].goals = e.target.value
                                    setNextMatch({ ...nextMatch, player_goals_odds: updated })
                                  }}
                                  placeholder="e.g. 2"
                                  className="w-full"
                                />
                              </div>
                              <div className="flex-1 space-y-2 min-w-0">
                                <Label className="text-xs">Odds</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.odd}
                                  onChange={(e) => {
                                    const updated = [...nextMatch.player_goals_odds]
                                    updated[index].odd = e.target.value
                                    setNextMatch({ ...nextMatch, player_goals_odds: updated })
                                  }}
                                  placeholder="e.g. 4.20"
                                  className="w-full"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const updated = nextMatch.player_goals_odds.filter((_, i) => i !== index)
                                  setNextMatch({ ...nextMatch, player_goals_odds: updated })
                                }}
                                className="w-full sm:w-auto sm:self-end"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )
                        })}
                        {nextMatch.player_goals_odds.length === 0 && (
                          <p className="text-sm text-white/50 text-center py-4">
                            No odds added. Click "Add" to add some.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Preko/Ispod broj golova */}
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-3">
                        <h3 className="text-sm sm:text-base font-semibold">Over/Under goals</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setNextMatch({
                              ...nextMatch,
                              over_under_odds: [
                                ...nextMatch.over_under_odds,
                                { goals: '', over_odd: '', under_odd: '' },
                              ],
                            })
                          }}
                          className={`w-full sm:w-auto ${adminOutlineBtn}`}>
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {nextMatch.over_under_odds.map((item, index) => (
                          <div
                            key={index}
                            className="flex flex-col sm:flex-row gap-2 sm:items-end p-3 bg-[var(--fpl-p90)] border border-white/10 rounded-lg"
                          >
                            <div className="w-full sm:w-24 space-y-2">
                              <Label className="text-xs">Number of goals</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.5"
                                value={item.goals}
                                onChange={(e) => {
                                  const updated = [...nextMatch.over_under_odds]
                                  updated[index].goals = e.target.value
                                  setNextMatch({ ...nextMatch, over_under_odds: updated })
                                }}
                                placeholder="e.g. 2.5"
                                className="w-full"
                              />
                            </div>
                            <div className="flex-1 space-y-2 min-w-0">
                              <Label className="text-xs">Over odds</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.over_odd}
                                onChange={(e) => {
                                  const updated = [...nextMatch.over_under_odds]
                                  updated[index].over_odd = e.target.value
                                  setNextMatch({ ...nextMatch, over_under_odds: updated })
                                }}
                                placeholder="e.g. 1.85"
                                className="w-full"
                              />
                            </div>
                            <div className="flex-1 space-y-2 min-w-0">
                              <Label className="text-xs">Under odds</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.under_odd}
                                onChange={(e) => {
                                  const updated = [...nextMatch.over_under_odds]
                                  updated[index].under_odd = e.target.value
                                  setNextMatch({ ...nextMatch, over_under_odds: updated })
                                }}
                                placeholder="e.g. 1.95"
                                className="w-full"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const updated = nextMatch.over_under_odds.filter((_, i) => i !== index)
                                setNextMatch({ ...nextMatch, over_under_odds: updated })
                              }}
                              className="w-full sm:w-auto sm:self-end"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        {nextMatch.over_under_odds.length === 0 && (
                          <p className="text-sm text-white/50 text-center py-4">
                            No odds added. Click "Add" to add some.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowTerminBetDialog(false)}
               className={adminOutlineBtn}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  await handleSaveNextMatch()
                  setShowTerminBetDialog(false)
                }}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Friendly Match Dialog */}
        <Dialog
          open={showFriendlyMatchDialog}
          onOpenChange={(open) => {
            setShowFriendlyMatchDialog(open)
            if (!open) {
              setFriendlyStep('teams')
              setFriendlySelectedPlayers(new Set())
              setFriendlyGoals([])
            }
          }}
        >
          <DialogContent className={`${adminDialog} max-w-md w-[95%] sm:w-full`}>
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg md:text-xl text-white">
                Add friendly match
              </DialogTitle>
              <DialogDescription className="text-white/50">
                Enter teams, select players, and add a result for the friendly match. Teams are entered manually and do not need to exist in the teams list.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Step indicator */}
              <div className="flex items-center justify-center gap-2 text-xs sm:text-sm mb-2">
                <span className={friendlyStep === 'teams' ? 'font-semibold' : 'text-white/50'}>
                  1. Teams
                </span>
                <span>›</span>
                <span className={friendlyStep === 'players' ? 'font-semibold' : 'text-white/50'}>
                  2. Players
                </span>
                <span>›</span>
                <span className={friendlyStep === 'results' ? 'font-semibold' : 'text-white/50'}>
                  3. Result
                </span>
              </div>

              {/* Step 1: Teams */}
              {friendlyStep === 'teams' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="friendly_home_team">Home team</Label>
                      <Input
                        id="friendly_home_team"
                        placeholder="Enter team name"
                        value={friendlyMatchForm.home_team}
                        onChange={(e) =>
                          setFriendlyMatchForm({ ...friendlyMatchForm, home_team: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="friendly_away_team">Away team</Label>
                      <Input
                        id="friendly_away_team"
                        placeholder="Enter team name"
                        value={friendlyMatchForm.away_team}
                        onChange={(e) =>
                          setFriendlyMatchForm({ ...friendlyMatchForm, away_team: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="friendly_date">Date</Label>
                    <Input
                      id="friendly_date"
                      type="date"
                      value={friendlyMatchForm.date}
                      onChange={(e) =>
                        setFriendlyMatchForm({ ...friendlyMatchForm, date: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Players */}
              {friendlyStep === 'players' && (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  <p className="text-xs text-white/50">
                    Select which existing players go into the home and away team. A player can only be on one team.
                  </p>
                  <div className="space-y-2">
                    {players.length === 0 ? (
                      <p className="text-sm text-white/50 text-center py-4">
                        No players in the database.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {players.map((player) => (
                          <div
                            key={player.id}
                            className="flex items-center justify-between p-2 border border-white/10 rounded-lg text-xs sm:text-sm"
                          >
                            <div className="flex-1 truncate mr-2">
                              {player.first_name} {player.last_name}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant={isFriendlyPlayerSelected(player.id.toString(), 'home') ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => toggleFriendlyPlayerSelection(player.id.toString(), 'home')}
                                className={isFriendlyPlayerSelected(player.id.toString(), 'home') ? adminPrimaryBtn : adminOutlineBtn}
                              >
                                Home
                              </Button>
                              <Button
                                type="button"
                                variant={isFriendlyPlayerSelected(player.id.toString(), 'away') ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => toggleFriendlyPlayerSelection(player.id.toString(), 'away')}
                                className={isFriendlyPlayerSelected(player.id.toString(), 'away') ? adminPrimaryBtn : adminOutlineBtn}
                              >
                                Away
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Results and goals */}
              {friendlyStep === 'results' && (
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="friendly_home_score">Home team goals</Label>
                      <Input
                        id="friendly_home_score"
                        type="number"
                        min="0"
                        value={friendlyMatchForm.home_score}
                        onChange={(e) =>
                          setFriendlyMatchForm({ ...friendlyMatchForm, home_score: e.target.value })
                        }
                        placeholder="e.g. 3"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="friendly_away_score">Away team goals</Label>
                      <Input
                        id="friendly_away_score"
                        type="number"
                        min="0"
                        value={friendlyMatchForm.away_score}
                        onChange={(e) =>
                          setFriendlyMatchForm({ ...friendlyMatchForm, away_score: e.target.value })
                        }
                        placeholder="e.g. 2"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs text-white/50">
                      Click a player to add a goal for their team. Click again to add another goal; use the trash icon to remove the last goal.
                    </p>

                    {getFriendlySelectedPlayers().length === 0 ? (
                      <p className="text-sm text-white/50 text-center py-4">
                        First select players in the previous step.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {/* Home team scorers */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">
                            {friendlyMatchForm.home_team || 'Home team'}
                          </h4>
                          <div className="space-y-2">
                            {getFriendlySelectedPlayers()
                              .filter((p) => p.team_type === 'home')
                              .map((matchPlayer) => {
                                const player = players.find(
                                  (pl) => pl.id.toString() === matchPlayer.player_id
                                )
                                if (!player) return null
                                const goalCount = friendlyGoals.filter(
                                  (g) =>
                                    g.player_id === matchPlayer.player_id &&
                                    g.team_type === 'home'
                                ).length
                                return (
                                  <div
                                    key={matchPlayer.id}
                                    className={`flex items-center justify-between p-2 border border-white/10 rounded-lg text-xs sm:text-sm ${
                                      goalCount > 0 ? 'bg-primary/10 border-primary' : ''
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      className="flex-1 text-left"
                                      onClick={() => {
                                        const newGoal: FriendlyGoal = {
                                          id: Date.now().toString(),
                                          player_id: matchPlayer.player_id,
                                          team_type: 'home',
                                        }
                                        setFriendlyGoals([...friendlyGoals, newGoal])
                                      }}
                                    >
                                      {player.first_name} {player.last_name}
                                    </button>
                                    <div className="flex items-center gap-2">
                                      {goalCount > 0 && (
                                        <>
                                          <span className="font-bold min-w-[1.5rem] text-center">
                                            {goalCount}
                                          </span>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                              const goalToRemove = friendlyGoals
                                                .filter(
                                                  (g) =>
                                                    g.player_id === matchPlayer.player_id &&
                                                    g.team_type === 'home'
                                                )
                                                .pop()
                                              if (goalToRemove) {
                                                setFriendlyGoals(
                                                  friendlyGoals.filter((g) => g.id !== goalToRemove.id)
                                                )
                                              }
                                            }}
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                          </div>
                        </div>

                        {/* Away team scorers */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">
                            {friendlyMatchForm.away_team || 'Away team'}
                          </h4>
                          <div className="space-y-2">
                            {getFriendlySelectedPlayers()
                              .filter((p) => p.team_type === 'away')
                              .map((matchPlayer) => {
                                const player = players.find(
                                  (pl) => pl.id.toString() === matchPlayer.player_id
                                )
                                if (!player) return null
                                const goalCount = friendlyGoals.filter(
                                  (g) =>
                                    g.player_id === matchPlayer.player_id &&
                                    g.team_type === 'away'
                                ).length
                                return (
                                  <div
                                    key={matchPlayer.id}
                                    className={`flex items-center justify-between p-2 border border-white/10 rounded-lg text-xs sm:text-sm ${
                                      goalCount > 0 ? 'bg-primary/10 border-primary' : ''
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      className="flex-1 text-left"
                                      onClick={() => {
                                        const newGoal: FriendlyGoal = {
                                          id: Date.now().toString(),
                                          player_id: matchPlayer.player_id,
                                          team_type: 'away',
                                        }
                                        setFriendlyGoals([...friendlyGoals, newGoal])
                                      }}
                                    >
                                      {player.first_name} {player.last_name}
                                    </button>
                                    <div className="flex items-center gap-2">
                                      {goalCount > 0 && (
                                        <>
                                          <span className="font-bold min-w-[1.5rem] text-center">
                                            {goalCount}
                                          </span>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                              const goalToRemove = friendlyGoals
                                                .filter(
                                                  (g) =>
                                                    g.player_id === matchPlayer.player_id &&
                                                    g.team_type === 'away'
                                                )
                                                .pop()
                                              if (goalToRemove) {
                                                setFriendlyGoals(
                                                  friendlyGoals.filter((g) => g.id !== goalToRemove.id)
                                                )
                                              }
                                            }}
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={() => setShowFriendlyMatchDialog(false)}
                disabled={loading}
               className={adminOutlineBtn}>
                Cancel
              </Button>
              <div className="flex-1 flex justify-end gap-2">
                {friendlyStep !== 'teams' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (friendlyStep === 'players') setFriendlyStep('teams')
                      else if (friendlyStep === 'results') setFriendlyStep('players')
                    }}
                    disabled={loading}
                   className={adminOutlineBtn}>
                    Back
                  </Button>
                )}
                {friendlyStep !== 'results' && (
                  <Button
                    type="button"
                    onClick={() => {
                      if (friendlyStep === 'teams') {
                        if (!friendlyMatchForm.home_team || !friendlyMatchForm.away_team) {
                          toast({
                            title: 'Error',
                            description: 'You must enter both teams',
                            variant: 'destructive',
                          })
                          return
                        }
                        if (friendlyMatchForm.home_team === friendlyMatchForm.away_team) {
                          toast({
                            title: 'Error',
                            description: 'Teams cannot be the same',
                            variant: 'destructive',
                          })
                          return
                        }
                        if (!friendlyMatchForm.date) {
                          toast({
                            title: 'Error',
                            description: 'You must enter a date',
                            variant: 'destructive',
                          })
                          return
                        }
                        setFriendlyStep('players')
                      } else if (friendlyStep === 'players') {
                        if (getFriendlySelectedPlayers().length === 0) {
                          toast({
                            title: 'Error',
                            description: 'You must select at least one player',
                            variant: 'destructive',
                          })
                          return
                        }
                        setFriendlyStep('results')
                      }
                    }}
                    disabled={loading}
                  >
                    Next step
                  </Button>
                )}
                {friendlyStep === 'results' && (
                  <Button
                    type="button"
                    onClick={async () => {
                      if (!friendlyMatchForm.home_score || !friendlyMatchForm.away_score) {
                        toast({
                          title: 'Error',
                          description: 'You must enter the result',
                          variant: 'destructive',
                        })
                        return
                      }

                      const selectedPlayers = getFriendlySelectedPlayers()

                      // Validacija golova vs rezultata
                      const homeGoals = friendlyGoals.filter((g) => g.team_type === 'home').length
                      const awayGoals = friendlyGoals.filter((g) => g.team_type === 'away').length
                      const homeScore = parseInt(friendlyMatchForm.home_score)
                      const awayScore = parseInt(friendlyMatchForm.away_score)

                      if (
                        (homeGoals > 0 && homeGoals !== homeScore) ||
                        (awayGoals > 0 && awayGoals !== awayScore)
                      ) {
                        const confirmMismatch = window.confirm(
                          `Number of entered goals (${homeGoals}:${awayGoals}) does not match the result (${homeScore}:${awayScore}). Do you want to continue?`
                        )
                        if (!confirmMismatch) {
                          return
                        }
                      }

                      setLoading(true)
                      try {
                        const response = await fetch('/api/results', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            home_team: friendlyMatchForm.home_team,
                            away_team: friendlyMatchForm.away_team,
                            home_score: homeScore,
                            away_score: awayScore,
                            date: friendlyMatchForm.date,
                            goals: friendlyGoals.map((g) => ({
                              player_id: parseInt(g.player_id),
                              team_type: g.team_type,
                              goal_minute: null,
                            })),
                            players: selectedPlayers.map((p) => ({
                              player_id: parseInt(p.player_id),
                              team_type: p.team_type,
                            })),
                          }),
                        })

                        if (!response.ok) {
                          const error = await response.json().catch(() => ({}))
                          throw new Error(error.error || 'Error adding friendly match')
                        }

                        toast({
                          title: 'Success!',
                          description: 'Friendly match added',
                        })

                        setFriendlyMatchForm({
                          home_team: '',
                          away_team: '',
                          home_score: '',
                          away_score: '',
                          date: new Date().toISOString().split('T')[0],
                        })
                        setFriendlySelectedPlayers(new Set())
                        setFriendlyGoals([])
                        setFriendlyStep('teams')
                        setShowFriendlyMatchDialog(false)
                        fetchResults()
                      } catch (error: any) {
                        toast({
                          title: 'Error',
                          description: error.message || 'Something went wrong',
                          variant: 'destructive',
                        })
                      } finally {
                        setLoading(false)
                      }
                    }}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save match'}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Match Announcement Dialog */}
        <Dialog open={showMatchAnnouncementDialog} onOpenChange={setShowMatchAnnouncementDialog}>
          <DialogContent className={`${adminDialog} max-w-4xl h-[80vh] sm:h-[85vh] flex flex-col w-[95%] sm:w-full max-h-[90vh]`}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl text-white">
                <Calendar className="w-5 h-5" />
                MATCH ANNOUNCEMENT
              </DialogTitle>
              <DialogDescription className="text-white/50">
                Select the players who will play in the next match
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-6 pr-1 sm:pr-2">
              {loadingMatchPlayers ? (
                <div className="text-center py-4 text-white/50">Loading...</div>
              ) : !nextMatch.home_team || !nextMatch.away_team ? (
                <div className="text-center py-8 text-white/50">
                  <p className="mb-2">You must first set the teams in the TerminBet section</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowMatchAnnouncementDialog(false)
                      setShowTerminBetDialog(true)
                    }}
                   className={adminOutlineBtn}>
                    Open TerminBet
                  </Button>
                </div>
              ) : (
                <>
                  {/* Home Team Players */}
                  <div className="space-y-3">
                    <h3 className="text-base sm:text-lg font-semibold">
                      {nextMatch.home_team}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {players
                        .filter((p) => p.team === nextMatch.home_team)
                        .map((player) => (
                          <div
                            key={player.id}
                            className={`flex flex-col items-center p-3 border border-white/10 rounded-lg cursor-pointer transition-colors ${
                              isMatchPlayerSelected(player.id.toString(), 'home')
                                ? 'bg-primary/10 border-primary'
                                : 'hover:bg-white/5'
                            }`}
                            onClick={() => toggleMatchPlayerSelection(player.id.toString(), 'home')}
                          >
                            <div className="relative w-20 h-24 rounded-b-2xl overflow-hidden mb-2">
                              <Image
                                src={getPlayerImageUrl(player.image_url)}
                                alt={`${player.first_name} ${player.last_name}`}
                                fill
                                className="object-cover"
                                unoptimized
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = '/no-image-player.png'
                                }}
                              />
                            </div>
                            <div className="text-center">
                              <div className="text-xs sm:text-sm font-medium truncate w-full">
                                {player.first_name} {player.last_name}
                              </div>
                            </div>
                            <Checkbox
                              checked={isMatchPlayerSelected(player.id.toString(), 'home')}
                              onCheckedChange={() => toggleMatchPlayerSelection(player.id.toString(), 'home')}
                              className="mt-2"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        ))}
                    </div>
                    {players.filter((p) => p.team === nextMatch.home_team).length === 0 && (
                      <p className="text-sm text-white/50 text-center py-4">
                        No players on this team
                      </p>
                    )}
                  </div>

                  {/* Away Team Players */}
                  <div className="space-y-3">
                    <h3 className="text-base sm:text-lg font-semibold">
                      {nextMatch.away_team}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {players
                        .filter((p) => p.team === nextMatch.away_team)
                        .map((player) => (
                          <div
                            key={player.id}
                            className={`flex flex-col items-center p-3 border border-white/10 rounded-lg cursor-pointer transition-colors ${
                              isMatchPlayerSelected(player.id.toString(), 'away')
                                ? 'bg-primary/10 border-primary'
                                : 'hover:bg-white/5'
                            }`}
                            onClick={() => toggleMatchPlayerSelection(player.id.toString(), 'away')}
                          >
                            <div className="relative w-20 h-24 rounded-b-2xl overflow-hidden mb-2">
                              <Image
                                src={getPlayerImageUrl(player.image_url)}
                                alt={`${player.first_name} ${player.last_name}`}
                                fill
                                className="object-cover"
                                unoptimized
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = '/no-image-player.png'
                                }}
                              />
                            </div>
                            <div className="text-center">
                              <div className="text-xs sm:text-sm font-medium truncate w-full">
                                {player.first_name} {player.last_name}
                              </div>
                            </div>
                            <Checkbox
                              checked={isMatchPlayerSelected(player.id.toString(), 'away')}
                              onCheckedChange={() => toggleMatchPlayerSelection(player.id.toString(), 'away')}
                              className="mt-2"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        ))}
                    </div>
                    {players.filter((p) => p.team === nextMatch.away_team).length === 0 && (
                      <p className="text-sm text-white/50 text-center py-4">
                        No players on this team
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowMatchAnnouncementDialog(false)}
               className={adminOutlineBtn}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveMatchPlayers}
                disabled={loading || !nextMatch.home_team || !nextMatch.away_team}
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Statistics Cards */}
        <div className="flex flex-col gap-4">
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
            <Card className={`p-4 sm:p-6 ${adminPanel}`}>
              <CardHeader className="flex flex-col items-center justify-center space-y-0 pb-3 px-0">
                <Trophy className="h-5 w-5 text-[var(--fpl-green)] mb-2" />
                <CardTitle className="text-sm font-medium text-center text-white/50">
                  Total results
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="text-3xl font-bold text-center text-white">{stats.totalResults}</div>
              </CardContent>
            </Card>

            {/* Sezone */}
            <Card className={`p-4 sm:p-6 ${adminPanel}`}>
              <CardHeader className="flex flex-col items-center justify-center space-y-0 pb-3 px-0">
                <Calendar className="h-5 w-5 text-[var(--fpl-cyan)] mb-2" />
                <CardTitle className="text-sm font-medium text-center text-white/50">
                  Seasons
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0 space-y-3">
                <div className="text-sm text-center text-white">
                  {loadingSeasons ? (
                    <span className="text-white/50">Loading...</span>
                  ) : seasons.length === 0 ? (
                    <span className="text-white/50">No seasons</span>
                  ) : (
                    <span className="font-semibold">
                      Active: {currentSeason ? currentSeason.name : seasons[0].name}
                    </span>
                  )}
                </div>
                <form
                  className="flex flex-col gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault()
                    if (!newSeasonName.trim()) {
                      toast({
                        title: 'Error',
                        description: 'Enter a season name',
                        variant: 'destructive',
                      })
                      return
                    }
                    setLoading(true)
                    try {
                      const response = await fetch('/api/seasons', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ name: newSeasonName.trim() }),
                      })
                      if (!response.ok) {
                        const error = await response.json()
                        throw new Error(error.error || 'Error creating season')
                      }
                      setNewSeasonName('')
                      await fetchSeasons()
                      toast({
                        title: 'Success',
                        description: 'Season created',
                      })
                    } catch (error: any) {
                      toast({
                        title: 'Error',
                        description: error.message || 'Something went wrong',
                        variant: 'destructive',
                      })
                    } finally {
                      setLoading(false)
                    }
                  }}
                >
                  <Input
                    placeholder="Season name (e.g. 2024/25)"
                    value={newSeasonName}
                    onChange={(e) => setNewSeasonName(e.target.value)}
                    className="bg-[var(--fpl-p90)] border-white/15 text-white placeholder:text-white/35"
                  />
                  <Button type="submit" size="sm" disabled={loading} className={adminPrimaryBtn}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add season
                  </Button>
                </form>
                {seasons.length > 0 && (
                  <div className="max-h-32 overflow-y-auto text-xs space-y-1 mt-2">
                    {seasons.map((season) => (
                      <div
                        key={season.id}
                        className="flex items-center justify-between gap-2 px-2 py-1 rounded-md bg-white/5"
                      >
                        <button
                          type="button"
                          className={`text-left flex-1 truncate text-white/80 ${
                            currentSeason?.id === season.id ? 'font-semibold text-white' : ''
                          }`}
                          onClick={() => setCurrentSeasonId(season.id)}
                        >
                          {season.name}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className={`p-4 sm:p-6 ${adminPanel}`}>
              <CardHeader className="flex flex-col items-center justify-center space-y-0 pb-3 px-0">
                <Users className="h-5 w-5 text-[var(--fpl-lilac)] mb-2" />
                <CardTitle className="text-sm font-medium text-center text-white/50">
                  Number of teams
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="text-3xl font-bold text-center text-white">{teams.length}</div>
              </CardContent>
            </Card>

            <Card className={`p-4 sm:p-6 ${adminPanel}`}>
              <CardHeader className="flex flex-col items-center justify-center space-y-0 pb-3 px-0">
                <Users className="h-5 w-5 text-[var(--fpl-green)] mb-2" />
                <CardTitle className="text-sm font-medium text-center text-white/50">
                  Number of players
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="text-3xl font-bold text-center text-white">{players.length}</div>
              </CardContent>
            </Card>

            <Card className={`p-4 sm:p-6 ${adminPanel}`}>
              <CardHeader className="flex flex-col items-center justify-center space-y-0 pb-3 px-0">
                <Calendar className="h-5 w-5 text-[var(--fpl-pink)] mb-2" />
                <CardTitle className="text-sm font-medium text-center text-white/50">
                  Today's results
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="text-3xl font-bold text-center text-white">{stats.todayResults}</div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className={`p-4 sm:p-6 ${adminPanel}`}>
              <CardHeader className="flex flex-col items-center justify-center space-y-0 pb-3 px-0">
                <CardTitle className="text-sm font-medium text-center text-white/50">
                  Latest result
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                {stats.latestResult ? (
                  <div className="text-center space-y-2">
                    <div className="text-lg font-semibold text-white">
                      {stats.latestResult.home_team} vs {stats.latestResult.away_team}
                    </div>
                    <div className="text-2xl font-bold text-[var(--fpl-green)]">
                      {stats.latestResult.home_score} - {stats.latestResult.away_score}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-white/50 text-center">No results</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <FantasyAdminPanel
          seasonId={currentSeason?.id ?? null}
          players={players.map((p) => ({
            id: p.id,
            first_name: p.first_name,
            last_name: p.last_name,
          }))}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add Result Card */}
          <Card className={adminPanel}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-white">
                <Plus className="w-5 h-5" />
                Add new match
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/admin/match/new">
                <Button className={`w-full ${adminPrimaryBtn}`} size="lg">
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Add new match</span>
                  <span className="sm:hidden">Add match</span>
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Results List */}
          <Card className={adminPanel}>
            <CardHeader>
              <CardTitle className="text-white">All results</CardTitle>
              <CardDescription className="text-white/50">
                {loadingResults ? 'Loading...' : `${results.length} results`}
              </CardDescription>
            </CardHeader>
            <CardContent className='px-2 sm:px-6'>
              {loadingResults ? (
                <div className="text-center py-8 text-white/50">
                  Loading results...
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-8 text-white/50">
                  No results. Add the first result!
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {results.map((result) => (
                    <div
                      key={result.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border border-white/10 rounded-xl hover:bg-white/5 transition gap-3"
                    >
                      <div className="flex-1 min-w-0 w-full sm:w-auto">
                        <div className="font-semibold text-sm sm:text-base truncate text-center sm:text-left text-white">
                          {result.home_team} vs {result.away_team}
                        </div>
                        <div className="text-xs sm:text-sm text-white/50 mt-1 justify-center flex flex-col items-center">
                          <span className="font-bold text-xl">{result.home_score} - {result.away_score}</span>
                          <span className="mx-2">•</span>
                          {format(new Date(result.date), 'dd MMM yyyy')}
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingResult(result)
                            setEditResultForm({
                              home_team: result.home_team,
                              away_team: result.away_team,
                              home_score: String(result.home_score),
                              away_score: String(result.away_score),
                              date: result.date,
                            })
                          }}
                          className="text-[var(--fpl-cyan)] hover:text-[var(--fpl-cyan)]/80 flex-shrink-0"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(result.id)}
                          className="text-destructive hover:text-destructive flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Players Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add Player Form */}
          <Card className={adminPanel}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <UserPlus className="w-5 h-5" />
                Add player
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  setLoading(true)
                  try {
                    let imageUrl: string | null = null

                    // Upload slike ako je izabrana
                    if (playerImageFile) {
                      const uploadFormData = new FormData()
                      uploadFormData.append('file', playerImageFile)

                      try {
                        const uploadResponse = await fetch('/api/players/upload', {
                          method: 'POST',
                          body: uploadFormData,
                          credentials: 'include',
                        })

                        let uploadData: any = null
                        try {
                          uploadData = await uploadResponse.json()
                        } catch {
                          uploadData = null
                        }

                        if (uploadResponse.status === 401) {
                          throw new Error('Admin session expired. Please log in again.')
                        }
                        if (!uploadResponse.ok) {
                          throw new Error(
                            uploadData?.details ||
                              uploadData?.error ||
                              uploadData?.message ||
                              'Error uploading image'
                          )
                        }
                        if (!uploadData?.url) {
                          throw new Error('Image URL was not returned from the server')
                        }
                        imageUrl = uploadData.url
                      } catch (uploadError: any) {
                        console.error('Upload error details:', uploadError)
                        throw new Error(uploadError.message || 'Error uploading image')
                      }
                    }

                    const response = await fetch('/api/players', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        ...playerForm,
                        season_id: currentSeason?.id ?? null,
                        image_url: imageUrl || playerForm.image_url || null,
                      }),
                    })

                    if (!response.ok) {
                      const error = await response.json()
                      throw new Error(error.error || 'Error adding player')
                    }

                    toast({
                      title: 'Success!',
                      description: 'Player added',
                    })

                    setPlayerForm({
                      first_name: '',
                      last_name: '',
                      birth_year: '',
                      team: '',
                      image_url: '',
                      price: '',
                    })
                    setPlayerImageFile(null)
                    // Reset file input
                    const fileInput = document.getElementById('player_image') as HTMLInputElement
                    if (fileInput) {
                      fileInput.value = ''
                    }
                    fetchPlayers()
                  } catch (error: any) {
                    toast({
                      title: 'Error',
                      description: error.message || 'Something went wrong',
                      variant: 'destructive',
                    })
                  } finally {
                    setLoading(false)
                  }
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First name</Label>
                    <Input
                      id="first_name"
                      value={playerForm.first_name}
                      onChange={(e) => setPlayerForm({ ...playerForm, first_name: e.target.value })}
                      placeholder="e.g. Luka"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last name</Label>
                    <Input
                      id="last_name"
                      value={playerForm.last_name}
                      onChange={(e) => setPlayerForm({ ...playerForm, last_name: e.target.value })}
                      placeholder="e.g. Modrić"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="team">Team</Label>
                    {teams.length === 0 ? (
                      <div className="text-sm text-white/50 py-2">
                        No teams. Add teams first.
                      </div>
                    ) : (
                      <Select
                        value={playerForm.team || 'none'}
                        onValueChange={(value) =>
                          setPlayerForm({ ...playerForm, team: value === 'none' ? '' : value })
                        }
                      >
                        <SelectTrigger id="team" className="w-full">
                          <SelectValue placeholder="Select team (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No team</SelectItem>
                          {teams.map((team) => (
                            <SelectItem key={team.id} value={team.name}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="player_image">Player image</Label>
                    <Input
                      id="player_image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        setPlayerImageFile(file)
                      }}
                    />
                    <p className="text-xs text-white/50 mt-1">
                      Recommended: square image (e.g. 512x512), PNG or JPG
                    </p>
                    {playerImageFile && (
                      <p className="text-xs text-[var(--fpl-green)] mt-1">
                        Selected image: {playerImageFile.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="birth_year">Year of birth</Label>
                    <Input
                      id="birth_year"
                      type="number"
                      min="1900"
                      max={new Date().getFullYear()}
                      value={playerForm.birth_year}
                      onChange={(e) => setPlayerForm({ ...playerForm, birth_year: e.target.value })}
                      placeholder="e.g. 1985"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Fantasy price (£m)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      max="99.9"
                      step="0.1"
                      value={playerForm.price}
                      onChange={(e) => setPlayerForm({ ...playerForm, price: e.target.value })}
                      placeholder="e.g. 5.5"
                    />
                  </div>
                </div>

                <Button type="submit" className={`w-full ${adminPrimaryBtn}`} disabled={loading}>
                  {loading ? 'Adding...' : 'Add player'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Players List */}
          <Card className={adminPanel}>
            <CardHeader>
              <CardTitle className="text-white">All players</CardTitle>
              <CardDescription className="text-white/50">
                {loadingPlayers ? 'Loading...' : `${players.length} players`}
              </CardDescription>
            </CardHeader>
            <CardContent className='px-2 sm:px-6'>
              {loadingPlayers ? (
                <div className="text-center py-8 text-white/50">Loading players...</div>
              ) : players.length === 0 ? (
                <div className="text-center py-8 text-white/50">
                  No players. Add the first player!
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border border-white/10 rounded-xl hover:bg-white/5 transition gap-3"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0 w-full sm:w-auto justify-center sm:justify-start">
                        <div className="relative w-20 h-[100px] rounded-b-2xl overflow-hidden flex">
                          <Image
                            src={getPlayerImageUrl(player.image_url)}
                            alt={`${player.first_name} ${player.last_name}`}
                            fill
                            className="object-cover"
                            unoptimized
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = '/no-image-player.png'
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-1 text-center sm:text-left">
                          <div className="font-semibold text-sm sm:text-base truncate text-white">
                            {player.first_name} {player.last_name}
                            {player.team && (
                              <span className="text-xs text-white/50 ml-2">
                                ({player.team})
                              </span>
                            )}
                          </div>
                          <div className="text-xs sm:text-sm text-white/50">
                            Year of birth: {player.birth_year}
                            {player.price != null && (
                              <span className="ml-2 text-[var(--fpl-green)] font-semibold">
                                £{Number(player.price)}m
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingPlayer(player)
                            setEditPlayerTeam(player.team || 'none')
                            setEditPlayerInjury(player.injury || false)
                            setEditPlayerRatings({
                              pace: player.pace?.toString() || '',
                              shooting: player.shooting?.toString() || '',
                              passing: player.passing?.toString() || '',
                              dribbling: player.dribbling?.toString() || '',
                              defending: player.defending?.toString() || '',
                              physical: player.physical?.toString() || '',
                              stamina: player.stamina?.toString() || '',
                            })
                            setRatingBonus(player.rating_bonus?.toString() || '0')
                          }}
                          className="text-[var(--fpl-cyan)] hover:text-[var(--fpl-cyan)]/80 flex-shrink-0"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            if (!confirm('Are you sure you want to delete this player?')) {
                              return
                            }
                            try {
                              const response = await fetch(`/api/players/${player.id}`, {
                                method: 'DELETE',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({}),
                              })

                              if (!response.ok) {
                                const error = await response.json()
                                throw new Error(error.error || 'Error deleting player')
                              }

                              toast({
                                title: 'Success!',
                                description: 'Player deleted',
                              })
                              fetchPlayers()
                            } catch (error: any) {
                              toast({
                                title: 'Error',
                                description: error.message || 'Something went wrong',
                                variant: 'destructive',
                              })
                            }
                          }}
                          className="text-destructive hover:text-destructive flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Teams Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add/Edit Team Form */}
          <Card className={adminPanel}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Plus className="w-5 h-5" />
                Add/Edit team
              </CardTitle>
              <CardDescription className="text-white/50">Add a new club for the active season or update an existing one</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  setLoading(true)

                  try {
                    let logoUrl: string | null = null

                    if (teamLogoFile) {
                      const uploadFormData = new FormData()
                      uploadFormData.append('file', teamLogoFile)

                      try {
                        const uploadResponse = await fetch('/api/teams/upload', {
                          method: 'POST',
                          body: uploadFormData,
                          credentials: 'include',
                        })

                        let uploadData: any = null
                        try {
                          uploadData = await uploadResponse.json()
                        } catch {
                          uploadData = null
                        }

                        if (uploadResponse.status === 401) {
                          throw new Error('Admin session expired. Please log in again.')
                        }
                        if (!uploadResponse.ok) {
                          throw new Error(
                            uploadData?.details ||
                              uploadData?.error ||
                              uploadData?.message ||
                              'Error uploading logo'
                          )
                        }
                        if (!uploadData?.url) {
                          throw new Error('Logo URL was not returned from the server')
                        }
                        logoUrl = uploadData.url
                      } catch (uploadError: any) {
                        console.error('Upload error details:', uploadError)
                        throw new Error(uploadError.message || 'Error uploading logo')
                      }
                    }

                    const response = await fetch('/api/teams', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        name: teamForm.name,
                        short_name: teamForm.short_name,
                        logo_url: logoUrl,
                        season_id: currentSeason?.id ?? null,
                      }),
                    })

                    if (!response.ok) {
                      const error = await response.json()
                      throw new Error(error.error || 'Error adding/updating team')
                    }

                    toast({
                      title: 'Success!',
                      description: 'Team added/updated',
                    })

                    setTeamForm({
                      name: '',
                      short_name: '',
                    })
                    setTeamLogoFile(null)
                    // Reset file input
                    const fileInput = document.getElementById('team_logo') as HTMLInputElement
                    if (fileInput) {
                      fileInput.value = ''
                    }
                    fetchTeams()
                  } catch (error: any) {
                    console.error('Error adding team:', error)
                    toast({
                      title: 'Error',
                      description: error.message || 'Something went wrong',
                      variant: 'destructive',
                    })
                  } finally {
                    setLoading(false)
                  }
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="team_name">Team name</Label>
                    <Input
                      id="team_name"
                      value={teamForm.name}
                      onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                      placeholder="Enter club name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="short_name">Abbreviation</Label>
                    <Input
                      id="short_name"
                      value={teamForm.short_name}
                      onChange={(e) => setTeamForm({ ...teamForm, short_name: e.target.value })}
                      placeholder="e.g. RM"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="team_logo">Team logo (image)</Label>
                  <Input
                    id="team_logo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      setTeamLogoFile(file)
                    }}
                  />
                  <p className="text-xs text-white/50 mt-1">
                    Recommended: square image (e.g. 512x512), PNG or JPG
                  </p>
                  {teamLogoFile && (
                    <p className="text-xs text-[var(--fpl-green)] mt-1">
                      Selected logo: {teamLogoFile.name}
                    </p>
                  )}
                </div>

                <Button type="submit" className={`w-full ${adminPrimaryBtn}`} disabled={loading}>
                  {loading ? 'Adding...' : 'Add team'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Teams List */}
          <Card className={adminPanel}>
            <CardHeader>
              <CardTitle className="text-white">All teams</CardTitle>
              <CardDescription className="text-white/50">
                {loadingTeams ? 'Loading...' : `${teams.length} teams`}
              </CardDescription>
            </CardHeader>
            <CardContent className='px-2 sm:px-6'>
              {loadingTeams ? (
                <div className="text-center py-8 text-white/50">Loading teams...</div>
              ) : teams.length === 0 ? (
                <div className="text-center py-8 text-white/50">
                  No teams. Add the first team!
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border border-white/10 rounded-xl hover:bg-white/5 transition gap-3"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0 w-full sm:w-auto justify-center sm:justify-start">
                        <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                          <Image
                            src={team.logo_url || '/placeholder-logo.svg'}
                            alt={team.name}
                            fill
                            className="object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = '/placeholder-logo.svg'
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-1 text-center sm:text-left">
                          <div className="font-semibold text-sm sm:text-base truncate text-white">
                            {team.name}
                            {team.short_name && (
                              <span className="text-xs text-white/50 ml-2">
                                ({team.short_name})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingTeam(team)}
                          className="text-[var(--fpl-cyan)] hover:text-[var(--fpl-cyan)]/80 flex-shrink-0"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            if (!confirm('Are you sure you want to delete this team?')) {
                              return
                            }
                            try {
                              const response = await fetch(`/api/teams/${team.id}`, {
                                method: 'DELETE',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({}),
                              })

                              if (!response.ok) {
                                const error = await response.json()
                                throw new Error(error.error || 'Error deleting team')
                              }

                              toast({
                                title: 'Success!',
                                description: 'Team deleted',
                              })
                              fetchTeams()
                            } catch (error: any) {
                              toast({
                                title: 'Error',
                                description: error.message || 'Something went wrong',
                                variant: 'destructive',
                              })
                            }
                          }}
                          className="text-destructive hover:text-destructive flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Edit Dialogs */}
        {/* Edit Result Dialog */}
        <Dialog open={!!editingResult} onOpenChange={(open) => !open && setEditingResult(null)}>
          <DialogContent className={adminDialog}>
            <DialogHeader>
              <DialogTitle className="text-white">Edit result</DialogTitle>
              <DialogDescription className="text-white/50">Edit the match result details</DialogDescription>
            </DialogHeader>
            {editingResult && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  const updatedResult = {
                    ...editingResult,
                    home_team: editResultForm.home_team,
                    away_team: editResultForm.away_team,
                    home_score: parseInt(editResultForm.home_score),
                    away_score: parseInt(editResultForm.away_score),
                    date: editResultForm.date,
                  }
                  await handleEditResult(updatedResult)
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_home_team">Home team</Label>
                    {teams.length === 0 ? (
                      <div className="text-sm text-white/50 py-2">
                        No teams. Add teams first.
                      </div>
                    ) : (
                      <Select
                        value={editResultForm.home_team}
                        onValueChange={(value) =>
                          setEditResultForm({ ...editResultForm, home_team: value })
                        }
                        required
                      >
                        <SelectTrigger id="edit_home_team" className="w-full">
                          <SelectValue placeholder="Select team" />
                        </SelectTrigger>
                        <SelectContent>
                          {teams.map((team) => (
                            <SelectItem key={team.id} value={team.name}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="edit_away_team">Away team</Label>
                    {teams.length === 0 ? (
                      <div className="text-sm text-white/50 py-2">
                        No teams. Add teams first.
                      </div>
                    ) : (
                      <Select
                        value={editResultForm.away_team}
                        onValueChange={(value) =>
                          setEditResultForm({ ...editResultForm, away_team: value })
                        }
                        required
                      >
                        <SelectTrigger id="edit_away_team" className="w-full">
                          <SelectValue placeholder="Select team" />
                        </SelectTrigger>
                        <SelectContent>
                          {teams.map((team) => (
                            <SelectItem key={team.id} value={team.name}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_home_score">Home team goals</Label>
                    <Input
                      id="edit_home_score"
                      type="number"
                      value={editResultForm.home_score}
                      onChange={(e) =>
                        setEditResultForm({ ...editResultForm, home_score: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_away_score">Away team goals</Label>
                    <Input
                      id="edit_away_score"
                      type="number"
                      value={editResultForm.away_score}
                      onChange={(e) =>
                        setEditResultForm({ ...editResultForm, away_score: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit_date">Date</Label>
                  <Input
                    id="edit_date"
                    type="date"
                    value={editResultForm.date}
                    onChange={(e) =>
                      setEditResultForm({ ...editResultForm, date: e.target.value })
                    }
                    required
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingResult(null)
                      setEditResultForm({
                        home_team: '',
                        away_team: '',
                        home_score: '',
                        away_score: '',
                        date: '',
                      })
                    }}
                   className={adminOutlineBtn}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className={adminPrimaryBtn}>
                    {loading ? 'Saving...' : 'Save'}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Player Dialog */}
        <Dialog open={!!editingPlayer} onOpenChange={(open) => {
          if (!open) {
            setEditingPlayer(null)
            setEditPlayerImageFile(null)
            setEditPlayerTeam('none')
            setEditPlayerInjury(false)
            setEditPlayerRatings({
              pace: '',
              shooting: '',
              passing: '',
              dribbling: '',
              defending: '',
              physical: '',
              stamina: '',
            })
            setRatingBonus('0')
          }
        }}>
          <DialogContent className={adminDialog}>
            <DialogHeader>
              <DialogTitle className="text-white">Edit player</DialogTitle>
              <DialogDescription className="text-white/50">Edit the player details</DialogDescription>
            </DialogHeader>
            {editingPlayer && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  const priceRaw = formData.get('price') as string
                  const priceParsed =
                    priceRaw === '' || priceRaw == null ? null : parseFloat(priceRaw)
                  const updatedPlayer = {
                    ...editingPlayer,
                    first_name: formData.get('first_name') as string,
                    last_name: formData.get('last_name') as string,
                    birth_year: parseInt(formData.get('birth_year') as string),
                    team: editPlayerTeam === 'none' ? '' : editPlayerTeam,
                    image_url: editingPlayer.image_url || '',
                    price:
                      priceParsed != null && !Number.isNaN(priceParsed) ? priceParsed : null,
                  }
                  await handleEditPlayer(updatedPlayer)
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_first_name">First name</Label>
                    <Input
                      id="edit_first_name"
                      name="first_name"
                      defaultValue={editingPlayer.first_name}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_last_name">Last name</Label>
                    <Input
                      id="edit_last_name"
                      name="last_name"
                      defaultValue={editingPlayer.last_name}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_team">Team</Label>
                    {teams.length === 0 ? (
                      <div className="text-sm text-white/50 py-2">
                        No teams. Add teams first.
                      </div>
                    ) : (
                      <Select
                        value={editPlayerTeam}
                        onValueChange={(value) => setEditPlayerTeam(value)}
                      >
                        <SelectTrigger id="edit_team" className="w-full">
                          <SelectValue placeholder="Select team (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No team</SelectItem>
                          {teams.map((team) => (
                            <SelectItem key={team.id} value={team.name}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="edit_player_image">New image (optional)</Label>
                    <Input
                      id="edit_player_image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        setEditPlayerImageFile(file)
                      }}
                    />
                    {editingPlayer.image_url && (
                      <p className="text-xs text-white/50 mt-1">
                        Current image: <a href={editingPlayer.image_url} target="_blank" rel="noopener noreferrer" className="text-[var(--fpl-cyan)] hover:underline">View</a>
                      </p>
                    )}
                    {editPlayerImageFile && (
                      <p className="text-xs text-[var(--fpl-green)] mt-1">
                        New image: {editPlayerImageFile.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_birth_year">Year of birth</Label>
                    <Input
                      id="edit_birth_year"
                      name="birth_year"
                      type="number"
                      defaultValue={editingPlayer.birth_year}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_price">Fantasy price (£m)</Label>
                    <Input
                      id="edit_price"
                      name="price"
                      type="number"
                      min="0"
                      max="99.9"
                      step="0.1"
                      defaultValue={editingPlayer.price ?? ''}
                      placeholder="e.g. 5.5"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit_injury"
                    checked={editPlayerInjury}
                    onCheckedChange={(checked) => setEditPlayerInjury(checked === true)}
                  />
                  <Label htmlFor="edit_injury" className="text-sm font-normal cursor-pointer">
                    Injured
                  </Label>
                </div>

                {/* Player Ratings Section */}
                {SHOW_PLAYER_RATINGS && (
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Player ratings (FIFA style)</h3>
                    <p className="text-sm text-white/50 mb-4">
                      Enter ratings from 0 to 100 for each attribute
                    </p>
                    {/* Trenutni i novi prosječni rating */}
                    {(() => {
                      // Računaj trenutni prosječni rating iz originalnih podataka
                      const originalRatings = [
                        editingPlayer.pace,
                        editingPlayer.shooting,
                        editingPlayer.passing,
                        editingPlayer.dribbling,
                        editingPlayer.defending,
                        editingPlayer.physical,
                        editingPlayer.stamina,
                      ].filter((r): r is number => r !== null && r !== undefined)

                      let baseAvg = originalRatings.length > 0
                        ? Math.round(originalRatings.reduce((sum, r) => sum + r, 0) / originalRatings.length)
                        : null

                      // Dodaj trenutni bonus
                      const currentBonus = editingPlayer.rating_bonus || 0
                      let currentAvg = baseAvg !== null ? Math.max(0, Math.min(100, baseAvg + currentBonus)) : null

                      // Računaj novi prosječni rating sa novim bonusom
                      const newBonus = parseInt(ratingBonus, 10) || 0
                      let newAvg = baseAvg !== null ? Math.max(0, Math.min(100, baseAvg + newBonus)) : null

                      return (
                        <div className="mb-4 p-3 bg-[var(--fpl-p90)] border border-white/10 rounded-lg space-y-1">
                          {currentAvg !== null && (
                            <p className="text-sm font-medium">
                              Current average rating: <span className="text-lg font-bold">{currentAvg}</span>
                              {currentBonus !== 0 && (
                                <span className="text-xs ml-2 text-white/50">
                                  (base: {baseAvg}, bonus: {currentBonus > 0 ? '+' : ''}{currentBonus})
                                </span>
                              )}
                            </p>
                          )}
                          {newAvg !== null && newAvg !== currentAvg && (
                            <p className="text-sm font-medium text-[var(--fpl-cyan)]">
                              New average rating: <span className="text-lg font-bold">{newAvg}</span>
                              {currentAvg !== null && (
                                <span className="text-xs ml-2">
                                  ({newAvg > currentAvg ? '+' : ''}{newAvg - currentAvg})
                                </span>
                              )}
                              {newBonus !== 0 && (
                                <span className="text-xs ml-2 text-white/50">
                                  (bonus: {newBonus > 0 ? '+' : ''}{newBonus})
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      )
                    })()}
                    {/* Bonus rating polje */}
                    <div className="mb-4 p-3 bg-[var(--fpl-p90)] rounded-lg border border-white/10">
                      <Label htmlFor="rating_bonus" className="text-sm font-medium mb-2 block">
                        Average rating bonus
                      </Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const currentBonus = parseInt(ratingBonus, 10) || 0
                            const newBonus = currentBonus - 1
                            setRatingBonus(newBonus.toString())
                          }}
                          className={`shrink-0 ${adminOutlineBtn}`}>
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Input
                          id="rating_bonus"
                          type="number"
                          value={ratingBonus}
                          onChange={(e) => setRatingBonus(e.target.value)}
                          placeholder="0"
                          className="flex-1 text-center"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const currentBonus = parseInt(ratingBonus, 10) || 0
                            const newBonus = currentBonus + 1
                            setRatingBonus(newBonus.toString())
                          }}
                          className={`shrink-0 ${adminOutlineBtn}`}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-white/50 mt-2">
                        Use the +/- buttons or enter a number. The bonus will be added to the average rating (it does not change attribute ratings). The bonus is saved when you save the form.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="edit_pace">Pace</Label>
                      <Input
                        id="edit_pace"
                        type="number"
                        min="0"
                        max="100"
                        value={editPlayerRatings.pace}
                        onChange={(e) =>
                          setEditPlayerRatings({ ...editPlayerRatings, pace: e.target.value })
                        }
                        placeholder="0-100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_shooting">Shooting</Label>
                      <Input
                        id="edit_shooting"
                        type="number"
                        min="0"
                        max="100"
                        value={editPlayerRatings.shooting}
                        onChange={(e) =>
                          setEditPlayerRatings({ ...editPlayerRatings, shooting: e.target.value })
                        }
                        placeholder="0-100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_passing">Passing</Label>
                      <Input
                        id="edit_passing"
                        type="number"
                        min="0"
                        max="100"
                        value={editPlayerRatings.passing}
                        onChange={(e) =>
                          setEditPlayerRatings({ ...editPlayerRatings, passing: e.target.value })
                        }
                        placeholder="0-100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_dribbling">Dribbling</Label>
                      <Input
                        id="edit_dribbling"
                        type="number"
                        min="0"
                        max="100"
                        value={editPlayerRatings.dribbling}
                        onChange={(e) =>
                          setEditPlayerRatings({ ...editPlayerRatings, dribbling: e.target.value })
                        }
                        placeholder="0-100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_defending">Defending</Label>
                      <Input
                        id="edit_defending"
                        type="number"
                        min="0"
                        max="100"
                        value={editPlayerRatings.defending}
                        onChange={(e) =>
                          setEditPlayerRatings({ ...editPlayerRatings, defending: e.target.value })
                        }
                        placeholder="0-100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_physical">Physical</Label>
                      <Input
                        id="edit_physical"
                        type="number"
                        min="0"
                        max="100"
                        value={editPlayerRatings.physical}
                        onChange={(e) =>
                          setEditPlayerRatings({ ...editPlayerRatings, physical: e.target.value })
                        }
                        placeholder="0-100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_stamina">Stamina</Label>
                      <Input
                        id="edit_stamina"
                        type="number"
                        min="0"
                        max="100"
                        value={editPlayerRatings.stamina}
                        onChange={(e) =>
                          setEditPlayerRatings({ ...editPlayerRatings, stamina: e.target.value })
                        }
                        placeholder="0-100"
                      />
                    </div>
                  </div>
                </div>
                )}
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingPlayer(null)
                      setEditPlayerImageFile(null)
                      setEditPlayerInjury(false)
                      setEditPlayerRatings({
                        pace: '',
                        shooting: '',
                        passing: '',
                        dribbling: '',
                        defending: '',
                        physical: '',
                        stamina: '',
                      })
                      setRatingBonus('0')
                    }}
                   className={adminOutlineBtn}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className={adminPrimaryBtn}>
                    {loading ? 'Saving...' : 'Save'}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Team Dialog */}
        <Dialog open={!!editingTeam} onOpenChange={(open) => !open && setEditingTeam(null)}>
          <DialogContent className={adminDialog}>
            <DialogHeader>
              <DialogTitle className="text-white">Edit team</DialogTitle>
              <DialogDescription className="text-white/50">Edit the team details</DialogDescription>
            </DialogHeader>
            {editingTeam && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  const updatedTeam = {
                    ...editingTeam,
                    name: formData.get('name') as string,
                    short_name: formData.get('short_name') as string,
                  }
                  await handleEditTeam(updatedTeam)
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_team_name">Team name</Label>
                    <Input
                      id="edit_team_name"
                      name="name"
                      defaultValue={editingTeam.name}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_short_name">Abbreviation</Label>
                    <Input
                      id="edit_short_name"
                      name="short_name"
                      defaultValue={editingTeam.short_name || ''}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit_team_logo">New logo (optional)</Label>
                  <Input
                    id="edit_team_logo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      setEditTeamLogoFile(file)
                    }}
                  />
                  {editingTeam.logo_url && (
                    <p className="text-xs text-white/50 mt-1">
                      Current logo: <a href={editingTeam.logo_url} target="_blank" rel="noopener noreferrer" className="text-[var(--fpl-cyan)] hover:underline">View</a>
                    </p>
                  )}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {
                    setEditingTeam(null)
                    setEditTeamLogoFile(null)
                  }} className={adminOutlineBtn}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className={adminPrimaryBtn}>
                    {loading ? 'Saving...' : 'Save'}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div >
  )
}
