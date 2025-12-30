'use client'

import { useState, useEffect } from 'react'
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
import { ArrowLeft, Plus, Trash2, X, ChevronRight, ChevronLeft } from 'lucide-react'
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

  const [formData, setFormData] = useState({
    home_team: '',
    away_team: '',
    home_score: '',
    away_score: '',
    date: new Date().toISOString().split('T')[0],
  })

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
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [teamsRes, playersRes] = await Promise.all([
        fetch('/api/teams'),
        fetch('/api/players'),
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
        title: 'Greška',
        description: 'Nešto je pošlo po zlu pri učitavanju podataka',
        variant: 'destructive',
      })
    } finally {
      setLoadingData(false)
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
        title: 'Greška',
        description: 'Molimo popunite sva polja',
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
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Greška pri dodavanju igrača')
      }

      const newPlayer = await response.json()

      // Dodaj novog igrača u listu
      setPlayers([...players, newPlayer])

      // Automatski ga izaberi
      togglePlayerSelection(newPlayer.id.toString(), newPlayerTeam)

      toast({
        title: 'Uspešno!',
        description: 'Igrač je dodat i automatski izabran',
      })

      setShowAddPlayerDialog(false)
      setNewPlayerForm({
        first_name: '',
        last_name: '',
        birth_year: new Date().getFullYear().toString(),
      })
    } catch (error: any) {
      toast({
        title: 'Greška',
        description: error.message || 'Nešto je pošlo po zlu',
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
        throw new Error('Morate izabrati oba tima')
      }

      if (formData.home_team === formData.away_team) {
        throw new Error('Timovi ne mogu biti isti')
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
            `Broj strijelaca za domaći tim (${homeGoals}) ne odgovara rezultatu (${formData.home_score}). Da li želite da nastavite?`
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
            `Broj strijelaca za gostujući tim (${awayGoals}) ne odgovara rezultatu (${formData.away_score}). Da li želite da nastavite?`
          )
          if (!confirm) {
            setLoading(false)
            return
          }
        }
      }

      const response = await fetch('/api/results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          home_score: parseInt(formData.home_score),
          away_score: parseInt(formData.away_score),
          goals: validGoals.map((g) => ({
            player_id: parseInt(g.player_id),
            team_type: g.team_type,
            goal_minute: null,
          })),
          players: validMatchPlayers.map((p) => ({
            player_id: parseInt(p.player_id),
            team_type: p.team_type,
          })),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Greška pri dodavanju rezultata')
      }

      toast({
        title: 'Uspešno!',
        description: 'Rezultat je dodat',
      })

      router.push('/admin')
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

  if (loadingData) {
    return (
      <div className="min-h-screen hero-bg flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-white">Učitavanje...</div>
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
    <div className="min-h-screen hero-bg py-4 sm:py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <Link href="/admin">
            <Button variant="outline" size="icon" className="shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Dodaj novu utakmicu</h1>
            <p className="text-blue-300/60 text-sm sm:text-base mt-1">Unesite rezultat, strijelce i igrače</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <Tabs value={currentStep} onValueChange={setCurrentStep} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 h-auto">
              <TabsTrigger value="teams" className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3">
                <span className="hidden sm:inline">1. </span>Timovi
              </TabsTrigger>
              <TabsTrigger 
                value="players" 
                disabled={!formData.home_team || !formData.away_team}
                className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3"
              >
                <span className="hidden sm:inline">2. </span>Igrači
              </TabsTrigger>
              <TabsTrigger 
                value="results" 
                disabled={!formData.home_team || !formData.away_team}
                className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3"
              >
                <span className="hidden sm:inline">3. </span>Rezultat
              </TabsTrigger>
            </TabsList>

            {/* Step 1: Teams */}
            <TabsContent value="teams">
              <Card className="border-blue-400/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl sm:text-2xl">Izaberite timove</CardTitle>
                  <CardDescription className="text-sm sm:text-base">Izaberite domaći i gostujući tim</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="home_team" className="text-sm sm:text-base font-medium">Domaći tim</Label>
                      {teams.length === 0 ? (
                        <div className="text-sm text-muted-foreground py-3 px-4 border rounded-lg bg-muted/50">
                          Nema timova. Dodajte timove prvo.
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
                      <Label htmlFor="away_team" className="text-sm sm:text-base font-medium">Gostujući tim</Label>
                      {teams.length === 0 ? (
                        <div className="text-sm text-muted-foreground py-3 px-4 border rounded-lg bg-muted/50">
                          Nema timova. Dodajte timove prvo.
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
                    <Label htmlFor="date" className="text-sm sm:text-base font-medium">Datum</Label>
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
                            title: 'Greška',
                            description: 'Morate izabrati oba tima i oni ne mogu biti isti',
                            variant: 'destructive',
                          })
                        }
                      }}
                      disabled={!formData.home_team || !formData.away_team || formData.home_team === formData.away_team}
                      className="w-full sm:w-auto"
                    >
                      Sledeći korak
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Step 2: Players */}
            <TabsContent value="players">
              <Card className="border-blue-400/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl sm:text-2xl">Igrači koji su igrali</CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Izaberite igrače koji su učestvovali u utakmici
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 sm:space-y-8">
                  {/* Home Team Players */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base sm:text-lg font-semibold">
                        {formData.home_team || 'Domaći tim'}
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddNewPlayer('home')}
                        className="text-xs sm:text-sm"
                      >
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        Dodaj igrača
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {homeTeamPlayers.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-6 px-4 border rounded-lg bg-muted/30">
                          Nema igrača u ovom timu. Kliknite "Dodaj igrača" da dodate novog.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {homeTeamPlayers.map((player) => (
                            <div
                              key={player.id}
                              className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
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
                        {formData.away_team || 'Gostujući tim'}
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddNewPlayer('away')}
                        className="text-xs sm:text-sm"
                      >
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        Dodaj igrača
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {awayTeamPlayers.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-6 px-4 border rounded-lg bg-muted/30">
                          Nema igrača u ovom timu. Kliknite "Dodaj igrača" da dodate novog.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {awayTeamPlayers.map((player) => (
                            <div
                              key={player.id}
                              className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
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
                      className="w-full sm:w-auto"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Nazad
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setCurrentStep('results')}
                      className="w-full sm:w-auto"
                    >
                      Sledeći korak
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Step 3: Results and Goals */}
            <TabsContent value="results">
              <Card className="border-blue-400/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl sm:text-2xl">Rezultat i strijelci</CardTitle>
                  <CardDescription className="text-sm sm:text-base">Unesite rezultat i dodajte strijelce</CardDescription>
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
                        Službeni rezultat (bez strijelaca)
                      </Label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="home_score" className="text-sm sm:text-base font-medium">Golovi domaćeg tima</Label>
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
                        <Label htmlFor="away_score" className="text-sm sm:text-base font-medium">Golovi gostujućeg tima</Label>
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
                          <h3 className="text-base sm:text-lg font-semibold mb-2">Strijelci</h3>
                          <p className="text-sm text-muted-foreground">
                            Kliknite na igrača da označite gol. Kliknite ponovo da uklonite.
                          </p>
                        </div>
                      </>
                    )}
                    {officialResult && (
                      <div className="text-sm text-muted-foreground text-center py-4 px-4 border rounded-lg bg-muted/30">
                        Službeni rezultat - nema strijelaca
                      </div>
                    )}

                    {!officialResult && selectedPlayers.length === 0 ? (
                      <div className="text-sm text-muted-foreground text-center py-6 px-4 border rounded-lg bg-muted/30">
                        Prvo izaberite igrače u prethodnom koraku.
                      </div>
                    ) : !officialResult && (
                      <div className="space-y-6">
                        {/* Home Team Goals */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-muted-foreground">
                            {formData.home_team || 'Domaći tim'}
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
                                    className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                                      goalCount > 0
                                        ? 'bg-primary/10 border-primary'
                                        : 'hover:bg-muted/50'
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
                          <h4 className="text-sm font-medium text-muted-foreground">
                            {formData.away_team || 'Gostujući tim'}
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
                                    className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                                      goalCount > 0
                                        ? 'bg-primary/10 border-primary'
                                        : 'hover:bg-muted/50'
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

                  <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep('players')}
                      className="w-full sm:w-auto"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Nazad
                    </Button>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                      <Link href="/admin" className="w-full sm:w-auto">
                        <Button type="button" variant="outline" className="w-full">
                          Otkaži
                        </Button>
                      </Link>
                      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                        {loading ? 'Čuvanje...' : 'Sačuvaj utakmicu'}
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dodaj novog igrača</DialogTitle>
              <DialogDescription>
                Dodajte novog igrača za tim: {newPlayerTeam === 'home' ? formData.home_team : formData.away_team}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new_player_first_name">Ime</Label>
                <Input
                  id="new_player_first_name"
                  value={newPlayerForm.first_name}
                  onChange={(e) =>
                    setNewPlayerForm({ ...newPlayerForm, first_name: e.target.value })
                  }
                  placeholder="Unesite ime"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_player_last_name">Prezime</Label>
                <Input
                  id="new_player_last_name"
                  value={newPlayerForm.last_name}
                  onChange={(e) =>
                    setNewPlayerForm({ ...newPlayerForm, last_name: e.target.value })
                  }
                  placeholder="Unesite prezime"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_player_birth_year">Godina rođenja</Label>
                <Input
                  id="new_player_birth_year"
                  type="number"
                  value={newPlayerForm.birth_year}
                  onChange={(e) =>
                    setNewPlayerForm({ ...newPlayerForm, birth_year: e.target.value })
                  }
                  placeholder="Unesite godinu rođenja"
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
              >
                Otkaži
              </Button>
              <Button
                type="button"
                onClick={submitNewPlayer}
                disabled={addingPlayer || !newPlayerForm.first_name || !newPlayerForm.last_name || !newPlayerForm.birth_year}
              >
                {addingPlayer ? 'Dodavanje...' : 'Dodaj igrača'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

