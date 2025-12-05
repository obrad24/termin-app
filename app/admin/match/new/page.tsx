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
  const [currentStep, setCurrentStep] = useState('teams')

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
    setGoals([
      ...goals,
      {
        id: Date.now().toString(),
        player_id: '',
        team_type: 'home',
      },
    ])
  }

  const removeGoal = (id: string) => {
    setGoals(goals.filter((g) => g.id !== id))
  }

  const updateGoal = (id: string, field: keyof Goal, value: string) => {
    setGoals(
      goals.map((g) => (g.id === id ? { ...g, [field]: value } : g))
    )
  }

  const addMatchPlayer = (teamType: 'home' | 'away' = 'home') => {
    setMatchPlayers([
      ...matchPlayers,
      {
        id: Date.now().toString(),
        player_id: '',
        team_type: teamType,
      },
    ])
  }

  const removeMatchPlayer = (id: string) => {
    setMatchPlayers(matchPlayers.filter((p) => p.id !== id))
  }

  const updateMatchPlayer = (id: string, field: keyof MatchPlayer, value: string) => {
    setMatchPlayers(
      matchPlayers.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    )
  }

  const getPlayersByTeam = (teamName: string) => {
    // Prikazujemo sve igrače jer igrač može igrati za bilo koji tim u utakmici
    // bez obzira na to koji tim je u njegovom profilu
    return players
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

      // Validacija igrača
      const validMatchPlayers = matchPlayers.filter(
        (p) => p.player_id && p.team_type
      )

      // Provera da li broj golova odgovara broju strijelaca
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
      <div className="min-h-screen bg-[#a80710] flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-white">Učitavanje...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Prikazujemo sve igrače za oba tima jer igrač može igrati za bilo koji tim
  const allPlayers = players

  return (
    <div className="min-h-screen bg-[#a80710] py-4 sm:py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <Link href="/admin">
            <Button variant="outline" size="icon" className="flex-shrink-0">
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
                          onValueChange={(value) =>
                            setFormData({ ...formData, home_team: value })
                          }
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
                          onValueChange={(value) =>
                            setFormData({ ...formData, away_team: value })
                          }
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
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <h3 className="text-base sm:text-lg font-semibold">
                        {formData.home_team || 'Domaći tim'}
                      </h3>
                      <Button
                        type="button"
                        onClick={() => addMatchPlayer('home')}
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Dodaj igrača
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {matchPlayers.filter(p => p.team_type === 'home').length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-6 px-4 border rounded-lg bg-muted/30">
                          Nema igrača. Kliknite "Dodaj igrača" da dodate.
                        </div>
                      ) : (
                        matchPlayers
                          .filter(p => p.team_type === 'home')
                          .map((matchPlayer) => (
                            <div
                              key={matchPlayer.id}
                              className="flex flex-col sm:flex-row gap-3 p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <Label className="text-sm mb-2 block">Igrač</Label>
                                <Select
                                  value={matchPlayer.player_id}
                                  onValueChange={(value) =>
                                    updateMatchPlayer(matchPlayer.id, 'player_id', value)
                                  }
                                >
                                  <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Izaberi igrača" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {allPlayers.map((player) => (
                                      <SelectItem
                                        key={player.id}
                                        value={player.id.toString()}
                                      >
                                        {player.first_name} {player.last_name}
                                        {player.team && ` (${player.team})`}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeMatchPlayer(matchPlayer.id)}
                                className="flex-shrink-0 self-end sm:self-center"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          ))
                      )}
                    </div>
                  </div>

                  {/* Away Team Players */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <h3 className="text-base sm:text-lg font-semibold">
                        {formData.away_team || 'Gostujući tim'}
                      </h3>
                      <Button
                        type="button"
                        onClick={() => addMatchPlayer('away')}
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Dodaj igrača
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {matchPlayers.filter(p => p.team_type === 'away').length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-6 px-4 border rounded-lg bg-muted/30">
                          Nema igrača. Kliknite "Dodaj igrača" da dodate.
                        </div>
                      ) : (
                        matchPlayers
                          .filter(p => p.team_type === 'away')
                          .map((matchPlayer) => (
                            <div
                              key={matchPlayer.id}
                              className="flex flex-col sm:flex-row gap-3 p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <Label className="text-sm mb-2 block">Igrač</Label>
                                <Select
                                  value={matchPlayer.player_id}
                                  onValueChange={(value) =>
                                    updateMatchPlayer(matchPlayer.id, 'player_id', value)
                                  }
                                >
                                  <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Izaberi igrača" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {allPlayers.map((player) => (
                                      <SelectItem
                                        key={player.id}
                                        value={player.id.toString()}
                                      >
                                        {player.first_name} {player.last_name}
                                        {player.team && ` (${player.team})`}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeMatchPlayer(matchPlayer.id)}
                                className="flex-shrink-0 self-end sm:self-center"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          ))
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

                  {/* Goals */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold">Strijelci</h3>
                        <p className="text-sm text-muted-foreground">
                          Dodajte strijelce sa utakmice
                        </p>
                      </div>
                      <Button type="button" onClick={addGoal} size="sm" variant="outline" className="w-full sm:w-auto">
                        <Plus className="w-4 h-4 mr-2" />
                        Dodaj strijelca
                      </Button>
                    </div>

                    {goals.length === 0 ? (
                      <div className="text-sm text-muted-foreground text-center py-6 px-4 border rounded-lg bg-muted/30">
                        Nema strijelaca. Kliknite "Dodaj strijelca" da dodate.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {goals.map((goal) => (
                          <div
                            key={goal.id}
                            className="flex flex-col sm:flex-row gap-3 p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <Label className="text-sm mb-2 block">Tim</Label>
                              <Select
                                value={goal.team_type}
                                onValueChange={(value: 'home' | 'away') =>
                                  updateGoal(goal.id, 'team_type', value)
                                }
                              >
                                <SelectTrigger className="h-11">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="home">
                                    {formData.home_team || 'Domaći'}
                                  </SelectItem>
                                  <SelectItem value="away">
                                    {formData.away_team || 'Gostujući'}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex-1 min-w-0">
                              <Label className="text-sm mb-2 block">Igrač</Label>
                              <Select
                                value={goal.player_id}
                                onValueChange={(value) =>
                                  updateGoal(goal.id, 'player_id', value)
                                }
                              >
                                <SelectTrigger className="h-11">
                                  <SelectValue placeholder="Izaberi igrača" />
                                </SelectTrigger>
                                <SelectContent>
                                  {allPlayers.map((player) => (
                                    <SelectItem
                                      key={player.id}
                                      value={player.id.toString()}
                                    >
                                      {player.first_name} {player.last_name}
                                      {player.team && ` (${player.team})`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeGoal(goal.id)}
                              className="flex-shrink-0 self-end sm:self-center"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
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
      </div>
    </div>
  )
}

