'use client'

import { useEffect, useState, useRef } from 'react'
import { Team, Result } from '@/lib/supabase'
import Image from 'next/image'

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
  const [isScrolled, setIsScrolled] = useState(false)
  const heroRef = useRef<HTMLElement>(null)

  useEffect(() => {
    fetchHeadToHead()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      setIsScrolled(scrollPosition > 0)
    }

    // Proveri na početku da li je već skrolovano
    handleScroll()

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
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
    <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-0 py-8 overflow-hidden">
      <div className="relative w-full h-screen max-w-7xl mx-auto flex items-center justify-between gap-4 sm:gap-8 min-h-[60vh]">
        {/* Background Image - murinjo.png */}
        <div className=" z-0">
          <Image
            src="/murinjo-removebg-preview.png"
            alt="Hero background"
            fill
            className="object-cover !h-[75vh] !top-10"
            priority
          />
        </div>

        {/* Foreground Image - lalat.png (preko murinja) */}
        <div className=" z-10">
          <Image
            src="/lalat1.png"
            alt="Hero foreground"
            fill
            className="object-cover !h-[75vh] !top-10"
            priority
          />
        </div>

        {/* Red Gradient Overlay - odozdo */}
        

        {/* Content */}
        <div
          className={`flex items-center justify-center gap-4 sm:gap-6 transition-all duration-300 ${
            isScrolled
              ? 'fixed left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-0 opacity-30 blur-sm'
              : 'fixed left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-50 opacity-100 blur-0'
          }`}
        >
          <span className="text-[160px] sm:text-7xl md:text-[160px] lg:text-9xl font-bold text-white drop-shadow-lg">
            {stats.team1Wins}
          </span>
          <span className="text-[100px] sm:text-5xl md:text-6xl text-white/80 font-light">-</span>
          <span className="text-[160px] sm:text-7xl md:text-[160px] lg:text-9xl font-bold text-white drop-shadow-lg">
            {stats.team2Wins}
          </span>
        </div>
      </div>
      <div className="absolute inset-0 w-full h-full z-[15]" style={{ background: 'linear-gradient(to top, #a80710 0%, #a80710 33%, rgba(168, 7, 16, 0.5) 66%, transparent 100%)' }}></div>
    </section>
  )
}
