'use client'

import { useEffect, useState } from 'react'
import { Newspaper, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { getPlayerImageUrl } from '@/lib/image-utils'

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

export default function TerminNewsSection() {
  const [newsData, setNewsData] = useState<TerminNewsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTerminNews()
  }, [])

  const fetchTerminNews = async () => {
    try {
      const response = await fetch('/api/termin-news')
      if (response.ok) {
        const data = await response.json()
        if (data.content && data.content.trim()) {
          setNewsData(data)
        }
      }
    } catch (error) {
      console.error('Error fetching termin news:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !newsData) {
    return null
  }

  // Uzmi prvi paragraf za preview
  const previewText = newsData.content.split(/\n\s*\n+/)[0] || newsData.content.substring(0, 200)
  const truncatedPreview = previewText.length > 200 ? previewText.substring(0, 200) + '...' : previewText

  return (
    <section className="relative px-4 sm:px-6 lg:px-8 py-12 sm:py-16 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-400/20 rounded-lg">
            <Newspaper className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
            TerminNews
          </h2>
        </div>
        <Link 
          href="/terminnews"
          className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors text-sm sm:text-base"
        >
          <span>Pročitaj više</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <Link href="/terminnews" className="block">
        <article className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all hover:bg-white/10 cursor-pointer">
          {/* Header */}
          <div className="px-6 sm:px-8 py-4 sm:py-6 border-b border-white/10">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 leading-tight">
              {newsData.title || 'Izvještaj o poslednjem terminu'}
            </h3>
            {newsData.updated_at && (
              <p className="text-white/60 text-xs sm:text-sm">
                {new Date(newsData.updated_at).toLocaleDateString('sr-RS', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            )}
          </div>

          {/* Content Preview */}
          <div className="px-6 sm:px-8 py-4 sm:py-6">
            <p className="text-white/90 text-sm sm:text-base leading-relaxed line-clamp-3">
              {truncatedPreview}
            </p>
          </div>

          {/* Top Scorer Preview */}
          {newsData.top_scorer && (
            <div className="px-6 sm:px-8 py-4 border-t border-white/10 bg-white/5">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-20 sm:w-20 sm:h-24 rounded-lg overflow-hidden border-2 border-amber-400/30 flex-shrink-0">
                  <Image
                    src={getPlayerImageUrl(newsData.top_scorer.image_url)}
                    alt={`${newsData.top_scorer.first_name} ${newsData.top_scorer.last_name}`}
                    fill
                    className="object-cover object-center"
                    unoptimized
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/no-image-player.png'
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-amber-400/80 text-xs sm:text-sm font-semibold mb-1">
                    Najbolji strijelac
                  </p>
                  <p className="text-white font-semibold text-sm sm:text-base truncate">
                    {newsData.top_scorer.first_name} {newsData.top_scorer.last_name}
                  </p>
                  {newsData.top_scorer.team && (
                    <p className="text-white/60 text-xs sm:text-sm truncate">
                      {newsData.top_scorer.team}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </article>
      </Link>
    </section>
  )
}
