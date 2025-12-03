'use client'

import { useEffect, useState } from 'react'
import { Result } from '@/lib/supabase'
import { format } from 'date-fns'

export default function LatestResult() {
  const [latestResult, setLatestResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLatestResult()
  }, [])

  const fetchLatestResult = async () => {
    try {
      const response = await fetch('/api/results')
      const contentType = response.headers.get('content-type')
      
      if (response.ok) {
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          if (data && Array.isArray(data) && data.length > 0) {
            setLatestResult(data[0]) // Prvi je najnoviji jer je sortirano
          }
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
          console.error('Error fetching latest result:', errorData)
        }
      }
    } catch (error) {
      // Loguj samo ako nije network error ili slično
      if (error instanceof Error) {
        console.error('Error fetching latest result:', error.message)
      } else {
        console.error('Error fetching latest result:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="relative min-h-screen flex items-center justify-center px-4 py-8">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-slate-800 to-purple-900" />
        <div className="relative z-10 text-white">Učitavanje...</div>
      </section>
    )
  }

  if (!latestResult) {
    return (
      <section className="relative min-h-screen flex items-center justify-center px-4 py-8">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-slate-800 to-purple-900" />
        <div className="relative z-10 text-white text-center">
          <h2 className="text-4xl font-bold mb-4">Nema rezultata</h2>
          <p className="text-blue-300/60">Dodajte rezultate u admin panelu</p>
        </div>
      </section>
    )
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-8">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-slate-800 to-purple-900" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      
      {/* Main match display */}
      <div className="relative z-10 w-full max-w-6xl mx-auto">
        {/* Match result */}
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-400/30 rounded-3xl p-12 backdrop-blur-md shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Home team */}
            <div className="text-center md:text-right space-y-4">
              <div className="flex flex-col md:flex-row items-center md:justify-end gap-4">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl md:text-3xl">
                    {latestResult.home_team.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                  {latestResult.home_team}
                </h2>
              </div>
            </div>

            {/* Score */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-6">
                <span className="text-6xl md:text-7xl lg:text-8xl font-bold text-white">
                  {latestResult.home_score}
                </span>
                <span className="text-3xl md:text-4xl text-blue-300/60 font-light">-</span>
                <span className="text-6xl md:text-7xl lg:text-8xl font-bold text-white">
                  {latestResult.away_score}
                </span>
              </div>
              <div className="flex items-center justify-center gap-4 text-sm text-blue-200/60">
                <span>FULL TIME</span>
                <span>•</span>
                <span>{format(new Date(latestResult.date), 'dd MMM yyyy')}</span>
                <span>•</span>
                <span>{format(new Date(latestResult.date), 'HH:mm')}</span>
              </div>
            </div>

            {/* Away team */}
            <div className="text-center md:text-left space-y-4">
              <div className="flex flex-col md:flex-row items-center md:justify-start gap-4">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                  {latestResult.away_team}
                </h2>
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl md:text-3xl">
                    {latestResult.away_team.substring(0, 2).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

