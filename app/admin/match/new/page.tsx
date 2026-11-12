'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Player, Team } from '@/lib/supabase'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Plus, Trash2, X, ChevronRight, ChevronLeft, ImagePlus } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import NextImage from 'next/image'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useSeason } from '@/components/season-provider'

const adminPanel =
  'bg-[var(--fpl-purple)] border-white/10 text-white shadow-none'
const adminDialog =
  'bg-[var(--fpl-purple)] border-white/10 text-white'
const adminOutlineBtn =
  'border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white'
const adminPrimaryBtn =
  'bg-[var(--fpl-green)] text-[var(--fpl-purple)] hover:bg-[var(--fpl-green)]/90'

interface Goal {
  id: string
  player_id: string
  team_type: 'home' | 'away'
}

interface MatchPlayer {
  id: string
  player_id: string
  team_type: 'home' | 'away'
}

export default function NewMatchPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const { currentSeason } = useSeason()
  const matchImageInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    home_team: '',
    away_team: '',
    home_score: '',
    away_score: '',
    date: new Date().toISOString().split('T')[0],
    summary_comment: '',
    image_url: '',
  })
  const [imagePreview, setImagePreview] = useState<string>('')
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const [goals, setGoals] = useState<Goal[]>([])
  const [matchPlayers, setMatchPlayers] = useState<MatchPlayer[]>([])
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set())
  const [currentStep, setCurrentStep] = useState('teams')
  const [showAddPlayerDialog, setShowAddPlayerDialog] = useState(false)
  const [newPlayerTeam, setNewPlayerTeam] = useState<'home' | 'away'>('home')
  const [newPlayerForm, setNewPlayerForm] = useState({
    first_name: '',
    last_name: '',
    birth_year: new Date().getFullYear().toString(),
  })
  const [addingPlayer, setAddingPlayer] = useState(false)
  const [officialResult, setOfficialResult] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/check', { credentials: 'include' })
        if (!response.ok) {
          router.replace('/admin')
          return
        }
        const data = await response.json()
        if (!data.authenticated) {
          router.replace('/admin')
          return
        }
        setAuthChecked(true)
      } catch {
        router.replace('/admin')
      }
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    if (!authChecked) return
    fetchData()
  }, [authChecked, currentSeason?.id])

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  const fetchData = async () => {
    try {
      const [teamsRes, playersRes] = await Promise.all([
        fetch(`/api/teams${currentSeason ? `?season_id=${currentSeason.id}` : ''}`),
        fetch(`/api/players${currentSeason ? `?season_id=${currentSeason.id}` : ''}`),
      ])

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json()
        setTeams(teamsData || [])
      }

      if (playersRes.ok) {
        const playersData = await playersRes.json()
        setPlayers(playersData || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: 'Error',
        description: 'Something went wrong while loading data',
        variant: 'destructive',
      })
    } finally {
      setLoadingData(false)
    }
  }

  const clearMatchImage = () => {
    if (imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview)
    }
    setImagePreview('')
    setPendingImageFile(null)
    setFormData((prev) => ({ ...prev, image_url: '' }))
    if (matchImageInputRef.current) {
      matchImageInputRef.current.value = ''
    }
  }

  const uploadMatchImage = async (file: File): Promise<string> => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/matches/upload', {
      method: 'POST',
      body: fd,
      credentials: 'include',
    })

    let data: any = null
    try {
      data = await res.json()
    } catch {
      data = null
    }

    if (res.status === 401) {
      throw new Error('Admin session expired. Please log in again.')
    }
    if (!res.ok) {
      throw new Error(data?.details || data?.error || data?.message || 'Upload failed')
    }
    if (!data?.url) {
      throw new Error('Upload succeeded but no image URL was returned')
    }
    return data.url as string
  }

  const handleMatchImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview)
    }

    const localPreview = URL.createObjectURL(file)
    setPendingImageFile(file)
    setImagePreview(localPreview)
    setUploadingImage(true)

    try {
      const url = await uploadMatchImage(file)
      setFormData((prev) => ({ ...prev, image_url: url }))
      setPendingImageFile(null)
      toast({ title: 'Image uploaded' })
    } catch (err: any) {
      toast({
        title: 'Upload failed',
        description: err.message || 'Could not upload image',
        variant: 'destructive',
      })
      // Keep local preview + pending file so submit can retry upload
    } finally {
      setUploadingImage(false)
      e.target.value = ''
    }
  }

  const addGoal = () => {
    // Ova funkcija se sada koristi samo za inicijalizaciju, pravi gol se dodaje direktno u onClick handleru
  }

  const removeGoal = (id: string) => {
    setGoals(goals.filter((g) => g.id !== id))
  }

  const togglePlayerSelection = (playerId: string, teamType: 'home' | 'away') => {
    const key = `${playerId}-${teamType}`
    setSelectedPlayerIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  const isPlayerSelected = (playerId: string, teamType: 'home' | 'away') => {
    return selectedPlayerIds.has(`${playerId}-${teamType}`)
  }

  const getPlayersByTeam = (teamName: string) => {
    if (!teamName) return []
    return players.filter((player) => player.team === teamName)
  }

  const getSelectedPlayers = () => {
    const selected: MatchPlayer[] = []
    selectedPlayerIds.forEach((key) => {
      const [playerId, teamType] = key.split('-')
      selected.push({
        id: key,
        player_id: playerId,
        team_type: teamType as 'home' | 'away',
      })
    })
    return selected
  }

  const handleAddNewPlayer = (teamType: 'home' | 'away') => {
    setNewPlayerTeam(teamType)
    setNewPlayerForm({
      first_name: '',
      last_name: '',
      birth_year: new Date().getFullYear().toString(),
    })
    setShowAddPlayerDialog(true)
  }

  const submitNewPlayer = async () => {
    if (!newPlayerForm.first_name || !newPlayerForm.last_name || !newPlayerForm.birth_year) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      })
      return
    }

    setAddingPlayer(true)
    try {
      const teamName = newPlayerTeam === 'home' ? formData.home_team : formData.away_team
      
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: newPlayerForm.first_name,
          last_name: newPlayerForm.last_name,
          birth_year: parseInt(newPlayerForm.birth_year),
          team: teamName,
          season_id: currentSeason?.id ?? null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error adding player')
      }

      const newPlayer = await response.json()

      // Dodaj novog igrača u listu
      setPlayers([...players, newPlayer])

      // Automatski ga izaberi
      togglePlayerSelection(newPlayer.id.toString(), newPlayerTeam)

      toast({
        title: 'Success!',
        description: 'Player added and automatically selected',
      })

      setShowAddPlayerDialog(false)
      setNewPlayerForm({
        first_name: '',
        last_name: '',
        birth_year: new Date().getFullYear().toString(),
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      })
    } finally {
      setAddingPlayer(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validacija
      if (!formData.home_team || !formData.away_team) {
        throw new Error('You must select both teams')
      }

      if (formData.home_team === formData.away_team) {
        throw new Error('Teams cannot be the same')
      }

      // Validacija strijelaca
      const validGoals = goals.filter(
        (g) => g.player_id && g.team_type
      )

      // Validacija igrača - koristimo izabrane igrače iz checkbox-ova
      const selectedPlayers = getSelectedPlayers()
      const validMatchPlayers = selectedPlayers.filter(
        (p) => p.player_id && p.team_type
      )

      // Provera da li broj golova odgovara broju strijelaca (samo ako nije službeni rezultat)
      if (!officialResult) {
        const homeGoals = validGoals.filter((g) => g.team_type === 'home').length
        const awayGoals = validGoals.filter((g) => g.team_type === 'away').length

        if (
          homeGoals > 0 &&
          parseInt(formData.home_score) !== homeGoals
        ) {
          const confirm = window.confirm(
            `Number of scorers for the home team (${homeGoals}) does not match the score (${formData.home_score}). Do you want to continue?`
          )
          if (!confirm) {
            setLoading(false)
            return
          }
        }

        if (
          awayGoals > 0 &&
          parseInt(formData.away_score) !== awayGoals
        ) {
          const confirm = window.confirm(
            `Number of scorers for the away team (${awayGoals}) does not match the score (${formData.away_score}). Do you want to continue?`
          )
          if (!confirm) {
            setLoading(false)
            return
          }
        }
      }

      let imageUrl = formData.image_url.trim()
      if (!imageUrl && pendingImageFile) {
        setUploadingImage(true)
        try {
          imageUrl = await uploadMatchImage(pendingImageFile)
          setFormData((prev) => ({ ...prev, image_url: imageUrl }))
          setPendingImageFile(null)
        } finally {
          setUploadingImage(false)
        }
      }

      const response = await fetch('/api/results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          home_team: formData.home_team,
          away_team: formData.away_team,
          date: formData.date,
          home_score: parseInt(formData.home_score),
          away_score: parseInt(formData.away_score),
          summary_comment: formData.summary_comment.trim() || null,
          image_url: imageUrl || null,
          goals: validGoals.map((g) => ({
            player_id: parseInt(g.player_id),
            team_type: g.team_type,
            goal_minute: null,
          })),
          players: validMatchPlayers.map((p) => ({
            player_id: parseInt(p.player_id),
            team_type: p.team_type,
          })),
          season_id: currentSeason?.id ?? null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error adding result')
      }

      toast({
        title: 'Success!',
        description: 'Result added',
      })

      router.push('/admin')
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

  if (!authChecked || loadingData) {
    return (
      <div className="min-h-screen bg-[var(--fpl-p120)] flex items-center justify-center px-4">
        <Card className={`w-full max-w-md ${adminPanel}`}>
          <CardContent className="pt-6">
            <div className="text-center text-white">Loading...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Dobijamo igrače za izabrane timove
  const homeTeamPlayers = getPlayersByTeam(formData.home_team)
  const awayTeamPlayers = getPlayersByTeam(formData.away_team)
  const selectedPlayers = getSelectedPlayers()

  return (
    <div className="min-h-screen bg-[var(--fpl-p120)] py-4 sm:py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <Link href="/admin">
            <Button variant="outline" size="icon" className={`shrink-0 ${adminOutlineBtn}`}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Add new match</h1>
            <p className="text-white/50 text-sm sm:text-base mt-1">Enter the result, scorers, and players</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <Tabs value={currentStep} onValueChange={setCurrentStep} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 h-auto bg-[var(--fpl-p90)] border border-white/10">
              <TabsTrigger value="teams" className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3">
                <span className="hidden sm:inline">1. </span>Teams
              </TabsTrigger>
              <TabsTrigger 
                value="players" 
                disabled={!formData.home_team || !formData.away_team}
                className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3"
              >
                <span className="hidden sm:inline">2. </span>Players
              </TabsTrigger>
              <TabsTrigger 
                value="results" 
                disabled={!formData.home_team || !formData.away_team}
                className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3"
              >
                <span className="hidden sm:inline">3. </span>Result
              </TabsTrigger>
            </TabsList>

            {/* Step 1: Teams */}
            <TabsContent value="teams">
              <Card className={`${adminPanel}`}>
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl sm:text-2xl text-white">Select teams</CardTitle>
                  <CardDescription className="text-sm sm:text-base text-white/50">Select the home and away team</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="home_team" className="text-sm sm:text-base font-medium">Home team</Label>
                      {teams.length === 0 ? (
                        <div className="text-sm text-white/50 py-3 px-4 border border-white/10 rounded-lg bg-white/5">
                          No teams. Add teams first.
                        </div>
                      ) : (
                        <Select
                          value={formData.home_team}
                          onValueChange={(value) => {
                            setFormData({ ...formData, home_team: value })
                            // Očisti izabrane igrače kada se promeni tim
                            setSelectedPlayerIds(new Set())
                            setGoals([])
                          }}
                          required
                        >
                          <SelectTrigger id="home_team" className="h-11">
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
                      <Label htmlFor="away_team" className="text-sm sm:text-base font-medium">Away team</Label>
                      {teams.length === 0 ? (
                        <div className="text-sm text-white/50 py-3 px-4 border border-white/10 rounded-lg bg-white/5">
                          No teams. Add teams first.
                        </div>
                      ) : (
                        <Select
                          value={formData.away_team}
                          onValueChange={(value) => {
                            setFormData({ ...formData, away_team: value })
                            // Očisti izabrane igrače kada se promeni tim
                            setSelectedPlayerIds(new Set())
                            setGoals([])
                          }}
                          required
                        >
                          <SelectTrigger id="away_team" className="h-11">
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
                    <Label htmlFor="date" className="text-sm sm:text-base font-medium">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="flex justify-end pt-2 sm:pt-4">
                    <Button
                      type="button"
                      onClick={() => {
                        if (formData.home_team && formData.away_team && formData.home_team !== formData.away_team) {
                          setCurrentStep('players')
                        } else {
                          toast({
                            title: 'Error',
                            description: 'You must select both teams and they cannot be the same',
                            variant: 'destructive',
                          })
                        }
                      }}
                      disabled={!formData.home_team || !formData.away_team || formData.home_team === formData.away_team}
                      className={`w-full sm:w-auto ${adminPrimaryBtn}`}
                    >
                      Next step
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Step 2: Players */}
            <TabsContent value="players">
              <Card className={`${adminPanel}`}>
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl sm:text-2xl text-white">Players who played</CardTitle>
                  <CardDescription className="text-sm sm:text-base text-white/50">
                    Select the players who took part in the match
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 sm:space-y-8">
                  {/* Home Team Players */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base sm:text-lg font-semibold">
                        {formData.home_team || 'Home team'}
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddNewPlayer('home')}
                        className={`text-xs sm:text-sm ${adminOutlineBtn}`}
                      >
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        Add player
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {homeTeamPlayers.length === 0 ? (
                        <div className="text-sm text-white/50 text-center py-6 px-4 border border-white/10 rounded-lg bg-white/5">
                          No players on this team. Click "Add player" to add one.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {homeTeamPlayers.map((player) => (
                            <div
                              key={player.id}
                              className="flex items-center space-x-3 p-3 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                            >
                              <Checkbox
                                checked={isPlayerSelected(player.id.toString(), 'home')}
                                onCheckedChange={() => togglePlayerSelection(player.id.toString(), 'home')}
                                id={`player-${player.id}-home`}
                              />
                              <Label 
                                htmlFor={`player-${player.id}-home`}
                                className="flex-1 cursor-pointer text-sm sm:text-base"
                              >
                                {player.first_name} {player.last_name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Away Team Players */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base sm:text-lg font-semibold">
                        {formData.away_team || 'Away team'}
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddNewPlayer('away')}
                        className={`text-xs sm:text-sm ${adminOutlineBtn}`}
                      >
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        Add player
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {awayTeamPlayers.length === 0 ? (
                        <div className="text-sm text-white/50 text-center py-6 px-4 border border-white/10 rounded-lg bg-white/5">
                          No players on this team. Click "Add player" to add one.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {awayTeamPlayers.map((player) => (
                            <div
                              key={player.id}
                              className="flex items-center space-x-3 p-3 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                            >
                              <Checkbox
                                checked={isPlayerSelected(player.id.toString(), 'away')}
                                onCheckedChange={() => togglePlayerSelection(player.id.toString(), 'away')}
                                id={`player-${player.id}-away`}
                              />
                              <Label 
                                htmlFor={`player-${player.id}-away`}
                                className="flex-1 cursor-pointer text-sm sm:text-base"
                              >
                                {player.first_name} {player.last_name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep('teams')}
                      className={`w-full sm:w-auto ${adminOutlineBtn}`}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setCurrentStep('results')}
                      className={`w-full sm:w-auto ${adminPrimaryBtn}`}
                    >
                      Next step
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Step 3: Results and Goals */}
            <TabsContent value="results">
              <Card className={`${adminPanel}`}>
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl sm:text-2xl text-white">Result and scorers</CardTitle>
                  <CardDescription className="text-sm sm:text-base text-white/50">Enter the result and add scorers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 sm:space-y-8">
                  {/* Score */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="official_result"
                        checked={officialResult}
                        onCheckedChange={(checked) => {
                          setOfficialResult(checked === true)
                          if (checked) {
                            // Ako je službeni rezultat, obriši sve golove
                            setGoals([])
                          }
                        }}
                      />
                      <Label
                        htmlFor="official_result"
                        className="text-sm sm:text-base font-medium cursor-pointer"
                      >
                        Official result (no scorers)
                      </Label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="home_score" className="text-sm sm:text-base font-medium">Home team goals</Label>
                        <Input
                          id="home_score"
                          type="number"
                          min="0"
                          value={formData.home_score}
                          onChange={(e) =>
                            setFormData({ ...formData, home_score: e.target.value })
                          }
                          required
                          className="h-11 text-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="away_score" className="text-sm sm:text-base font-medium">Away team goals</Label>
                        <Input
                          id="away_score"
                          type="number"
                          min="0"
                          value={formData.away_score}
                          onChange={(e) =>
                            setFormData({ ...formData, away_score: e.target.value })
                          }
                          required
                          className="h-11 text-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Goals */}
                  <div className="space-y-4">
                    {!officialResult && (
                      <>
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold mb-2">Scorers</h3>
                          <p className="text-sm text-white/50">
                            Click a player to mark a goal. Click again to remove.
                          </p>
                        </div>
                      </>
                    )}
                    {officialResult && (
                      <div className="text-sm text-white/50 text-center py-4 px-4 border border-white/10 rounded-lg bg-white/5">
                        Official result — no scorers
                      </div>
                    )}

                    {!officialResult && selectedPlayers.length === 0 ? (
                      <div className="text-sm text-white/50 text-center py-6 px-4 border border-white/10 rounded-lg bg-white/5">
                        First select players in the previous step.
                      </div>
                    ) : !officialResult && (
                      <div className="space-y-6">
                        {/* Home Team Goals */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-white/50">
                            {formData.home_team || 'Home team'}
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {selectedPlayers
                              .filter((p) => p.team_type === 'home')
                              .map((matchPlayer) => {
                                const player = players.find(
                                  (pl) => pl.id.toString() === matchPlayer.player_id
                                )
                                if (!player) return null
                                const goalCount = goals.filter(
                                  (g) =>
                                    g.player_id === matchPlayer.player_id &&
                                    g.team_type === 'home'
                                ).length
                                return (
                                  <div
                                    key={matchPlayer.id}
                                    className={`flex items-center justify-between p-3 border border-white/10 rounded-lg transition-colors ${
                                      goalCount > 0
                                        ? 'bg-[var(--fpl-green)]/15 border-[var(--fpl-green)]/50'
                                        : 'hover:bg-white/5'
                                    }`}
                                  >
                                    <span
                                      className="flex-1 text-sm sm:text-base cursor-pointer"
                                      onClick={() => {
                                        // Dodaj gol
                                        const newGoal = {
                                          id: Date.now().toString(),
                                          player_id: matchPlayer.player_id,
                                          team_type: 'home' as const,
                                        }
                                        setGoals([...goals, newGoal])
                                      }}
                                    >
                                      {player.first_name} {player.last_name}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      {goalCount > 0 && (
                                        <>
                                          <span className="text-lg font-bold text-primary min-w-6 text-center">
                                            {goalCount}
                                          </span>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => {
                                              // Ukloni poslednji gol
                                              const goalToRemove = goals
                                                .filter(
                                                  (g) =>
                                                    g.player_id === matchPlayer.player_id &&
                                                    g.team_type === 'home'
                                                )
                                                .pop()
                                              if (goalToRemove) {
                                                removeGoal(goalToRemove.id)
                                              }
                                            }}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                          </div>
                        </div>

                        {/* Away Team Goals */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-white/50">
                            {formData.away_team || 'Away team'}
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {selectedPlayers
                              .filter((p) => p.team_type === 'away')
                              .map((matchPlayer) => {
                                const player = players.find(
                                  (pl) => pl.id.toString() === matchPlayer.player_id
                                )
                                if (!player) return null
                                const goalCount = goals.filter(
                                  (g) =>
                                    g.player_id === matchPlayer.player_id &&
                                    g.team_type === 'away'
                                ).length
                                return (
                                  <div
                                    key={matchPlayer.id}
                                    className={`flex items-center justify-between p-3 border border-white/10 rounded-lg transition-colors ${
                                      goalCount > 0
                                        ? 'bg-[var(--fpl-green)]/15 border-[var(--fpl-green)]/50'
                                        : 'hover:bg-white/5'
                                    }`}
                                  >
                                    <span
                                      className="flex-1 text-sm sm:text-base cursor-pointer"
                                      onClick={() => {
                                        // Dodaj gol
                                        const newGoal = {
                                          id: Date.now().toString(),
                                          player_id: matchPlayer.player_id,
                                          team_type: 'away' as const,
                                        }
                                        setGoals([...goals, newGoal])
                                      }}
                                    >
                                      {player.first_name} {player.last_name}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      {goalCount > 0 && (
                                        <>
                                          <span className="text-lg font-bold text-primary min-w-6 text-center">
                                            {goalCount}
                                          </span>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => {
                                              // Ukloni poslednji gol
                                              const goalToRemove = goals
                                                .filter(
                                                  (g) =>
                                                    g.player_id === matchPlayer.player_id &&
                                                    g.team_type === 'away'
                                                )
                                                .pop()
                                              if (goalToRemove) {
                                                removeGoal(goalToRemove.id)
                                              }
                                            }}
                                          >
                                            <X className="h-3 w-3" />
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

                  {/* Match news card fields */}
                  <div className="space-y-4 pt-2 border-t">
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold mb-1">Match news</h3>
                      <p className="text-sm text-white/50">
                        Short comment and optional image shown on Fixtures & Results.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="summary_comment">Short comment</Label>
                      <Textarea
                        id="summary_comment"
                        value={formData.summary_comment}
                        onChange={(e) =>
                          setFormData({ ...formData, summary_comment: e.target.value })
                        }
                        placeholder="e.g. Dominant display seals derby win"
                        maxLength={160}
                        rows={3}
                      />
                      <p className="text-xs text-white/50 text-right">
                        {formData.summary_comment.length}/160
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="match_image">Match image</Label>
                      <div className="flex flex-col sm:flex-row gap-4 items-start">
                        <input
                          ref={matchImageInputRef}
                          id="match_image"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          disabled={uploadingImage}
                          onChange={handleMatchImageChange}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={uploadingImage}
                          className={`${adminOutlineBtn} border-dashed`}
                          onClick={() => matchImageInputRef.current?.click()}
                        >
                          <ImagePlus className="w-4 h-4" />
                          {uploadingImage ? 'Uploading...' : formData.image_url || imagePreview ? 'Change image' : 'Upload image'}
                        </Button>
                        {(imagePreview || formData.image_url) && (
                          <div className="relative w-28 h-20 rounded-lg overflow-hidden border border-white/20">
                            <NextImage
                              src={imagePreview || formData.image_url}
                              alt="Match preview"
                              fill
                              className="object-cover"
                              unoptimized
                            />
                            <button
                              type="button"
                              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                              onClick={clearMatchImage}
                              aria-label="Remove match image"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                      {pendingImageFile && !formData.image_url && (
                        <p className="text-xs text-amber-300">
                          Preview ready — image will upload when you save the match.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep('players')}
                      className={`w-full sm:w-auto ${adminOutlineBtn}`}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                      <Link href="/admin" className="w-full sm:w-auto">
                        <Button type="button" variant="outline" className={`w-full ${adminOutlineBtn}`}>
                          Cancel
                        </Button>
                      </Link>
                      <Button type="submit" disabled={loading || uploadingImage} className={`w-full sm:w-auto ${adminPrimaryBtn}`}>
                        {loading ? 'Saving...' : 'Save match'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>

        {/* Dialog za dodavanje novog igrača */}
        <Dialog open={showAddPlayerDialog} onOpenChange={setShowAddPlayerDialog}>
          <DialogContent className={adminDialog}>
            <DialogHeader>
              <DialogTitle className="text-white">Add new player</DialogTitle>
              <DialogDescription className="text-white/50">
                Add a new player for team: {newPlayerTeam === 'home' ? formData.home_team : formData.away_team}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new_player_first_name">First name</Label>
                <Input
                  id="new_player_first_name"
                  value={newPlayerForm.first_name}
                  onChange={(e) =>
                    setNewPlayerForm({ ...newPlayerForm, first_name: e.target.value })
                  }
                  placeholder="Enter first name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_player_last_name">Last name</Label>
                <Input
                  id="new_player_last_name"
                  value={newPlayerForm.last_name}
                  onChange={(e) =>
                    setNewPlayerForm({ ...newPlayerForm, last_name: e.target.value })
                  }
                  placeholder="Enter last name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_player_birth_year">Year of birth</Label>
                <Input
                  id="new_player_birth_year"
                  type="number"
                  value={newPlayerForm.birth_year}
                  onChange={(e) =>
                    setNewPlayerForm({ ...newPlayerForm, birth_year: e.target.value })
                  }
                  placeholder="Enter year of birth"
                  min="1950"
                  max={new Date().getFullYear()}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddPlayerDialog(false)}
                disabled={addingPlayer}
                className={adminOutlineBtn}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={submitNewPlayer}
                disabled={addingPlayer || !newPlayerForm.first_name || !newPlayerForm.last_name || !newPlayerForm.birth_year}
                className={adminPrimaryBtn}
              >
                {addingPlayer ? 'Adding...' : 'Add player'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

