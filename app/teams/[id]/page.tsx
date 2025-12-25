'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Trophy, Users, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { getPlayerImageUrl } from '@/lib/image-utils'

interface Team {
  id: number
  name: string
  short_name?: string | null
  logo_url?: string | null
  created_at?: string
}

interface Player {
  id: number
  first_name: string
  last_name: string
  birth_year: number
  team?: string | null
  image_url?: string | null
}

interface TopScorer {
  player_id: number
  goals: number
  player: Player | null
}

interface TeamData {
  team: Team
  players: Player[]
  topScorers: TopScorer[]
  matchesCount: number
}

export default function TeamProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [teamData, setTeamData] = useState<TeamData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchTeamData()
    }
  }, [params.id])

  const fetchTeamData = async () => {
    try {
      const response = await fetch(`/api/teams/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setTeamData(data)
      } else if (response.status === 404) {
        router.push('/')
      }
    } catch (error) {
      console.error('Error fetching team data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#a80710] pb-20 md:pb-0">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="text-white text-center">Učitavanje...</div>
        </div>
      </main>
    )
  }

  if (!teamData) {
    return (
      <main className="min-h-screen bg-[#a80710] pb-20 md:pb-0">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="text-white text-center">
            <h1 className="text-2xl font-bold mb-4">Tim nije pronađen</h1>
            <Link href="/">
              <Button variant="outline">Nazad na početnu</Button>
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const { team, players, topScorers, matchesCount } = teamData

  return (
    <main className="min-h-screen bg-[#a80710]">
      <Header />
      <section className="relative px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-7xl mx-auto pt-24 sm:pt-28">
        <div className="space-y-6 sm:space-y-8">
          {/* Back Button */}
          <Link href="/">
            <Button variant="outline" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Nazad
            </Button>
          </Link>

          {/* Team Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden bg-slate-700/50 flex items-center justify-center border-4 border-blue-400/30 shadow-lg">
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
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">
                {team.name}
              </h1>
              {team.short_name && (
                <p className="text-blue-300/60 text-lg sm:text-xl mb-4">
                  {team.short_name}
                </p>
              )}
              <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
                <div className="flex items-center gap-2 text-white/80">
                  <Users className="w-5 h-5" />
                  <span>{players.length} igrača</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <Trophy className="w-5 h-5" />
                  <span>{matchesCount} utakmica</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Players Section */}
            <Card className="border-blue-400/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                  <Users className="w-6 h-6" />
                  Sastav tima
                </CardTitle>
              </CardHeader>
              <CardContent>
                {players.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nema igrača u timu
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto">
                    {players.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center flex-shrink-0">
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
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm sm:text-base truncate">
                            {player.first_name} {player.last_name}
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            {player.birth_year}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Scorers Section */}
            <Card className="border-blue-400/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                  <Target className="w-6 h-6" />
                  Najbolji strijelci
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topScorers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nema strijelaca
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topScorers.map((scorer, index) => (
                      <div
                        key={scorer.player_id}
                        className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-500 text-white font-bold text-lg flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center flex-shrink-0">
                          {scorer.player ? (
                            <Image
                              src={getPlayerImageUrl(scorer.player?.image_url)}
                              alt={`${scorer.player.first_name} ${scorer.player.last_name}`}
                              fill
                              className="object-cover"
                              unoptimized
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = '/no-image-player.png'
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-600 flex items-center justify-center text-xs text-white">
                              ?
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm sm:text-base truncate">
                            {scorer.player
                              ? `${scorer.player.first_name} ${scorer.player.last_name}`
                              : `Igrač #${scorer.player_id}`}
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-blue-400 flex-shrink-0">
                          {scorer.goals}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  )
}

