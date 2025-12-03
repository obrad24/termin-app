'use client'

import { useEffect, useState } from 'react'
import { Result } from '@/lib/supabase'
import { format } from 'date-fns'

export default function ResultsSection() {
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchResults()
  }, [])

  const fetchResults = async () => {
    try {
      const response = await fetch('/api/results')
      const contentType = response.headers.get('content-type')
      
      if (response.ok) {
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          setResults(data || [])
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
          console.error('Error fetching results:', errorData)
        }
      }
    } catch (error) {
      // Loguj samo ako nije network error ili slično
      if (error instanceof Error) {
        console.error('Error fetching results:', error.message)
      } else {
        console.error('Error fetching results:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="relative px-8 py-12 max-w-7xl mx-auto">
        <div className="text-white text-center">Učitavanje rezultata...</div>
      </section>
    )
  }

  if (results.length === 0) {
    return (
      <section className="relative px-8 py-12 max-w-7xl mx-auto">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Rezultati</h2>
          <p className="text-blue-300/60">Nema rezultata za prikaz</p>
        </div>
      </section>
    )
  }

  // Grupiši rezultate po datumu
  const groupedResults = results.reduce((acc, result) => {
    const date = result.date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(result)
    return acc
  }, {} as Record<string, Result[]>)

  return (
    <section className="relative px-8 py-12 max-w-7xl mx-auto">
      <div className="space-y-8">
        <h2 className="text-3xl font-bold text-white mb-8">Rezultati</h2>
        
        {Object.entries(groupedResults).map(([date, dateResults]) => (
          <div key={date} className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">
                {format(new Date(date), 'EEEE, MMMM d, yyyy')}
              </h3>
            </div>

            <div className="space-y-4">
              {dateResults.map((result) => (
                <div
                  key={result.id}
                  className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-2xl p-6 backdrop-blur-md hover:border-blue-400/60 transition"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {result.home_team.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-white font-semibold text-lg">
                        {result.home_team}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 mx-6">
                      <span className="text-3xl font-bold text-white">
                        {result.home_score}
                      </span>
                      <span className="text-blue-300/60 text-xl">-</span>
                      <span className="text-3xl font-bold text-white">
                        {result.away_score}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 flex-1 justify-end">
                      <span className="text-white font-semibold text-lg">
                        {result.away_team}
                      </span>
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {result.away_team.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-blue-200/60">
                    <span>FULL TIME</span>
                    <span>{format(new Date(result.date), 'HH:mm')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

