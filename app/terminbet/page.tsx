'use client'

import React, { useEffect, useState } from 'react'
import { Result, Team } from '@/lib/supabase'
import { format } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/header'
import { X, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface SelectedOdd {
  matchId: number
  matchName: string
  oddType: '1' | 'X' | '2' | 'total_goals' | 'player_goals' | 'over' | 'under'
  oddValue: number
  homeTeam: string
  awayTeam: string
  matchDate: string
  label?: string // Dodatni label za prikaz (npr. "2 golova", "Igrač X - 2 golova", "Preko 2.5")
}

interface Ticket {
  id: string
  timestamp: string
  selectedOdds: SelectedOdd[]
  stake: number
  combinedOdd: number
  potentialWin: number
}

export default function TerminBetPage() {
  const [matches, setMatches] = useState<(Result & { hasOdds: boolean })[]>([])
  const [nextMatch, setNextMatch] = useState<{
    home_team: string
    away_team: string
    match_date: string
    odds_1: number | null
    odds_x: number | null
    odds_2: number | null
    total_goals_odds?: Array<{ goals: number; odd: number }>
    player_goals_odds?: Array<{ player_id: number; goals: number; odd: number }>
    over_under_odds?: Array<{ goals: number; over_odd: number | null; under_odd: number | null }>
  } | null>(null)
  const [players, setPlayers] = useState<any[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedOdds, setSelectedOdds] = useState<SelectedOdd[]>([])
  const [stake, setStake] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchMatches()
    fetchNextMatch()
    fetchTeams()
    fetchPlayers()
    loadTickets()
  }, [])

  // Listen for storage changes to update tickets list
  useEffect(() => {
    const handleStorageChange = () => {
      loadTickets()
    }

    window.addEventListener('storage', handleStorageChange)
    // Also listen for custom event when ticket is added in same tab
    window.addEventListener('ticketAdded', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('ticketAdded', handleStorageChange)
    }
  }, [])

  const loadTickets = () => {
    try {
      const storedTickets = localStorage.getItem('terminbet_tickets')
      if (storedTickets) {
        const parsedTickets = JSON.parse(storedTickets) as Ticket[]
        // Sort by timestamp, newest first
        const sortedTickets = parsedTickets.sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        setTickets(sortedTickets)
      } else {
        setTickets([])
      }
    } catch (error) {
      console.error('Error loading tickets:', error)
      setTickets([])
    }
  }

  const deleteTicket = (ticketId: string) => {
    try {
      const storedTickets = localStorage.getItem('terminbet_tickets')
      if (storedTickets) {
        const parsedTickets = JSON.parse(storedTickets) as Ticket[]
        const filteredTickets = parsedTickets.filter(t => t.id !== ticketId)
        localStorage.setItem('terminbet_tickets', JSON.stringify(filteredTickets))
        loadTickets()

        // Ako je obrisan tiket koji je trenutno otvoren u dialogu, zatvori dialog
        if (selectedTicket?.id === ticketId) {
          setIsDialogOpen(false)
          setSelectedTicket(null)
        }

        toast({
          title: 'Tiket obrisan',
          description: 'Tiket je uspješno obrisan.',
        })
      }
    } catch (error) {
      console.error('Error deleting ticket:', error)
      toast({
        title: 'Greška',
        description: 'Došlo je do greške pri brisanju tiketa.',
        variant: 'destructive',
      })
    }
  }

  const fetchMatches = async () => {
    try {
      const response = await fetch('/api/results')
      if (response.ok) {
        const data: Result[] = await response.json()
        // Filtriraj samo utakmice koje imaju kvote i koje su buduće ili današnje
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const matchesWithOdds = data
          .filter(match => {
            const matchDate = new Date(match.date)
            matchDate.setHours(0, 0, 0, 0)
            // Uključi samo buduće utakmice ili današnje
            return matchDate >= today && (match.odds_1 || match.odds_x || match.odds_2)
          })
          .map(match => ({
            ...match,
            hasOdds: !!(match.odds_1 || match.odds_x || match.odds_2)
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        setMatches(matchesWithOdds)
      }
    } catch (error) {
      console.error('Error fetching matches:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchNextMatch = async () => {
    try {
      const response = await fetch('/api/next-match')
      if (response.ok) {
        const data = await response.json()
        if (data) {
          setNextMatch({
            home_team: data.home_team,
            away_team: data.away_team,
            match_date: data.match_date || new Date().toISOString(),
            odds_1: data.odds_1,
            odds_x: data.odds_x,
            odds_2: data.odds_2,
            total_goals_odds: data.total_goals_odds || [],
            player_goals_odds: data.player_goals_odds || [],
            over_under_odds: data.over_under_odds || [],
          })
        }
      }
    } catch (error) {
      console.error('Error fetching next match:', error)
    }
  }

  const fetchPlayers = async () => {
    try {
      const response = await fetch('/api/players')
      if (response.ok) {
        const data = await response.json()
        setPlayers(data || [])
      }
    } catch (error) {
      console.error('Error fetching players:', error)
    }
  }

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams')
      if (response.ok) {
        const data = await response.json()
        setTeams(data || [])
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }

  const getTeamLogo = (teamName: string) => {
    const team = teams.find(t => t.name === teamName)
    return team?.logo_url || '/placeholder-logo.svg'
  }

  const toggleOdd = (match: Result, oddType: '1' | 'X' | '2', oddValue: number | null) => {
    if (!oddValue) return

    const matchName = `${match.home_team} - ${match.away_team}`
    const oddKey = `${match.id}-${oddType}`

    setSelectedOdds(prev => {
      // Proveri da li već postoji izbor za ovaj meč
      const existingOdd = prev.find(o => o.matchId === match.id && (o.oddType === '1' || o.oddType === 'X' || o.oddType === '2'))

      // Ako kliknemo na isti tip kvote koji je već izabran, poništimo ga
      if (existingOdd && existingOdd.oddType === oddType) {
        return prev.filter(o => `${o.matchId}-${o.oddType}` !== oddKey)
      }

      // Ako postoji drugi tip kvote (1, X ili 2) za isti meč, ukloni ga i dodaj novi
      if (existingOdd) {
        const filtered = prev.filter(o => !(o.matchId === match.id && (o.oddType === '1' || o.oddType === 'X' || o.oddType === '2')))
        return [...filtered, {
          matchId: match.id,
          matchName,
          oddType,
          oddValue,
          homeTeam: match.home_team,
          awayTeam: match.away_team,
          matchDate: match.date
        }]
      }

      // Ako nema postojećeg izbora, dodaj novi
      return [...prev, {
        matchId: match.id,
        matchName,
        oddType,
        oddValue,
        homeTeam: match.home_team,
        awayTeam: match.away_team,
        matchDate: match.date
      }]
    })
  }

  const removeOdd = (matchId: number, oddType: string, label?: string) => {
    setSelectedOdds(prev => prev.filter(o => {
      if (o.matchId === matchId && o.oddType === oddType) {
        if (label && o.label !== label) return true
        return false
      }
      return true
    }))
  }

  const isOddSelected = (matchId: number, oddType: string, label?: string) => {
    return selectedOdds.some(o => {
      if (o.matchId === matchId && o.oddType === oddType) {
        if (label && o.label !== label) return false
        return true
      }
      return false
    })
  }

  const toggleAdditionalOdd = (
    matchId: number,
    matchName: string,
    homeTeam: string,
    awayTeam: string,
    matchDate: string,
    oddType: 'total_goals' | 'player_goals' | 'over' | 'under',
    oddValue: number,
    label: string
  ) => {
    const oddKey = `${matchId}-${oddType}-${label}`

    setSelectedOdds(prev => {
      const exists = prev.find(o => `${o.matchId}-${o.oddType}-${o.label}` === oddKey)
      if (exists) {
        return prev.filter(o => `${o.matchId}-${o.oddType}-${o.label}` !== oddKey)
      } else {
        return [...prev, {
          matchId,
          matchName,
          oddType,
          oddValue,
          homeTeam,
          awayTeam,
          matchDate,
          label
        }]
      }
    })
  }

  const calculatePotentialWin = () => {
    if (selectedOdds.length === 0 || !stake || parseFloat(stake) <= 0) {
      return 0
    }

    const stakeAmount = parseFloat(stake)
    const combinedOdd = calculateCombinedOdd()
    // Izračunaj osnovni dobitak
    const baseWin = stakeAmount * combinedOdd
    // Dodaj bonus od 12% na potencijalni dobitak
    return baseWin * 1.12
  }

  const calculateCombinedOdd = () => {
    if (selectedOdds.length === 0) return 0
    return selectedOdds.reduce((acc, odd) => acc * odd.oddValue, 1)
  }

  const handleConfirmTicket = () => {
    if (selectedOdds.length === 0 || !stake || parseFloat(stake) <= 0) {
      return
    }

    // Kreiraj tiket objekat
    const ticket = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      selectedOdds: selectedOdds,
      stake: parseFloat(stake),
      combinedOdd: calculateCombinedOdd(),
      potentialWin: calculatePotentialWin(),
    }

    // Učitaj postojeće tikete iz localStorage
    const existingTickets = localStorage.getItem('terminbet_tickets')
    let tickets = []

    if (existingTickets) {
      try {
        tickets = JSON.parse(existingTickets)
      } catch (error) {
        console.error('Error parsing existing tickets:', error)
        tickets = []
      }
    }

    // Dodaj novi tiket
    tickets.push(ticket)

    // Sačuvaj u localStorage
    try {
      localStorage.setItem('terminbet_tickets', JSON.stringify(tickets))

      // Osveži listu tiketa
      loadTickets()

      // Dispatch custom event to update tickets in same tab
      window.dispatchEvent(new Event('ticketAdded'))

      // Prikaži toast notifikaciju sa detaljima tiketa
      toast({
        title: (
          <div className="flex items-center gap-2 pb-2 border-b border-white/10">
            <div className="w-8 h-8 rounded-full bg-[#f9c14c] flex items-center justify-center">
              <span className="text-[#280071] font-bold text-lg">✓</span>
            </div>
            <div>
              <span className="text-base font-bold text-black">Uspješno odigran tiket</span>
              <div className="text-xs text-black/60 mt-0.5">
                {format(new Date(), 'd.M.yyyy • HH:mm')}
              </div>
            </div>
          </div>
        ) as any,
        description: (
          <div className="space-y-3 mt-3 w-full">
            {/* Lista kvota */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {selectedOdds.map((odd, index) => (
                <div key={index} className="bg-gradient-to-r from-slate-700/80 to-slate-800/80 rounded-lg p-3 border border-slate-600/50 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-semibold mb-2">
                        {odd.homeTeam} - {odd.awayTeam}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="bg-[#f9c14c] text-[#280071] px-3 py-1 rounded-md text-xs font-bold shadow-sm">
                          {odd.oddType === '1' ? '1' : odd.oddType === 'X' ? 'X' : odd.oddType === '2' ? '2' : odd.label || odd.oddType}
                        </span>
                        <span className="text-white text-base font-bold">
                          {odd.oddValue.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-white/50 text-xs mt-2">
                        {format(new Date(odd.matchDate), 'd.M • HH:mm')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Detalji tiketa */}
            <div className="bg-gradient-to-r from-slate-800/90 to-slate-900/90 rounded-lg p-4 border-2 border-[#f9c14c]/30 shadow-lg space-y-2.5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/70 font-medium">Ulog:</span>
                <span className="text-white font-bold text-base">{parseFloat(stake).toFixed(2)} BAM</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/70 font-medium">Kombinovana kvota:</span>
                <span className="text-white font-bold text-base">{calculateCombinedOdd().toFixed(2)}</span>
              </div>
              <div className="border-t-2 border-[#f9c14c]/30 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-white font-semibold text-base">Potencijalni dobitak:</span>
                  <span className="text-[#f9c14c] font-bold text-xl">{calculatePotentialWin().toFixed(2)} BAM</span>
                </div>
              </div>
            </div>
          </div>
        ),
        className: "max-w-[500px] w-full",
      })

      // Očisti formu
      setSelectedOdds([])
      setStake('')
    } catch (error) {
      console.error('Error saving ticket to localStorage:', error)
      toast({
        title: 'Greška',
        description: 'Došlo je do greške pri čuvanju tiketa.',
        variant: 'destructive',
      })
    }
  }

  // Kombinuj next_match i matches, izbegavajući duplikate
  const allMatches = (() => {
    const matchesList: (Result & { hasOdds: boolean })[] = []

    // Dodaj next_match ako postoji i ima kvote
    if (nextMatch && (nextMatch.odds_1 || nextMatch.odds_x || nextMatch.odds_2)) {
      const nextMatchDate = new Date(nextMatch.match_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      nextMatchDate.setHours(0, 0, 0, 0)

      // Proveri da li next_match već postoji u matches (po datumu i timovima)
      const isDuplicate = matches.some(m =>
        m.home_team === nextMatch.home_team &&
        m.away_team === nextMatch.away_team &&
        new Date(m.date).setHours(0, 0, 0, 0) === nextMatchDate.getTime()
      )

      if (!isDuplicate && nextMatchDate >= today) {
        matchesList.push({
          id: -1,
          home_team: nextMatch.home_team,
          away_team: nextMatch.away_team,
          date: nextMatch.match_date,
          odds_1: nextMatch.odds_1,
          odds_x: nextMatch.odds_x,
          odds_2: nextMatch.odds_2,
          home_score: 0,
          away_score: 0,
          hasOdds: true,
          // Dodaj dodatne kvote u match objekat za lakši pristup
          total_goals_odds: nextMatch.total_goals_odds,
          player_goals_odds: nextMatch.player_goals_odds,
          over_under_odds: nextMatch.over_under_odds,
        } as Result & { hasOdds: boolean; total_goals_odds?: Array<{ goals: number; odd: number }>; player_goals_odds?: Array<{ player_id: number; goals: number; odd: number }>; over_under_odds?: Array<{ goals: number; over_odd: number | null; under_odd: number | null }> })
      }
    }

    return [...matchesList, ...matches]
  })()

  return (
    <main className="min-h-screen hero-bg pb-20 md:pb-0">
      <Header />
      <section className="relative px-2 sm:px-6 lg:px-8 sm:py-12 max-w-7xl mx-auto sm:pt-28 pt-4">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">
            <span className="text-white">TERMIN</span>
            <span className="text-[#f9c14c]">BET</span>
          </h1>
          <p className="text-white/60 text-sm sm:text-base">Izaberite kvote i izračunajte potencijalni dobitak</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista utakmica sa kvotama */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="text-white text-center py-8">Učitavanje utakmica...</div>
            ) : allMatches.length === 0 ? (
              <div className="text-white text-center py-8">
                <p className="text-white/60">Nema dostupnih utakmica sa kvotama</p>
              </div>
            ) : (
              allMatches.map((match) => (
                <div
                  key={match.id}
                  className="bg-slate-800/50 border border-white/20 rounded-xl p-4 sm:p-6 backdrop-blur-md"
                >
                  {/* Datum i vreme */}
                  <div className="text-amber-400 text-xs sm:text-sm font-medium mb-4">
                    {format(new Date(match.date), 'd.M.yyyy • EEE • HH:mm')}
                  </div>

                  {/* Timovi */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-slate-700/50 flex-shrink-0">
                        <Image
                          src={getTeamLogo(match.home_team)}
                          alt={match.home_team}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/placeholder-logo.svg'
                          }}
                        />
                      </div>
                      <span className="text-white text-sm sm:text-base font-medium truncate">
                        {match.home_team}
                      </span>
                    </div>

                    <span className="text-white/40 mx-2">vs</span>

                    <div className="flex items-center gap-3 flex-1 justify-end">
                      <span className="text-white text-sm sm:text-base font-medium truncate text-right">
                        {match.away_team}
                      </span>
                      <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-slate-700/50 flex-shrink-0">
                        <Image
                          src={getTeamLogo(match.away_team)}
                          alt={match.away_team}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/placeholder-logo.svg'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Osnovne kvote (1 X 2) */}
                  <div className="flex gap-2 sm:gap-3 mb-4">
                    <button
                      onClick={() => toggleOdd(match, '1', match.odds_1 ?? null)}
                      disabled={!match.odds_1}
                      className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 rounded-lg font-semibold text-sm sm:text-base transition-all ${isOddSelected(match.id, '1')
                        ? 'bg-[#f9c14c] text-[#280071]'
                        : match.odds_1
                          ? 'bg-slate-700/50 text-white hover:bg-slate-600/50'
                          : 'bg-slate-800/30 text-white/30 cursor-not-allowed'
                        }`}
                    >
                      <div className="text-xs text-white/60 mb-1">1</div>
                      <div className="font-bold">
                        {match.odds_1 ? match.odds_1.toFixed(2) : '-'}
                      </div>
                    </button>

                    <button
                      onClick={() => toggleOdd(match, 'X', match.odds_x ?? null)}
                      disabled={!match.odds_x}
                      className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 rounded-lg font-semibold text-sm sm:text-base transition-all ${isOddSelected(match.id, 'X')
                        ? 'bg-[#f9c14c] text-[#280071]'
                        : match.odds_x
                          ? 'bg-slate-700/50 text-white hover:bg-slate-600/50'
                          : 'bg-slate-800/30 text-white/30 cursor-not-allowed'
                        }`}
                    >
                      <div className="text-xs text-white/60 mb-1">X</div>
                      <div className="font-bold">
                        {match.odds_x ? match.odds_x.toFixed(2) : '-'}
                      </div>
                    </button>

                    <button
                      onClick={() => toggleOdd(match, '2', match.odds_2 ?? null)}
                      disabled={!match.odds_2}
                      className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 rounded-lg font-semibold text-sm sm:text-base transition-all ${isOddSelected(match.id, '2')
                        ? 'bg-[#f9c14c] text-[#280071]'
                        : match.odds_2
                          ? 'bg-slate-700/50 text-white hover:bg-slate-600/50'
                          : 'bg-slate-800/30 text-white/30 cursor-not-allowed'
                        }`}
                    >
                      <div className="text-xs text-white/60 mb-1">2</div>
                      <div className="font-bold">
                        {match.odds_2 ? match.odds_2.toFixed(2) : '-'}
                      </div>
                    </button>
                  </div>

                  {/* Dodatne kvote - samo za next_match */}
                  {match.id === -1 && (
                    <div className="space-y-3 pt-3 border-t border-white/10">
                      {/* Broj golova na terminu */}
                      {(match as any).total_goals_odds && (match as any).total_goals_odds.length > 0 && (
                        <div>
                          <div className="text-xs text-white/60 mb-2">Broj golova na terminu</div>
                          <div className="flex flex-wrap gap-2">
                            {(match as any).total_goals_odds.map((item: any, idx: number) => {
                              const label = `${item.goals}+ golova`
                              const isSelected = isOddSelected(-1, 'total_goals', label)
                              return (
                                <button
                                  key={idx}
                                  onClick={() => toggleAdditionalOdd(
                                    -1,
                                    `${match.home_team} - ${match.away_team}`,
                                    match.home_team,
                                    match.away_team,
                                    match.date,
                                    'total_goals',
                                    item.odd,
                                    label
                                  )}
                                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${isSelected
                                    ? 'bg-[#f9c14c] text-[#280071]'
                                    : 'bg-slate-700/50 text-white hover:bg-slate-600/50'
                                    }`}
                                >
                                  {item.goals}+ ({item.odd.toFixed(2)})
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Igrač sa termina i broj golova */}
                      {(match as any).player_goals_odds && (match as any).player_goals_odds.length > 0 && (
                        <div>
                          <div className="text-xs text-white/60 mb-2">Igrač sa termina i broj golova</div>
                          <div className="flex flex-wrap gap-2">
                            {(match as any).player_goals_odds.map((item: any, idx: number) => {
                              const player = players.find(p => p.id === item.player_id)
                              const playerName = player ? `${player.first_name} ${player.last_name}` : `Igrač #${item.player_id}`
                              const label = `${playerName} - ${item.goals}+ golova`
                              const isSelected = isOddSelected(-1, 'player_goals', label)
                              return (
                                <button
                                  key={idx}
                                  onClick={() => toggleAdditionalOdd(
                                    -1,
                                    `${match.home_team} - ${match.away_team}`,
                                    match.home_team,
                                    match.away_team,
                                    match.date,
                                    'player_goals',
                                    item.odd,
                                    label
                                  )}
                                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${isSelected
                                    ? 'bg-[#f9c14c] text-[#280071]'
                                    : 'bg-slate-700/50 text-white hover:bg-slate-600/50'
                                    }`}
                                >
                                  {playerName} {item.goals}+ ({item.odd.toFixed(2)})
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Preko/Ispod broj golova */}
                      {(match as any).over_under_odds && (match as any).over_under_odds.length > 0 && (
                        <div>
                          <div className="text-xs text-white/60 mb-2">Preko/Ispod broj golova</div>
                          <div className="flex flex-wrap gap-2">
                            {(match as any).over_under_odds.map((item: any, idx: number) => {
                              const overLabel = `Preko ${item.goals}`
                              const underLabel = `Ispod ${item.goals}`
                              const isOverSelected = isOddSelected(-1, 'over', overLabel)
                              const isUnderSelected = isOddSelected(-1, 'under', underLabel)
                              return (
                                <div key={idx} className="flex gap-2">
                                  {item.over_odd !== null && item.over_odd !== undefined && (
                                    <button
                                      onClick={() => {
                                        if (item.over_odd !== null && item.over_odd !== undefined) {
                                          toggleAdditionalOdd(
                                            -1,
                                            `${match.home_team} - ${match.away_team}`,
                                            match.home_team,
                                            match.away_team,
                                            match.date,
                                            'over',
                                            item.over_odd,
                                            overLabel
                                          )
                                        }
                                      }}
                                      className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${isOverSelected
                                        ? 'bg-[#f9c14c] text-[#280071]'
                                        : 'bg-slate-700/50 text-white hover:bg-slate-600/50'
                                        }`}
                                    >
                                      Preko {item.goals} ({item.over_odd.toFixed(2)})
                                    </button>
                                  )}
                                  {item.under_odd !== null && item.under_odd !== undefined && (
                                    <button
                                      onClick={() => {
                                        if (item.under_odd !== null && item.under_odd !== undefined) {
                                          toggleAdditionalOdd(
                                            -1,
                                            `${match.home_team} - ${match.away_team}`,
                                            match.home_team,
                                            match.away_team,
                                            match.date,
                                            'under',
                                            item.under_odd,
                                            underLabel
                                          )
                                        }
                                      }}
                                      className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${isUnderSelected
                                        ? 'bg-[#f9c14c] text-[#280071]'
                                        : 'bg-slate-700/50 text-white hover:bg-slate-600/50'
                                        }`}
                                    >
                                      Ispod {item.goals} ({item.under_odd.toFixed(2)})
                                    </button>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Tiket i kalkulator */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/70 border border-white/20 rounded-xl p-4 sm:p-6 backdrop-blur-md sticky top-24">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
                <span className="text-white">TERMIN</span>
                <span className="text-[#f9c14c]">BET</span> Tiket
              </h2>

              {selectedOdds.length === 0 ? (
                <div className="text-white/60 text-sm text-center py-8">
                  Izaberite kvote da biste napravili tiket
                </div>
              ) : (
                <>
                  {/* Lista odabranih kvota */}
                  <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                    {selectedOdds.map((odd, index) => (
                      <div
                        key={`${odd.matchId}-${odd.oddType}-${index}`}
                        className="bg-slate-700/50 rounded-lg p-3 border border-white/10"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-xs sm:text-sm font-medium truncate mb-1">
                              {odd.homeTeam} - {odd.awayTeam}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-amber-400 text-xs font-semibold">
                                {odd.oddType === '1' ? '1' : odd.oddType === 'X' ? 'X' : odd.oddType === '2' ? '2' : odd.label || odd.oddType}
                              </span>
                              <span className="text-white text-sm font-bold">
                                {odd.oddValue.toFixed(2)}
                              </span>
                            </div>
                            <div className="text-white/50 text-xs mt-1">
                              {format(new Date(odd.matchDate), 'd.M • HH:mm')}
                            </div>
                          </div>
                          <button
                            onClick={() => removeOdd(odd.matchId, odd.oddType, odd.label)}
                            className="text-white/60 hover:text-white transition-colors flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Kalkulator */}
                  <div className="border-t border-white/20 pt-4 space-y-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-white/80 text-sm font-medium">
                        Ulog (BAM)
                      </label>
                      {selectedOdds.length > 0 && (
                        <button
                          onClick={() => {
                            setSelectedOdds([])
                            setStake('')
                          }}
                          className="text-white/60 hover:text-white text-xs transition-colors"
                        >
                          Obriši tiket
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      value={stake}
                      onChange={(e) => setStake(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full bg-slate-700/50 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#f9c14c] focus:border-transparent"
                    />

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Kombinovana kvota:</span>
                        <span className="text-white font-semibold">
                          {calculateCombinedOdd().toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Ulog:</span>
                        <span className="text-white font-semibold">
                          {stake ? parseFloat(stake).toFixed(2) : '0.00'} BAM
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-white/50">
                        <span>Osnovni dobitak:</span>
                        <span>
                          {stake && parseFloat(stake) > 0
                            ? (parseFloat(stake) * calculateCombinedOdd()).toFixed(2)
                            : '0.00'} BAM
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-[#f9c14c]">
                        <span>Bonus (12%):</span>
                        <span>
                          {stake && parseFloat(stake) > 0
                            ? (parseFloat(stake) * calculateCombinedOdd() * 0.12).toFixed(2)
                            : '0.00'} BAM
                        </span>
                      </div>
                      <div className="border-t border-white/20 pt-2 flex justify-between">
                        <span className="text-white font-medium">Potencijalni dobitak:</span>
                        <span className="text-[#f9c14c] font-bold text-lg">
                          {calculatePotentialWin().toFixed(2)} BAM
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleConfirmTicket}
                      disabled={selectedOdds.length === 0 || !stake || parseFloat(stake) <= 0}
                      className="w-full bg-[#280071] hover:bg-[#320085] text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-slate-700/30 disabled:text-white/30 disabled:cursor-not-allowed"
                    >
                      Potvrdi tiket
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Sekcija sa odigranim tiketima */}
        {tickets.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
              <span className="text-white">Moji</span>
              <span className="text-[#f9c14c]"> Tiketi</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-slate-800/70 border border-white/20 rounded-xl p-4 sm:p-6 backdrop-blur-md hover:bg-slate-800/90 transition-all relative group"
                >
                  <button
                    onClick={() => {
                      setSelectedTicket(ticket)
                      setIsDialogOpen(true)
                    }}
                    className="w-full text-left"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className='flex justify-between w-full'>
                        <div className="text-white/60 text-xs mb-1">
                          {format(new Date(ticket.timestamp), 'd.M.yyyy • HH:mm')}
                        </div>
                        <div className='text-white/60 text-xs mb-1'>Klinki da pogledaš</div>
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-3 space-y-1">
                      <div className="flex justify-between text-xs text-white/60">
                        <span>Ulog:</span>
                        <span className="text-white font-medium">{ticket.stake.toFixed(2)} BAM</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/80 font-medium">Potencijalni dobitak:</span>
                        <span className="text-[#f9c14c] font-bold">{ticket.potentialWin.toFixed(2)} BAM</span>
                      </div>
                    </div>
                  </button>

                  {/* Dugme za brisanje */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm('Da li ste sigurni da želite da obrišete ovaj tiket?')) {
                        deleteTicket(ticket.id)
                      }
                    }}
                    className="relative mt-2 float-right p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 transition-colors"
                    title="Obriši tiket"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Dialog za prikaz detalja tiketa */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-800 border-white/20">
          {selectedTicket && (
            <>
              <DialogHeader>
                <div className="flex flex-col">
                    <button
                      onClick={() => {
                        if (confirm('Da li ste sigurni da želite da obrišete ovaj tiket?')) {
                          deleteTicket(selectedTicket.id)
                        }
                      }}
                      className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 transition-colors absolute top-3 left-3"
                      title="Obriši tiket"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <div className='flex flex-col'>
                    <DialogTitle className="text-white text-xl">
                      Detalji tiketa
                    </DialogTitle>
                    <DialogDescription className="text-white/60 text-sm">
                      {format(new Date(selectedTicket.timestamp), 'd.M.yyyy • HH:mm')}
                    </DialogDescription>
                    </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Lista kvota */}
                <div className="space-y-3">
                  <h3 className="text-white font-semibold text-sm mb-3">Odabrane kvote:</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {selectedTicket.selectedOdds.map((odd, index) => (
                      <div key={index} className="bg-gradient-to-r from-slate-700/80 to-slate-800/80 rounded-lg p-4 border border-slate-600/50 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-sm font-semibold mb-2">
                              {odd.homeTeam} - {odd.awayTeam}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="bg-[#f9c14c] text-[#280071] px-3 py-1 rounded-md text-xs font-bold shadow-sm">
                                {odd.oddType === '1' ? '1' : odd.oddType === 'X' ? 'X' : odd.oddType === '2' ? '2' : odd.label || odd.oddType}
                              </span>
                              <span className="text-white text-base font-bold">
                                {odd.oddValue.toFixed(2)}
                              </span>
                            </div>
                            <div className="text-white/50 text-xs mt-2">
                              {format(new Date(odd.matchDate), 'd.M • HH:mm')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detalji tiketa */}
                <div className="bg-gradient-to-r from-slate-800/90 to-slate-900/90 rounded-lg p-4 border-2 border-[#f9c14c]/30 shadow-lg space-y-2.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/70 font-medium">Ulog:</span>
                    <span className="text-white font-bold text-base">{selectedTicket.stake.toFixed(2)} BAM</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/70 font-medium">Kombinovana kvota:</span>
                    <span className="text-white font-bold text-base">{selectedTicket.combinedOdd.toFixed(2)}</span>
                  </div>
                  <div className="border-t-2 border-[#f9c14c]/30 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold text-base">Potencijalni dobitak:</span>
                      <span className="text-[#f9c14c] font-bold text-xl">{selectedTicket.potentialWin.toFixed(2)} BAM</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}

