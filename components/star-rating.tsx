'use client'

import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  playerId: number
  matchId: number
  averageRating?: number
  ratingCount?: number
  onRatingChange?: (rating: number) => void
  size?: 'sm' | 'md' | 'lg'
  readonly?: boolean
}

export default function StarRating({
  playerId,
  matchId,
  averageRating = 0,
  ratingCount = 0,
  onRatingChange,
  size = 'md',
  readonly = false
}: StarRatingProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)
  const [userRating, setUserRating] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const handleStarClick = async (rating: number) => {
    if (readonly || isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/match-ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          match_id: matchId,
          player_id: playerId,
          rating: rating,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setUserRating(rating)
        if (onRatingChange) {
          onRatingChange(rating)
        }
        // Refetch average ratings
        window.dispatchEvent(new CustomEvent('rating-updated'))
      } else {
        const error = await response.json()
        console.error('Error submitting rating:', error)
      }
    } catch (error) {
      console.error('Error submitting rating:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayRating = hoveredRating !== null ? hoveredRating : (userRating || averageRating)
  const hasRating = averageRating > 0

  return (
    <div className="flex items-center gap-1">
      <div 
        className="flex items-center gap-0.5"
        onMouseLeave={() => !readonly && setHoveredRating(null)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayRating
          return (
            <button
              key={star}
              type="button"
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => !readonly && !isSubmitting && setHoveredRating(star)}
              disabled={readonly || isSubmitting}
              className={cn(
                "transition-all duration-150",
                !readonly && !isSubmitting && "cursor-pointer hover:scale-110",
                (readonly || isSubmitting) && "cursor-not-allowed opacity-60"
              )}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  isFilled
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-transparent text-white/30"
                )}
              />
            </button>
          )
        })}
      </div>
      {hasRating && (
        <span className="text-xs text-white/70 ml-1">
          {averageRating.toFixed(1)} {ratingCount > 0 && `(${ratingCount})`}
        </span>
      )}
    </div>
  )
}
