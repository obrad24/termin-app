'use client'

import { useEffect, useState, useRef } from 'react'
import { Team, Result } from '@/lib/supabase'
import Image from 'next/image'
import { format } from 'date-fns'
import Link from 'next/link'
import MatchAnnouncement from './match-announcement'

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
  const [nextMatch, setNextMatch] = useState<{
    home_team: string
    away_team: string
    match_date: string
    odds_1: number | null
    odds_x: number | null
    odds_2: number | null
  } | null>(null)
  const heroRef = useRef<HTMLElement>(null)

  useEffect(() => {
    fetchHeadToHead()
    fetchNextMatch()
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

  const fetchNextMatch = async () => {
    try {
      const response = await fetch('/api/next-match')
      if (!response.ok) return

      const data = await response.json()
      if (data) {
        setNextMatch({
          home_team: data.home_team,
          away_team: data.away_team,
          match_date: data.match_date || new Date().toISOString(),
          odds_1: data.odds_1,
          odds_x: data.odds_x,
          odds_2: data.odds_2,
        })
      }
    } catch (error) {
      console.error('Error fetching next match:', error)
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
    <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-0 py-8 overflow-hidden h-screen">
      <div className="relative w-full h-screen max-w-7xl mx-auto flex items-center justify-between gap-4 sm:gap-8 min-h-[60vh]">
        {/* Background Image - murinjo.png */}
        <div className="z-0">
          <Image
            src="/murinjo-removebg-preview.png"
            alt="Hero background"
            fill
            className="object-cover !h-[75vh] !top-10"
            priority
          />
        </div>

        {/* Foreground Image - lalat.png (preko murinja) */}
        <div className="z-0">
          <Image
            src="/lalat1.png"
            alt="Hero foreground"
            fill
            className="object-cover !h-[75vh] !top-10"
            priority
          />
          <div className="absolute bottom-[17%] left-0 w-full h-[70%] bg-gradient-to-t from-[rgba(10,13,26,0.95)] via-[rgba(15,21,37,0.6)] to-transparent z-[20]"></div>
        </div>


        {/* Content */}
        <div
          className={`flex items-center justify-center gap-4 sm:gap-6 transition-all duration-300 ${isScrolled
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
      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[rgba(10,13,26,0.95)] via-[rgba(15,21,37,0.6)] to-transparent"></div>
      <Link href="/terminbet" className='absolute bottom-[12%] left-0 bg-[#280071] w-full h-8 flex items-center overflow-hidden hover:bg-[#320085] transition-colors cursor-pointer z-50'>
        <div className='terminbet-scroll flex items-center font-bold text-2xl'>
          <div className='flex items-center justify-center px-2'>
            <span className='text-white'>TERMIN</span><span className='text-[#f9c14c]'>BET</span>
          </div>
          <div className='flex items-center justify-center px-2'>
            <span className='text-white'>TERMIN</span><span className='text-[#f9c14c]'>BET</span>
          </div>
          <div className='flex items-center justify-center px-2'>
            <span className='text-white'>TERMIN</span><span className='text-[#f9c14c]'>BET</span>
          </div>
          <div className='flex items-center justify-center px-2'>
            <span className='text-white'>TERMIN</span><span className='text-[#f9c14c]'>BET</span>
          </div>
          <div className='flex items-center justify-center px-2'>
            <span className='text-white'>TERMIN</span><span className='text-[#f9c14c]'>BET</span>
          </div>
          <div className='flex items-center justify-center px-2'>
            <span className='text-white'>TERMIN</span><span className='text-[#f9c14c]'>BET</span>
          </div>
          <div className='flex items-center justify-center px-2'>
            <span className='text-white'>TERMIN</span><span className='text-[#f9c14c]'>BET</span>
          </div>
          <div className='flex items-center justify-center px-2'>
            <span className='text-white'>TERMIN</span><span className='text-[#f9c14c]'>BET</span>
          </div>
        </div>
      </Link>
      <MatchAnnouncement />
      <div className='absolute bottom-0 left-0 w-full bg-[rgba(10,13,26,0.95)] flex'>
        {nextMatch && nextMatch.home_team && nextMatch.away_team ? (
          <div className="w-full max-w-7xl mx-auto flex py-2 border-t border-amber-400 border-b border-amber-400 h-auto">
            {/* Leva kolona */}
            <div className="flex-1 flex flex-col px-2">
              {/* Datum gore */}
              <div className="text-amber-400 text-xs sm:text-sm font-medium flex gap-1 h-5 items-center">
                {nextMatch.match_date && (
                  <>
                    <span>{format(new Date(nextMatch.match_date), 'd.M')}.</span>
                    <span>{format(new Date(nextMatch.match_date), 'EEE')}</span>
                  </>
                )}
              </div>
              {/* Timovi dole */}
              <div className='flex flex-col gap-0.5 h-11 justify-center'>
                <div className="text-white text-sm sm:text-base font-medium truncate">
                  {nextMatch.home_team}
                </div>
                <div className="text-white text-sm sm:text-base font-medium truncate">
                  {nextMatch.away_team}
                </div>
              </div>
            </div>

            {/* Desna kolona */}
            <div className="flex flex-col px-2 items-end">
              {/* 1 X 2 gore */}
              <div className="flex items-center gap-3 sm:gap-4 w-full justify-around h-5">
                <span className="text-gray-400 text-sm sm:text-base font-medium">1</span>
                <span className="text-gray-400 text-sm sm:text-base font-medium">X</span>
                <span className="text-gray-400 text-sm sm:text-base font-medium">2</span>
              </div>
              {/* Kvote dole */}
              <div className="flex items-center gap-3 sm:gap-4 h-11">
                <span className="text-white text-sm sm:text-base font-medium">
                  {nextMatch.odds_1 ? nextMatch.odds_1.toFixed(2) : '-'}
                </span>
                <span className="text-white text-sm sm:text-base font-medium">
                  {nextMatch.odds_x ? nextMatch.odds_x.toFixed(2) : '-'}
                </span>
                <span className="text-white text-sm sm:text-base font-medium">
                  {nextMatch.odds_2 ? nextMatch.odds_2.toFixed(2) : '-'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-7xl mx-auto h-[82px] flex items-center justify-center">
            <p className="text-white/60 text-sm sm:text-base">Kvote će uskoro biti dostupne</p>
          </div>
        )}
      </div>
    </section>
  )
}
