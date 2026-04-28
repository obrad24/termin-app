'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { Season } from '@/lib/supabase'

interface SeasonContextValue {
  seasons: Season[]
  currentSeason: Season | null
  setCurrentSeasonId: (id: number | null) => void
  refreshSeasons: () => Promise<void>
}

const SeasonContext = createContext<SeasonContextValue | undefined>(undefined)

const STORAGE_KEY = 'termin_current_season_id'

export function SeasonProvider({ children }: { children: React.ReactNode }) {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null)

  const refreshSeasons = async () => {
    try {
      const response = await fetch('/api/seasons', { cache: 'no-store' })
      if (!response.ok) return
      const data: Season[] = await response.json()
      setSeasons(data || [])

      // Ako već imamo izabranu sezonu, pokušaj da je zadržiš
      const storedId =
        typeof window !== 'undefined'
          ? window.localStorage.getItem(STORAGE_KEY)
          : null
      const storedSeasonId = storedId ? parseInt(storedId, 10) : null

      if (storedSeasonId && data?.length) {
        const found = data.find((s) => s.id === storedSeasonId) || null
        if (found) {
          setCurrentSeason(found)
          return
        }
      }

      // U suprotnom, uzmi najnoviju sezonu (po id-u)
      if (data && data.length > 0) {
        const sorted = [...data].sort((a, b) => b.id - a.id)
        setCurrentSeason(sorted[0])
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEY, String(sorted[0].id))
        }
      } else {
        setCurrentSeason(null)
      }
    } catch (error) {
      console.error('Error fetching seasons:', error)
    }
  }

  useEffect(() => {
    refreshSeasons()
  }, [])

  const setCurrentSeasonId = (id: number | null) => {
    if (!id) {
      setCurrentSeason(null)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(STORAGE_KEY)
      }
      return
    }

    const found = seasons.find((s) => s.id === id) || null
    setCurrentSeason(found)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, String(id))
    }
  }

  return (
    <SeasonContext.Provider
      value={{
        seasons,
        currentSeason,
        setCurrentSeasonId,
        refreshSeasons,
      }}
    >
      {children}
    </SeasonContext.Provider>
  )
}

export function useSeason() {
  const ctx = useContext(SeasonContext)
  if (!ctx) {
    throw new Error('useSeason must be used within a SeasonProvider')
  }
  return ctx
}

