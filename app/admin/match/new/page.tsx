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
import { ArrowLeft, Plus, Trash2, X } from 'lucide-react'
import Link from 'next/link'

interface Goal {
  id: string
  player_id: string
  team_type: 'home' | 'away'
  goal_minute?: string
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
        goal_minute: '',
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

  const addMatchPlayer = () => {
    setMatchPlayers([
      ...matchPlayers,
      {
        id: Date.now().toString(),
        player_id: '',
        team_type: 'home',
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
            goal_minute: g.goal_minute ? parseInt(g.goal_minute) : null,
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
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-800 to-purple-900 flex items-center justify-center px-4">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-800 to-purple-900 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Dodaj novu utakmicu</h1>
            <p className="text-blue-300/60 mt-1">Unesite rezultat, strijelce i igrače</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Osnovni podaci */}
          <Card>
            <CardHeader>
              <CardTitle>Osnovni podaci</CardTitle>
              <CardDescription>Unesite timove, rezultat i datum</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="home_team">Domaći tim</Label>
                  {teams.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-2">
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
                      <SelectTrigger id="home_team">
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
                  <Label htmlFor="away_team">Gostujući tim</Label>
                  {teams.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-2">
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
                      <SelectTrigger id="away_team">
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="home_score">Golovi domaćeg tima</Label>
                  <Input
                    id="home_score"
                    type="number"
                    min="0"
                    value={formData.home_score}
                    onChange={(e) =>
                      setFormData({ ...formData, home_score: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="away_score">Golovi gostujućeg tima</Label>
                  <Input
                    id="away_score"
                    type="number"
                    min="0"
                    value={formData.away_score}
                    onChange={(e) =>
                      setFormData({ ...formData, away_score: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="date">Datum</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Strijelci */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Strijelci</CardTitle>
                  <CardDescription>Dodajte strijelce sa utakmice</CardDescription>
                </div>
                <Button type="button" onClick={addGoal} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Dodaj strijelca
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {goals.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Nema strijelaca. Kliknite "Dodaj strijelca" da dodate.
                </div>
              ) : (
                goals.map((goal) => (
                  <div
                    key={goal.id}
                    className="flex gap-3 items-end p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <Label>Tim</Label>
                      <Select
                        value={goal.team_type}
                        onValueChange={(value: 'home' | 'away') =>
                          updateGoal(goal.id, 'team_type', value)
                        }
                      >
                        <SelectTrigger>
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
                    <div className="flex-1">
                      <Label>Igrač</Label>
                      <Select
                        value={goal.player_id}
                        onValueChange={(value) =>
                          updateGoal(goal.id, 'player_id', value)
                        }
                      >
                        <SelectTrigger>
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
                    <div className="w-24">
                      <Label>Minuta</Label>
                      <Input
                        type="number"
                        min="1"
                        max="120"
                        value={goal.goal_minute}
                        onChange={(e) =>
                          updateGoal(goal.id, 'goal_minute', e.target.value)
                        }
                        placeholder="npr. 45"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeGoal(goal.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Igrači koji su igrali */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Igrači koji su igrali</CardTitle>
                  <CardDescription>
                    Izaberite igrače koji su učestvovali u utakmici
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  onClick={addMatchPlayer}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Dodaj igrača
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {matchPlayers.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Nema igrača. Kliknite "Dodaj igrača" da dodate.
                </div>
              ) : (
                matchPlayers.map((matchPlayer) => (
                  <div
                    key={matchPlayer.id}
                    className="flex gap-3 items-end p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <Label>Tim</Label>
                      <Select
                        value={matchPlayer.team_type}
                        onValueChange={(value: 'home' | 'away') =>
                          updateMatchPlayer(matchPlayer.id, 'team_type', value)
                        }
                      >
                        <SelectTrigger>
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
                    <div className="flex-1">
                      <Label>Igrač</Label>
                      <Select
                        value={matchPlayer.player_id}
                        onValueChange={(value) =>
                          updateMatchPlayer(matchPlayer.id, 'player_id', value)
                        }
                      >
                        <SelectTrigger>
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
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Submit buttons */}
          <div className="flex gap-4">
            <Link href="/admin" className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                Otkaži
              </Button>
            </Link>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Čuvanje...' : 'Sačuvaj utakmicu'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

