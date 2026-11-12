'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { Season } from '@/lib/supabase'
import { sameId, toId } from '@/lib/ids'

interface SeasonContextValue {
  seasons: Season[]
  currentSeason: Season | null
  loading: boolean
  setCurrentSeasonId: (id: number | string | null) => void
  refreshSeasons: () => Promise<void>
}

const SeasonContext = createContext<SeasonContextValue | undefined>(undefined)

const STORAGE_KEY = 'termin_current_season_id'

function normalizeSeason(raw: any): Season | null {
  const id = toId(raw?.id)
  if (id == null || !raw?.name) return null
  return {
    ...raw,
    id,
    name: String(raw.name),
  }
}

export function SeasonProvider({ children }: { children: React.ReactNode }) {
  const [seasons, setSeasons] = useState<Season[]>([])
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshSeasons = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/seasons')
      if (!response.ok) return
      const data = await response.json()
      const normalized = (Array.isArray(data) ? data : [])
        .map(normalizeSeason)
        .filter((s): s is Season => !!s)
      setSeasons(normalized)

      const storedId =
        typeof window !== 'undefined'
          ? toId(window.localStorage.getItem(STORAGE_KEY))
          : null

      if (storedId != null && normalized.length) {
        const found = normalized.find((s) => sameId(s.id, storedId)) || null
        if (found) {
          setCurrentSeason(found)
          return
        }
      }

      if (normalized.length > 0) {
        const sorted = [...normalized].sort((a, b) => b.id - a.id)
        setCurrentSeason(sorted[0])
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEY, String(sorted[0].id))
        }
      } else {
        setCurrentSeason(null)
      }
    } catch (error) {
      console.error('Error fetching seasons:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshSeasons()
  }, [])

  const setCurrentSeasonId = (id: number | string | null) => {
    const previousSeasonId = currentSeason?.id ?? null
    const nextId = id == null || id === '' ? null : toId(id)

    if (nextId == null) {
      setCurrentSeason(null)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(STORAGE_KEY)
        if (previousSeasonId !== null) {
          window.location.reload()
        }
      }
      return
    }

    const found = seasons.find((s) => sameId(s.id, nextId)) || null
    setCurrentSeason(found)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, String(nextId))
      if (!sameId(previousSeasonId, nextId)) {
        window.location.reload()
      }
    }
  }

  return (
    <SeasonContext.Provider
      value={{
        seasons,
        currentSeason,
        loading,
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
