'use client'

import { useEffect, useState } from 'react'
import { Team, Result } from '@/lib/supabase'

interface HeadToHeadStats {
  team1Wins: number
  team2Wins: number
  draws: number
  totalMatches: number
}

export default function HeroSection() {
  const [team1, setTeam1] = useState<Team | null>(null)
  const [team2, setTeam2] = useState<Team | null>(null)
  const [stats, setStats] = useState<HeadToHeadStats>({
    team1Wins: 0,
    team2Wins: 0,
    draws: 0,
    totalMatches: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHeadToHead()
  }, [])

  const fetchHeadToHead = async () => {
    try {
      // Uzmi sve timove
      const teamsResponse = await fetch('/api/teams')
      if (!teamsResponse.ok) return

      const teams: Team[] = await teamsResponse.json()
      if (teams.length < 2) {
        setLoading(false)
        return
      }

      // Sortiraj po ID-ju i uzmi prva dva
      const sortedTeams = [...teams].sort((a, b) => a.id - b.id)
      const firstTeam = sortedTeams[0]
      const secondTeam = sortedTeams[1]

      setTeam1(firstTeam)
      setTeam2(secondTeam)

      // Uzmi sve rezultate
      const resultsResponse = await fetch('/api/results')
      if (!resultsResponse.ok) return

      const results: Result[] = await resultsResponse.json()

      // Pronađi međusobne utakmice
      const headToHeadMatches = results.filter(
        (result) =>
          (result.home_team === firstTeam.name && result.away_team === secondTeam.name) ||
          (result.home_team === secondTeam.name && result.away_team === firstTeam.name)
      )

      // Izračunaj statistiku
      let team1Wins = 0
      let team2Wins = 0
      let draws = 0

      headToHeadMatches.forEach((match) => {
        const isTeam1Home = match.home_team === firstTeam.name
        const team1Score = isTeam1Home ? match.home_score : match.away_score
        const team2Score = isTeam1Home ? match.away_score : match.home_score

        if (team1Score > team2Score) {
          team1Wins++
        } else if (team2Score > team1Score) {
          team2Wins++
        } else {
          draws++
        }
      })

      setStats({
        team1Wins,
        team2Wins,
        draws,
        totalMatches: headToHeadMatches.length,
      })
    } catch (error) {
      console.error('Error fetching head to head:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="relative min-h-screen flex items-center justify-center px-4 py-8">
        <div className="text-white text-center">Učitavanje...</div>
      </section>
    )
  }

  if (!team1 || !team2) {
    return (
      <section className="relative min-h-screen flex items-center justify-center px-4 py-8">
        <div className="text-white text-center">
          <p className="text-lg">Nedovoljno timova za prikaz međusobnog skora</p>
        </div>
      </section>
    )
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-8 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/placeholder.jpg"
          alt="Hero background"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-[#a80710]/80"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto">
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            <span className="text-8xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-white drop-shadow-lg">
              {stats.team1Wins}
            </span>
            <span className="text-4xl sm:text-5xl md:text-6xl text-white/80 font-light">-</span>
            <span className="text-8xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-white drop-shadow-lg">
              {stats.team2Wins}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
