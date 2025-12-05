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
import {
  Home,
  LogOut,
  Plus,
  Trash2,
  TrendingUp,
  Calendar,
  Trophy,
  UserPlus,
  Users,
  Pencil,
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

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#a80710] flex items-center justify-center px-4">
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
      <div className="min-h-screen bg-[#a80710] flex items-center justify-center px-4">
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
    <div className="min-h-screen bg-[#a80710] py-4 sm:py-8 px-4 sm:px-6">
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
                        <div className="w-20 h-[100px] rounded-b-2xl overflow-hidden flex">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={player.image_url || '/no-image-player.png'}
                            alt={`${player.first_name} ${player.last_name}`}
                            className="w-full h-full object-cover"
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
          {/* Add Team Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Dodaj tim
              </CardTitle>
              <CardDescription>Unesite novi tim i uploadujte logo</CardDescription>
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
                      throw new Error(error.error || 'Greška pri dodavanju tima')
                    }

                    toast({
                      title: 'Uspešno!',
                      description: 'Tim je dodat',
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
                    <Input
                      id="team_name"
                      value={teamForm.name}
                      onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                      placeholder="npr. Real Madrid"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="short_name">Skraćenica</Label>
                    <Input
                      id="short_name"
                      value={teamForm.short_name}
                      onChange={(e) => setTeamForm({ ...teamForm, short_name: e.target.value })}
                      placeholder="npr. RM"
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
                        <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={team.logo_url || '/placeholder-logo.svg'}
                            alt={team.name}
                            className="w-full h-full object-cover"
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
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingPlayer(null)
                      setEditPlayerImageFile(null)
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
    </div>
  )
}
