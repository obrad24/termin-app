'use client'

import { useEffect, useState } from 'react'
import { Team } from '@/lib/supabase'

export default function TeamsSection() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams')
      const contentType = response.headers.get('content-type')
      
      if (response.ok) {
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          setTeams(data || [])
        }
      } else {
        // Pokušaj da parsiraš error kao JSON, ali ako ne uspe, koristi status text
        let errorData
        try {
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json()
          } else {
            const text = await response.text()
            errorData = { error: text || response.statusText, status: response.status }
          }
        } catch (parseError) {
          errorData = { error: response.statusText, status: response.status }
        }
        
        // Loguj samo ako nije 503 (Supabase not configured) - to je očekivano
        if (response.status !== 503) {
          console.error('Error fetching teams:', errorData)
        }
      }
    } catch (error) {
      // Loguj samo ako nije network error ili slično
      if (error instanceof Error) {
        console.error('Error fetching teams:', error.message)
      } else {
        console.error('Error fetching teams:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="relative px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-7xl mx-auto">
        <div className="text-white text-center text-sm sm:text-base">Učitavanje timova...</div>
      </section>
    )
  }

  if (teams.length === 0) {
    return (
      <section className="relative px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-7xl mx-auto">
        <div className="text-white text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Timovi</h2>
          <p className="text-blue-300/60 text-sm sm:text-base">Nema timova za prikaz</p>
        </div>
      </section>
    )
  }

  return (
    <section className="relative px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-7xl mx-auto pt-4">
      <div className="space-y-6 sm:space-y-8">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">Timovi</h2>
          <p className="text-blue-300/60 text-sm sm:text-base">Svi registrovani timovi</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {teams.map((team) => (
            <div
              key={team.id}
              className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 backdrop-blur-md hover:border-blue-400/60 transition-all hover:scale-105 flex flex-col items-center justify-center text-center"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-slate-700/50 flex items-center justify-center mb-3 sm:mb-4 border-2 border-blue-400/30">
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
              <h3 className="text-white font-semibold text-sm sm:text-base lg:text-lg mb-1 line-clamp-2">{team.name}</h3>
              {team.short_name && (
                <p className="text-blue-300/60 text-xs sm:text-sm">{team.short_name}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

