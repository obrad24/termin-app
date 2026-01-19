'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/header'
import { Newspaper, Calendar, Clock, Quote } from 'lucide-react'
import { format } from 'date-fns'
import Image from 'next/image'
import { getPlayerImageUrl } from '@/lib/image-utils'
import Link from 'next/link'

interface TopScorer {
  id: number
  first_name: string
  last_name: string
  image_url: string | null
  team: string | null
  comment: string
}

interface TerminNewsData {
  title?: string | null
  content: string
  updated_at?: string
  top_scorer?: TopScorer | null
}

export default function TerminNewsPage() {
  const [newsData, setNewsData] = useState<TerminNewsData>({ content: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTerminNews()
  }, [])

  const fetchTerminNews = async () => {
    try {
      const response = await fetch('/api/termin-news')
      if (response.ok) {
        const data = await response.json()
        console.log('TerminNews data:', data) // Debug log
        console.log('Title:', data.title) // Debug log
        console.log('Content split by \\n\\n:', data.content?.split('\n\n')) // Debug log
        setNewsData({
          title: data.title || null,
          content: data.content || '',
          updated_at: data.updated_at || null,
          top_scorer: data.top_scorer || null,
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error fetching termin news:', response.status, errorData)
      }
    } catch (error) {
      console.error('Error fetching termin news:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return null
    try {
      const date = new Date(dateString)
      const day = date.getDate()
      const month = date.toLocaleDateString('sr-RS', { month: 'long' })
      const year = date.getFullYear()
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${day}. ${month} ${year}. | ${hours}:${minutes}`
    } catch {
      return null
    }
  }

  return (
    <main className="min-h-screen hero-bg pt-4 pb-20 md:pb-0">
      <Header />
      <section className="relative px-4 sm:px-6 lg:px-8 sm:py-12 max-w-4xl mx-auto sm:pt-28">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-400/20 rounded-lg">
              <Newspaper className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
              TerminNews
            </h1>
          </div>
          <p className="text-white/70 text-sm sm:text-base ml-14 sm:ml-16">
            Izvještaj o poslednjem terminu
          </p>
        </div>

        {/* Article Card */}
        <article className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-2xl hover:border-white/20 transition-colors">
          {loading ? (
            <div className="text-white text-center py-16 text-base sm:text-lg">
              Učitavanje izvještaja...
            </div>
          ) : newsData.content ? (
            <>
              {/* Article Header */}
              <div className="border-b border-white/10 px-6 sm:px-8 py-4 sm:py-6 bg-gradient-to-r from-white/5 to-transparent">
                <div className="flex flex-col gap-4">
                  {/* Top Scorer Image at Top */}
                  {newsData.top_scorer && (
                    <div className="flex items-center gap-4 mb-2">
                      <div className="relative w-20 h-24 sm:w-24 sm:h-32 rounded-lg overflow-hidden border-2 border-amber-400/40 flex-shrink-0">
                        <Link href={`/players/${newsData.top_scorer.id}`}>
                          <Image
                            src={getPlayerImageUrl(newsData.top_scorer.image_url)}
                            alt={`${newsData.top_scorer.first_name} ${newsData.top_scorer.last_name}`}
                            fill
                            className="object-cover object-center hover:scale-105 transition-transform cursor-pointer"
                            unoptimized
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = '/no-image-player.png'
                            }}
                          />
                        </Link>
                      </div>
                      <div className="flex-1">
                        <Link href={`/players/${newsData.top_scorer.id}`}>
                          <h3 className="text-lg sm:text-xl font-semibold text-white hover:text-amber-400 transition-colors cursor-pointer">
                            {newsData.top_scorer.first_name} {newsData.top_scorer.last_name}
                          </h3>
                        </Link>
                        {newsData.top_scorer.team && (
                          <p className="text-white/60 text-sm mt-1">
                            {newsData.top_scorer.team}
                          </p>
                        )}
                        <p className="text-amber-400/80 text-xs sm:text-sm mt-1">
                          Najbolji strijelac utakmice
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 leading-tight">
                        {newsData.title || 'Izvještaj o poslednjem terminu'}
                      </h2>
                      <div className="flex items-center gap-2 text-amber-400/80 text-xs sm:text-sm mt-2">
                        <Newspaper className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>TerminNews</span>
                      </div>
                    </div>
                    {newsData.updated_at && (
                      <div className="flex items-center gap-2 text-white/60 text-sm sm:text-base bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(newsData.updated_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Article Content */}
              <div className="px-6 sm:px-8 py-6 sm:py-8">
                <div className="prose prose-invert max-w-none">
                  <div className="text-white text-base sm:text-lg leading-relaxed space-y-4 sm:space-y-6">
                    {(() => {
                      // Podeli tekst na paragrafa - koristi \n\n ili više novih linija
                      let paragraphs = newsData.content
                        .split(/\n\s*\n+/)
                        .map(p => p.trim())
                        .filter(p => p.length > 0)
                      
                      console.log('Content length:', newsData.content.length)
                      console.log('Content has \\n\\n:', newsData.content.includes('\n\n'))
                      console.log('Parsed paragraphs count:', paragraphs.length)
                      console.log('Parsed paragraphs:', paragraphs)
                      
                      // Ako nema paragrafa podeljenih sa \n\n, podeli po jednom \n
                      if (paragraphs.length <= 1 && newsData.content.includes('\n')) {
                        paragraphs = newsData.content
                          .split('\n')
                          .map(p => p.trim())
                          .filter(p => p.length > 0)
                        console.log('Split by single \\n, paragraphs count:', paragraphs.length)
                      }
                      
                      // Ako i dalje nema paragrafa, podeli po rečenicama (tačka + razmak)
                      if (paragraphs.length <= 1) {
                        const sentences = newsData.content.split(/\.\s+/).filter(s => s.trim().length > 0)
                        // Grupiši u 4 paragrafa
                        const sentencesPerPara = Math.ceil(sentences.length / 4)
                        paragraphs = []
                        for (let i = 0; i < sentences.length; i += sentencesPerPara) {
                          const para = sentences.slice(i, i + sentencesPerPara)
                            .map(s => s.trim() + (s.endsWith('.') ? '' : '.'))
                            .join(' ')
                          if (para.trim()) paragraphs.push(para)
                        }
                        console.log('Split by sentences, paragraphs count:', paragraphs.length)
                      }
                      
                      return paragraphs.map((paragraph, index) => (
                        <p key={index} className="mb-4 sm:mb-6 last:mb-0">
                          {paragraph}
                        </p>
                      ))
                    })()}
                  </div>
                </div>
              </div>

              {/* Top Scorer Section - Na dnu izvještaja */}
              {newsData.top_scorer && (
                <div className="border-t border-white/20 px-6 sm:px-8 py-6 sm:py-8 bg-white/5">
                  <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                    {/* Player Image */}
                    <div className="relative w-32 h-40 sm:w-40 sm:h-48 rounded-xl overflow-hidden border-2 border-amber-400/30 flex-shrink-0">
                      <Link href={`/players/${newsData.top_scorer.id}`}>
                        <Image
                          src={getPlayerImageUrl(newsData.top_scorer.image_url)}
                          alt={`${newsData.top_scorer.first_name} ${newsData.top_scorer.last_name}`}
                          fill
                          className="object-cover object-center hover:scale-105 transition-transform cursor-pointer"
                          unoptimized
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/no-image-player.png'
                          }}
                        />
                      </Link>
                    </div>

                    {/* Player Info and Comment */}
                    <div className="flex-1 text-center sm:text-left">
                      <div className="mb-4">
                        <h3 className="text-xl sm:text-2xl font-bold text-amber-400 mb-2">
                          Najbolji strijelac utakmice
                        </h3>
                        <Link href={`/players/${newsData.top_scorer.id}`}>
                          <h4 className="text-lg sm:text-xl font-semibold text-white hover:text-amber-400 transition-colors cursor-pointer">
                            {newsData.top_scorer.first_name} {newsData.top_scorer.last_name}
                          </h4>
                        </Link>
                        {newsData.top_scorer.team && (
                          <p className="text-white/60 text-sm sm:text-base mt-1">
                            {newsData.top_scorer.team}
                          </p>
                        )}
                      </div>

                      {/* Comment */}
                      <div className="bg-white/5 rounded-lg p-4 sm:p-6 border border-white/10">
                        <div className="flex items-start gap-3">
                          <Quote className="w-5 h-5 text-amber-400/60 flex-shrink-0 mt-1" />
                          <p className="text-white/90 text-sm sm:text-base leading-relaxed italic">
                            {newsData.top_scorer.comment}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Article Footer */}
              <div className="border-t border-white/10 px-6 sm:px-8 py-4 bg-white/5">
                <div className="flex items-center gap-2 text-white/50 text-xs sm:text-sm">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Poslednje ažuriranje: {newsData.updated_at ? formatDate(newsData.updated_at) : 'N/A'}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="px-6 sm:px-8 py-16 text-center">
              <div className="text-white/60 mb-4">
                <Newspaper className="w-16 h-16 mx-auto mb-4 opacity-50" />
              </div>
              <p className="text-white text-xl sm:text-2xl mb-2 font-semibold">Nema izvještaja</p>
              <p className="text-white/60 text-sm sm:text-base">
                Izvještaj o poslednjem terminu će uskoro biti dostupan
              </p>
            </div>
          )}
        </article>

        {/* Additional Info Section */}
        {newsData.content && (
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-white/40 text-xs sm:text-sm">
              Za više informacija o utakmicama, posetite sekciju{' '}
              <a href="/matches" className="text-amber-400 hover:text-amber-300 underline">
                Utakmice
              </a>
            </p>
          </div>
        )}
      </section>
    </main>
  )
}
