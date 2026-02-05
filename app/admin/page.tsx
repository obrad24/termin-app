'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Result, Player, Team } from '@/lib/supabase'
import { format } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'
import { getPlayerImageUrl } from '@/lib/image-utils'
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
  const [playerForm, setPlayerForm] = useState({
    first_name: '',
    last_name: '',
    birth_year: '',
    team: '',
    image_url: '',
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
  const [terminNews, setTerminNews] = useState<string>('')
  const [loadingTerminNews, setLoadingTerminNews] = useState(true)
  const { toast } = useToast()

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
          fetchTerminNews()
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
        fetchTerminNews()
        toast({
          title: 'Uspešno prijavljivanje',
          description: 'Dobrodošli u admin dashboard',
        })
      } else {
        toast({
          title: 'Pogrešna lozinka',
          description: 'Pokušajte ponovo',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Greška',
        description: 'Nešto je pošlo po zlu',
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
        title: 'Uspešno odjavljivanje',
        description: 'Uspešno ste se odjavili',
      })
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const fetchResults = async () => {
    setLoadingResults(true)
    try {
      const response = await fetch('/api/results')
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
      const response = await fetch('/api/players')
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
      const response = await fetch('/api/teams')
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

  const fetchTerminNews = async () => {
    setLoadingTerminNews(true)
    try {
      const response = await fetch('/api/termin-news')
      if (response.ok) {
        const data = await response.json()
        console.log('Admin - TerminNews data:', data) // Debug log
        setTerminNews(data.content || '')
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Admin - Error fetching termin news:', response.status, errorData)
      }
    } catch (error) {
      console.error('Admin - Error fetching termin news:', error)
    } finally {
      setLoadingTerminNews(false)
    }
  }

  const handleSaveTerminNews = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/termin-news', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: terminNews }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Greška pri čuvanju TerminNews')
      }

      toast({
        title: 'Uspešno!',
        description: 'TerminNews je sačuvan',
      })

      fetchTerminNews()
    } catch (error: any) {
      toast({
        title: 'Greška',
        description: error.message || 'Nešto je pošlo po zlu',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateTerminNews = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/termin-news/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Greška pri generisanju teksta')
      }

      const data = await response.json()

      toast({
        title: 'Uspešno!',
        description: 'Tekst je generisan i sačuvan',
      })

      // Ažuriraj tekst u formi
      setTerminNews(data.content || '')
      fetchTerminNews()
    } catch (error: any) {
      toast({
        title: 'Greška',
        description: error.message || 'Nešto je pošlo po zlu',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
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
          title: 'Greška',
          description: 'Morate prvo postaviti timove u TerminBet sekciji',
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
        throw new Error(error.error || 'Greška pri čuvanju igrača')
      }

      toast({
        title: 'Uspešno!',
        description: 'Igrači su sačuvani',
      })

      fetchMatchPlayers()
      setShowMatchAnnouncementDialog(false)
    } catch (error: any) {
      toast({
        title: 'Greška',
        description: error.message || 'Nešto je pošlo po zlu',
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
          title: 'Greška',
          description: 'Morate izabrati oba tima',
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
        throw new Error(error.error || 'Greška pri čuvanju sledećeg meča')
      }

      toast({
        title: 'Uspešno!',
        description: 'Sledeći meč je sačuvan',
      })

      fetchNextMatch()
    } catch (error: any) {
      toast({
        title: 'Greška',
        description: error.message || 'Nešto je pošlo po zlu',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Da li ste sigurni da želite da obrišete ovaj rezultat?')) {
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
        throw new Error(error.error || 'Greška pri brisanju rezultata')
      }

      toast({
        title: 'Uspešno!',
        description: 'Rezultat je obrisan',
      })

      fetchResults()
    } catch (error: any) {
      toast({
        title: 'Greška',
        description: error.message || 'Nešto je pošlo po zlu',
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
        throw new Error(error.error || 'Greška pri ažuriranju rezultata')
      }

      toast({
        title: 'Uspešno!',
        description: 'Rezultat je ažuriran',
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
        title: 'Greška',
        description: error.message || 'Nešto je pošlo po zlu',
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
        })

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json()
          throw new Error(error.error || 'Greška pri uploadu slike')
        }

        const uploadData = await uploadResponse.json()
        imageUrl = uploadData.url
      }

      const ratingBonusValue = parseInt(ratingBonus, 10)
      const finalRatingBonus = isNaN(ratingBonusValue) ? null : ratingBonusValue

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
          image_url: imageUrl || '',
          pace: editPlayerRatings.pace || null,
          shooting: editPlayerRatings.shooting || null,
          passing: editPlayerRatings.passing || null,
          dribbling: editPlayerRatings.dribbling || null,
          defending: editPlayerRatings.defending || null,
          physical: editPlayerRatings.physical || null,
          stamina: editPlayerRatings.stamina || null,
          injury: editPlayerInjury,
          rating_bonus: finalRatingBonus,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Greška pri ažuriranju igrača')
      }

      toast({
        title: 'Uspešno!',
        description: 'Igrač je ažuriran',
      })

      setEditingPlayer(null)
      setEditPlayerImageFile(null)
      fetchPlayers()
    } catch (error: any) {
      toast({
        title: 'Greška',
        description: error.message || 'Nešto je pošlo po zlu',
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
        })

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json()
          throw new Error(error.error || 'Greška pri uploadu slike')
        }

        const uploadData = await uploadResponse.json()
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
        throw new Error(error.error || 'Greška pri ažuriranju tima')
      }

      toast({
        title: 'Uspešno!',
        description: 'Tim je ažuriran',
      })

      setEditingTeam(null)
      setEditTeamLogoFile(null)
      fetchTeams()
    } catch (error: any) {
      toast({
        title: 'Greška',
        description: error.message || 'Nešto je pošlo po zlu',
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

  if (checkingAuth) {
    return (
      <div className="min-h-screen hero-bg flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-white">Provera autentifikacije...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen hero-bg flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>Unesite lozinku za pristup admin dashboard-u</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="password">Lozinka</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !loading && handleLogin()}
                  placeholder="Unesite lozinku"
                  disabled={loading}
                />
              </div>
              <Button onClick={handleLogin} className="w-full" disabled={loading}>
                {loading ? 'Prijavljivanje...' : 'Prijavi se'}
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
    <div className="min-h-screen hero-bg py-4 sm:py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Admin Dashboard</h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="outline" className="gap-2 w-full sm:w-auto">
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Glavni sajt</span>
                <span className="sm:hidden">Početna</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="gap-2 w-full sm:w-auto"
            >
              <LogOut className="w-4 h-4" />
              Odjavi se
            </Button>
          </div>
        </div>

        {/* TerminBet and Match Announcement Buttons */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => setShowTerminBetDialog(true)}
            className="w-full sm:w-auto relative overflow-hidden bg-[#280071]"
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
            className="w-full sm:w-auto"
            size="lg"
            variant="default"
          >
            <Calendar className="w-5 h-5 mr-2" />
            NAJAVA MECA
          </Button>
        </div>

        {/* TerminBet Dialog */}
        <Dialog open={showTerminBetDialog} onOpenChange={setShowTerminBetDialog}>
          <DialogContent className="max-w-2xl h-[80vh] sm:h-[85vh] flex flex-col w-[95%] sm:w-full max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
                TerminBet
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 sm:pr-2">
              {loadingNextMatch ? (
                <div className="text-center py-4 text-muted-foreground">Učitavanje...</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="next_home_team">Domaći tim</Label>
                      {teams.length === 0 ? (
                        <div className="text-sm text-muted-foreground py-2">
                          Nema timova. Dodajte timove prvo.
                        </div>
                      ) : (
                        <Select
                          value={nextMatch.home_team}
                          onValueChange={(value) =>
                            setNextMatch({ ...nextMatch, home_team: value })
                          }
                        >
                          <SelectTrigger id="next_home_team">
                            <SelectValue placeholder="Izaberi tim" />
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
                      <Label htmlFor="next_away_team">Gostujući tim</Label>
                      {teams.length === 0 ? (
                        <div className="text-sm text-muted-foreground py-2">
                          Nema timova. Dodajte timove prvo.
                        </div>
                      ) : (
                        <Select
                          value={nextMatch.away_team}
                          onValueChange={(value) =>
                            setNextMatch({ ...nextMatch, away_team: value })
                          }
                        >
                          <SelectTrigger id="next_away_team">
                            <SelectValue placeholder="Izaberi tim" />
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
                    <Label htmlFor="next_match_date">Datum meča</Label>
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
                      <h3 className="text-sm sm:text-base font-semibold mb-3">Kvote (1 X 2)</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="next_odds_1">
                            1 (Pobeda {nextMatch.home_team || 'domaćeg tima'})
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
                            placeholder="npr. 7.75"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="next_odds_x">X (Nerešeno)</Label>
                          <Input
                            id="next_odds_x"
                            type="number"
                            step="0.01"
                            min="0"
                            value={nextMatch.odds_x}
                            onChange={(e) =>
                              setNextMatch({ ...nextMatch, odds_x: e.target.value })
                            }
                            placeholder="npr. 4.80"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="next_odds_2">
                            2 (Pobeda {nextMatch.away_team || 'gostujućeg tima'})
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
                            placeholder="npr. 1.40"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Broj golova na terminu */}
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-3">
                        <h3 className="text-sm sm:text-base font-semibold">Broj golova na terminu</h3>
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
                          className="w-full sm:w-auto"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Dodaj
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {nextMatch.total_goals_odds.map((item, index) => (
                          <div
                            key={index}
                            className="flex flex-col sm:flex-row gap-2 sm:items-end p-3 bg-muted rounded-lg"
                          >
                            <div className="flex-1 space-y-2">
                              <Label className="text-xs">Broj golova</Label>
                              <Input
                                type="number"
                                min="0"
                                value={item.goals}
                                onChange={(e) => {
                                  const updated = [...nextMatch.total_goals_odds]
                                  updated[index].goals = e.target.value
                                  setNextMatch({ ...nextMatch, total_goals_odds: updated })
                                }}
                                placeholder="npr. 2"
                              />
                            </div>
                            <div className="flex-1 space-y-2">
                              <Label className="text-xs">Kvota</Label>
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
                                placeholder="npr. 3.50"
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
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Nema dodatih kvota. Kliknite "Dodaj" da dodate.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Igrač sa termina i broj golova */}
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-3">
                        <h3 className="text-sm sm:text-base font-semibold">Igrač sa termina i broj golova</h3>
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
                          className="w-full sm:w-auto"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Dodaj
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
                              className="flex flex-col sm:flex-row gap-2 sm:items-end p-3 bg-muted rounded-lg"
                            >
                              <div className="flex-1 space-y-2 min-w-0">
                                <Label className="text-xs">Igrač</Label>
                                <Select
                                  value={item.player_id}
                                  onValueChange={(value) => {
                                    const updated = [...nextMatch.player_goals_odds]
                                    updated[index].player_id = value
                                    setNextMatch({ ...nextMatch, player_goals_odds: updated })
                                  }}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Izaberi igrača" />
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
                                <Label className="text-xs">Broj golova</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={item.goals}
                                  onChange={(e) => {
                                    const updated = [...nextMatch.player_goals_odds]
                                    updated[index].goals = e.target.value
                                    setNextMatch({ ...nextMatch, player_goals_odds: updated })
                                  }}
                                  placeholder="npr. 2"
                                  className="w-full"
                                />
                              </div>
                              <div className="flex-1 space-y-2 min-w-0">
                                <Label className="text-xs">Kvota</Label>
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
                                  placeholder="npr. 4.20"
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
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Nema dodatih kvota. Kliknite "Dodaj" da dodate.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Preko/Ispod broj golova */}
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-3">
                        <h3 className="text-sm sm:text-base font-semibold">Preko/Ispod broj golova</h3>
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
                          className="w-full sm:w-auto"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Dodaj
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {nextMatch.over_under_odds.map((item, index) => (
                          <div
                            key={index}
                            className="flex flex-col sm:flex-row gap-2 sm:items-end p-3 bg-muted rounded-lg"
                          >
                            <div className="w-full sm:w-24 space-y-2">
                              <Label className="text-xs">Broj golova</Label>
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
                                placeholder="npr. 2.5"
                                className="w-full"
                              />
                            </div>
                            <div className="flex-1 space-y-2 min-w-0">
                              <Label className="text-xs">Kvota Preko</Label>
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
                                placeholder="npr. 1.85"
                                className="w-full"
                              />
                            </div>
                            <div className="flex-1 space-y-2 min-w-0">
                              <Label className="text-xs">Kvota Ispod</Label>
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
                                placeholder="npr. 1.95"
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
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Nema dodatih kvota. Kliknite "Dodaj" da dodate.
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
              >
                Otkaži
              </Button>
              <Button
                onClick={async () => {
                  await handleSaveNextMatch()
                  setShowTerminBetDialog(false)
                }}
                disabled={loading}
              >
                {loading ? 'Čuvanje...' : 'Sačuvaj'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Match Announcement Dialog */}
        <Dialog open={showMatchAnnouncementDialog} onOpenChange={setShowMatchAnnouncementDialog}>
          <DialogContent className="max-w-4xl h-[80vh] sm:h-[85vh] flex flex-col w-[95%] sm:w-full max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
                <Calendar className="w-5 h-5" />
                NAJAVA MECA
              </DialogTitle>
              <DialogDescription>
                Izaberite igrače koji će igrati sledeći meč
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-6 pr-1 sm:pr-2">
              {loadingMatchPlayers ? (
                <div className="text-center py-4 text-muted-foreground">Učitavanje...</div>
              ) : !nextMatch.home_team || !nextMatch.away_team ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-2">Morate prvo postaviti timove u TerminBet sekciji</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowMatchAnnouncementDialog(false)
                      setShowTerminBetDialog(true)
                    }}
                  >
                    Otvori TerminBet
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
                            className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                              isMatchPlayerSelected(player.id.toString(), 'home')
                                ? 'bg-primary/10 border-primary'
                                : 'hover:bg-muted/50'
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
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nema igrača u ovom timu
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
                            className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                              isMatchPlayerSelected(player.id.toString(), 'away')
                                ? 'bg-primary/10 border-primary'
                                : 'hover:bg-muted/50'
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
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nema igrača u ovom timu
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
              >
                Otkaži
              </Button>
              <Button
                onClick={handleSaveMatchPlayers}
                disabled={loading || !nextMatch.home_team || !nextMatch.away_team}
              >
                {loading ? 'Čuvanje...' : 'Sačuvaj'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Statistics Cards */}
        <div className="flex flex-col gap-4">
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
            <Card className='p-4 sm:p-6'>
              <CardHeader className="flex flex-col items-center justify-center space-y-0 pb-4 px-0">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-3">
                  <Trophy className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-sm font-medium text-center text-muted-foreground">
                  Ukupno rezultata
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="text-3xl font-bold text-center">{stats.totalResults}</div>
              </CardContent>
            </Card>

            <Card className='p-4 sm:p-6'>
              <CardHeader className="flex flex-col items-center justify-center space-y-0 pb-4 px-0">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-3">
                  <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-sm font-medium text-center text-muted-foreground">
                  Broj timova
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="text-3xl font-bold text-center">{teams.length}</div>
              </CardContent>
            </Card>

            <Card className='p-4 sm:p-6'>
              <CardHeader className="flex flex-col items-center justify-center space-y-0 pb-4 px-0">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-3">
                  <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-sm font-medium text-center text-muted-foreground">
                  Broj igrača
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="text-3xl font-bold text-center">{players.length}</div>
              </CardContent>
            </Card>

            <Card className='p-4 sm:p-6'>
              <CardHeader className="flex flex-col items-center justify-center space-y-0 pb-4 px-0">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 mb-3">
                  <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle className="text-sm font-medium text-center text-muted-foreground">
                  Današnji rezultati
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="text-3xl font-bold text-center">{stats.todayResults}</div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className='p-4 sm:p-6'>
              <CardHeader className="flex flex-col items-center justify-center space-y-0 pb-4 px-0">
                <CardTitle className="text-sm font-medium text-center text-muted-foreground">
                  Najnoviji rezultat
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                {stats.latestResult ? (
                  <div className="text-center space-y-2">
                    <div className="text-lg font-semibold">
                      {stats.latestResult.home_team} vs {stats.latestResult.away_team}
                    </div>
                    <div className="text-2xl font-bold text-muted-foreground">
                      {stats.latestResult.home_score} - {stats.latestResult.away_score}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center">Nema rezultata</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* TerminNews Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Newspaper className="w-5 h-5" />
              TerminNews - Izvještaj o poslednjem terminu
            </CardTitle>
            <CardDescription>
              Unesite tekst koji će se prikazati na TerminNews stranici kao izvještaj o poslednjem terminu
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTerminNews ? (
              <div className="text-center py-8 text-muted-foreground">
                Učitavanje...
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="termin_news">Tekst izvještaja</Label>
                  <Textarea
                    id="termin_news"
                    value={terminNews}
                    onChange={(e) => setTerminNews(e.target.value)}
                    placeholder="Unesite tekst izvještaja o poslednjem terminu..."
                    className="min-h-[200px] resize-y"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={handleGenerateTerminNews}
                      disabled={loading}
                      className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {loading ? 'Generisanje...' : 'Generiši tekst'}
                    </Button>
                    <Button
                      onClick={handleSaveTerminNews}
                      disabled={loading}
                      className="w-full sm:w-auto"
                    >
                      {loading ? 'Čuvanje...' : 'Sačuvaj izvještaj'}
                    </Button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link href="/terminnews" className="w-full sm:w-auto">
                      <Button variant="outline" className="w-full sm:w-auto">
                        Pregledaj stranicu
                      </Button>
                    </Link>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Kliknite na "Generiši tekst" da automatski kreira izvještaj o poslednjem meču. 
                    Sistem će generisati tekst od 10 rečenica na osnovu podataka o meču, rezultatu i strijelcima.
                    Tekst će biti automatski sačuvan nakon generisanja.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add Result Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Plus className="w-5 h-5" />
                Dodaj novu utakmicu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/admin/match/new">
                <Button className="w-full" size="lg">
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Dodaj novu utakmicu</span>
                  <span className="sm:hidden">Dodaj utakmicu</span>
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Results List */}
          <Card>
            <CardHeader>
              <CardTitle>Svi rezultati</CardTitle>
              <CardDescription>
                {loadingResults ? 'Učitavanje...' : `${results.length} rezultata`}
              </CardDescription>
            </CardHeader>
            <CardContent className='px-2 sm:px-6'>
              {loadingResults ? (
                <div className="text-center py-8 text-muted-foreground">
                  Učitavanje rezultata...
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nema rezultata. Dodajte prvi rezultat!
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {results.map((result) => (
                    <div
                      key={result.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition gap-3"
                    >
                      <div className="flex-1 min-w-0 w-full sm:w-auto">
                        <div className="font-semibold text-sm sm:text-base truncate text-center sm:text-left">
                          {result.home_team} vs {result.away_team}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground mt-1 justify-center flex flex-col items-center">
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
                          className="text-blue-500 hover:text-blue-600 flex-shrink-0"
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Dodaj igrača
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
                        })

                        if (!uploadResponse.ok) {
                          let errorMessage = 'Greška pri uploadu slike'
                          try {
                            const error = await uploadResponse.json()
                            errorMessage = error.error || error.message || errorMessage
                            console.error('Upload error:', error)
                          } catch (parseError) {
                            const text = await uploadResponse.text()
                            console.error('Upload error (text):', text)
                            errorMessage = text || errorMessage
                          }
                          throw new Error(errorMessage)
                        }

                        const uploadData = await uploadResponse.json()
                        if (!uploadData.url) {
                          throw new Error('URL slike nije dobijen sa servera')
                        }
                        imageUrl = uploadData.url
                      } catch (uploadError: any) {
                        console.error('Upload error details:', uploadError)
                        throw new Error(uploadError.message || 'Greška pri uploadu slike')
                      }
                    }

                    const response = await fetch('/api/players', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        ...playerForm,
                        image_url: imageUrl || playerForm.image_url || null,
                      }),
                    })

                    if (!response.ok) {
                      const error = await response.json()
                      throw new Error(error.error || 'Greška pri dodavanju igrača')
                    }

                    toast({
                      title: 'Uspešno!',
                      description: 'Igrač je dodat',
                    })

                    setPlayerForm({
                      first_name: '',
                      last_name: '',
                      birth_year: '',
                      team: '',
                      image_url: '',
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
                      title: 'Greška',
                      description: error.message || 'Nešto je pošlo po zlu',
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
                    <Label htmlFor="first_name">Ime</Label>
                    <Input
                      id="first_name"
                      value={playerForm.first_name}
                      onChange={(e) => setPlayerForm({ ...playerForm, first_name: e.target.value })}
                      placeholder="npr. Luka"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Prezime</Label>
                    <Input
                      id="last_name"
                      value={playerForm.last_name}
                      onChange={(e) => setPlayerForm({ ...playerForm, last_name: e.target.value })}
                      placeholder="npr. Modrić"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="team">Tim</Label>
                    {teams.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-2">
                        Nema timova. Dodajte timove prvo.
                      </div>
                    ) : (
                      <Select
                        value={playerForm.team || 'none'}
                        onValueChange={(value) =>
                          setPlayerForm({ ...playerForm, team: value === 'none' ? '' : value })
                        }
                      >
                        <SelectTrigger id="team" className="w-full">
                          <SelectValue placeholder="Izaberi tim (opciono)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Bez tima</SelectItem>
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
                    <Label htmlFor="player_image">Slika igrača</Label>
                    <Input
                      id="player_image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        setPlayerImageFile(file)
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Preporuka: kvadratna slika (npr. 512x512), PNG ili JPG
                    </p>
                    {playerImageFile && (
                      <p className="text-xs text-green-600 mt-1">
                        Izabrana slika: {playerImageFile.name}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="birth_year">Godina rođenja</Label>
                  <Input
                    id="birth_year"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={playerForm.birth_year}
                    onChange={(e) => setPlayerForm({ ...playerForm, birth_year: e.target.value })}
                    placeholder="npr. 1985"
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Dodavanje...' : 'Dodaj igrača'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Players List */}
          <Card>
            <CardHeader>
              <CardTitle>Svi igrači</CardTitle>
              <CardDescription>
                {loadingPlayers ? 'Učitavanje...' : `${players.length} igrača`}
              </CardDescription>
            </CardHeader>
            <CardContent className='px-2 sm:px-6'>
              {loadingPlayers ? (
                <div className="text-center py-8 text-muted-foreground">Učitavanje igrača...</div>
              ) : players.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nema igrača. Dodajte prvog igrača!
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition gap-3"
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
                          <div className="font-semibold text-sm sm:text-base truncate">
                            {player.first_name} {player.last_name}
                            {player.team && (
                              <span className="text-xs text-muted-foreground ml-2">
                                ({player.team})
                              </span>
                            )}
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            Godina rođenja: {player.birth_year}
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
                          className="text-blue-500 hover:text-blue-600 flex-shrink-0"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            if (!confirm('Da li ste sigurni da želite da obrišete ovog igrača?')) {
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
                                throw new Error(error.error || 'Greška pri brisanju igrača')
                              }

                              toast({
                                title: 'Uspešno!',
                                description: 'Igrač je obrisan',
                              })
                              fetchPlayers()
                            } catch (error: any) {
                              toast({
                                title: 'Greška',
                                description: error.message || 'Nešto je pošlo po zlu',
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
          {/* Add/Edit Team Form - Only Murinjo and Lalat */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Dodaj/Uredi tim
              </CardTitle>
              <CardDescription>Dostupni su samo timovi: Murinjo i Lalat</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  setLoading(true)

                  try {
                    let logoUrl: string | null = null

                    if (teamLogoFile) {
                      // Upload slike preko API rute
                      const uploadFormData = new FormData()
                      uploadFormData.append('file', teamLogoFile)

                      try {
                        const uploadResponse = await fetch('/api/teams/upload', {
                          method: 'POST',
                          body: uploadFormData,
                        })

                        if (!uploadResponse.ok) {
                          let errorMessage = 'Greška pri uploadu logoa'
                          try {
                            const error = await uploadResponse.json()
                            errorMessage = error.error || error.message || errorMessage
                            console.error('Upload error:', error)
                          } catch (parseError) {
                            const text = await uploadResponse.text()
                            console.error('Upload error (text):', text)
                            errorMessage = text || errorMessage
                          }
                          throw new Error(errorMessage)
                        }

                        const uploadData = await uploadResponse.json()
                        if (!uploadData.url) {
                          throw new Error('URL logoa nije dobijen sa servera')
                        }
                        logoUrl = uploadData.url
                      } catch (uploadError: any) {
                        console.error('Upload error details:', uploadError)
                        throw new Error(uploadError.message || 'Greška pri uploadu logoa')
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
                      }),
                    })

                    if (!response.ok) {
                      const error = await response.json()
                      throw new Error(error.error || 'Greška pri dodavanju/ažuriranju tima')
                    }

                    toast({
                      title: 'Uspešno!',
                      description: 'Tim je dodat/ažuriran',
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
                      title: 'Greška',
                      description: error.message || 'Nešto je pošlo po zlu',
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
                    <Label htmlFor="team_name">Naziv tima</Label>
                    <Select
                      value={teamForm.name}
                      onValueChange={(value) => setTeamForm({ ...teamForm, name: value })}
                      required
                    >
                      <SelectTrigger id="team_name">
                        <SelectValue placeholder="Izaberi tim" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Murinjo">Murinjo</SelectItem>
                        <SelectItem value="Lalat">Lalat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="short_name">Skraćenica</Label>
                    <Input
                      id="short_name"
                      value={teamForm.short_name}
                      onChange={(e) => setTeamForm({ ...teamForm, short_name: e.target.value })}
                      placeholder={teamForm.name === 'Murinjo' ? 'MUR' : teamForm.name === 'Lalat' ? 'LAL' : 'npr. RM'}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="team_logo">Logo tima (slika)</Label>
                  <Input
                    id="team_logo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      setTeamLogoFile(file)
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Preporuka: kvadratna slika (npr. 512x512), PNG ili JPG
                  </p>
                  {teamLogoFile && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Izabran logo: {teamLogoFile.name}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Dodavanje...' : 'Dodaj tim'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Teams List */}
          <Card>
            <CardHeader>
              <CardTitle>Svi timovi</CardTitle>
              <CardDescription>
                {loadingTeams ? 'Učitavanje...' : `${teams.length} timova`}
              </CardDescription>
            </CardHeader>
            <CardContent className='px-2 sm:px-6'>
              {loadingTeams ? (
                <div className="text-center py-8 text-muted-foreground">Učitavanje timova...</div>
              ) : teams.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nema timova. Dodajte prvi tim!
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition gap-3"
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
                          <div className="font-semibold text-sm sm:text-base truncate">
                            {team.name}
                            {team.short_name && (
                              <span className="text-xs text-muted-foreground ml-2">
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
                          className="text-blue-500 hover:text-blue-600 flex-shrink-0"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            if (!confirm('Da li ste sigurni da želite da obrišete ovaj tim?')) {
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
                                throw new Error(error.error || 'Greška pri brisanju tima')
                              }

                              toast({
                                title: 'Uspešno!',
                                description: 'Tim je obrisan',
                              })
                              fetchTeams()
                            } catch (error: any) {
                              toast({
                                title: 'Greška',
                                description: error.message || 'Nešto je pošlo po zlu',
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Izmeni rezultat</DialogTitle>
              <DialogDescription>Izmenite podatke o rezultatu utakmice</DialogDescription>
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
                    <Label htmlFor="edit_home_team">Domaći tim</Label>
                    {teams.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-2">
                        Nema timova. Dodajte timove prvo.
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
                          <SelectValue placeholder="Izaberi tim" />
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
                    <Label htmlFor="edit_away_team">Gostujući tim</Label>
                    {teams.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-2">
                        Nema timova. Dodajte timove prvo.
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
                          <SelectValue placeholder="Izaberi tim" />
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
                    <Label htmlFor="edit_home_score">Golovi domaćeg tima</Label>
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
                    <Label htmlFor="edit_away_score">Golovi gostujućeg tima</Label>
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
                  <Label htmlFor="edit_date">Datum</Label>
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
                  >
                    Otkaži
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Čuvanje...' : 'Sačuvaj'}
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Izmeni igrača</DialogTitle>
              <DialogDescription>Izmenite podatke o igraču</DialogDescription>
            </DialogHeader>
            {editingPlayer && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  const updatedPlayer = {
                    ...editingPlayer,
                    first_name: formData.get('first_name') as string,
                    last_name: formData.get('last_name') as string,
                    birth_year: parseInt(formData.get('birth_year') as string),
                    team: editPlayerTeam === 'none' ? '' : editPlayerTeam,
                    image_url: editingPlayer.image_url || '',
                  }
                  await handleEditPlayer(updatedPlayer)
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_first_name">Ime</Label>
                    <Input
                      id="edit_first_name"
                      name="first_name"
                      defaultValue={editingPlayer.first_name}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_last_name">Prezime</Label>
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
                    <Label htmlFor="edit_team">Tim</Label>
                    {teams.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-2">
                        Nema timova. Dodajte timove prvo.
                      </div>
                    ) : (
                      <Select
                        value={editPlayerTeam}
                        onValueChange={(value) => setEditPlayerTeam(value)}
                      >
                        <SelectTrigger id="edit_team" className="w-full">
                          <SelectValue placeholder="Izaberi tim (opciono)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Bez tima</SelectItem>
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
                    <Label htmlFor="edit_player_image">Nova slika (opciono)</Label>
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
                      <p className="text-xs text-muted-foreground mt-1">
                        Trenutna slika: <a href={editingPlayer.image_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Pogledaj</a>
                      </p>
                    )}
                    {editPlayerImageFile && (
                      <p className="text-xs text-green-600 mt-1">
                        Nova slika: {editPlayerImageFile.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_birth_year">Godina rođenja</Label>
                    <Input
                      id="edit_birth_year"
                      name="birth_year"
                      type="number"
                      defaultValue={editingPlayer.birth_year}
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Checkbox
                      id="edit_injury"
                      checked={editPlayerInjury}
                      onCheckedChange={(checked) => setEditPlayerInjury(checked === true)}
                    />
                    <Label htmlFor="edit_injury" className="text-sm font-normal cursor-pointer">
                      Povređen
                    </Label>
                  </div>
                </div>

                {/* Player Ratings Section */}
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Ocene igrača (FIFA stil)</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Unesite ocene od 0 do 100 za svaki atribut
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
                        <div className="mb-4 p-3 bg-muted rounded-lg space-y-1">
                          {currentAvg !== null && (
                            <p className="text-sm font-medium">
                              Trenutni prosječni rating: <span className="text-lg font-bold">{currentAvg}</span>
                              {currentBonus !== 0 && (
                                <span className="text-xs ml-2 text-muted-foreground">
                                  (bazni: {baseAvg}, bonus: {currentBonus > 0 ? '+' : ''}{currentBonus})
                                </span>
                              )}
                            </p>
                          )}
                          {newAvg !== null && newAvg !== currentAvg && (
                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              Novi prosječni rating: <span className="text-lg font-bold">{newAvg}</span>
                              {currentAvg !== null && (
                                <span className="text-xs ml-2">
                                  ({newAvg > currentAvg ? '+' : ''}{newAvg - currentAvg})
                                </span>
                              )}
                              {newBonus !== 0 && (
                                <span className="text-xs ml-2 text-muted-foreground">
                                  (bonus: {newBonus > 0 ? '+' : ''}{newBonus})
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      )
                    })()}
                    {/* Bonus rating polje */}
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                      <Label htmlFor="rating_bonus" className="text-sm font-medium mb-2 block">
                        Bonus za prosječni rating
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
                          className="shrink-0"
                        >
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
                          className="shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Koristite +/- dugmad ili unesite broj. Bonus će se dodati na prosječni rating (ne mijenja ocene atributa). Bonus se čuva kada sačuvate formu.
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
                  >
                    Otkaži
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Čuvanje...' : 'Sačuvaj'}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Team Dialog */}
        <Dialog open={!!editingTeam} onOpenChange={(open) => !open && setEditingTeam(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Izmeni tim</DialogTitle>
              <DialogDescription>Izmenite podatke o timu</DialogDescription>
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
                    <Label htmlFor="edit_team_name">Naziv tima</Label>
                    <Input
                      id="edit_team_name"
                      name="name"
                      defaultValue={editingTeam.name}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_short_name">Skraćenica</Label>
                    <Input
                      id="edit_short_name"
                      name="short_name"
                      defaultValue={editingTeam.short_name || ''}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit_team_logo">Novi logo (opciono)</Label>
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
                    <p className="text-xs text-muted-foreground mt-1">
                      Trenutni logo: <a href={editingTeam.logo_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Pogledaj</a>
                    </p>
                  )}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {
                    setEditingTeam(null)
                    setEditTeamLogoFile(null)
                  }}>
                    Otkaži
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Čuvanje...' : 'Sačuvaj'}
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
