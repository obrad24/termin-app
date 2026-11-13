'use client'

import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Player } from '@/lib/supabase'
import { getPlayerImageUrl } from '@/lib/image-utils'
import { getOrCreateVoterId } from '@/lib/voter-id'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface PlayerRatingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  player: Player | null
  matchId: number
  currentAverageRating?: number
  ratingCount?: number
  votingLocked?: boolean
  onRatingSubmitted?: (playerId: number, rating: number) => void
}

export default function PlayerRatingDialog({
  open,
  onOpenChange,
  player,
  matchId,
  currentAverageRating = 0,
  ratingCount = 0,
  votingLocked = false,
  onRatingSubmitted,
}: PlayerRatingDialogProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [userRating, setUserRating] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingRating, setIsLoadingRating] = useState(false)

  useEffect(() => {
    if (!open || !player) {
      setUserRating(null)
      setSelectedRating(null)
      setHoveredRating(null)
      return
    }

    // Always start empty until THIS voter's rating is loaded
    setUserRating(null)
    setSelectedRating(null)
    setHoveredRating(null)
    fetchUserRating()
  }, [open, player?.id, matchId])

  const fetchUserRating = async () => {
    if (!player) return

    setIsLoadingRating(true)
    try {
      const voterId = getOrCreateVoterId()
      const response = await fetch(
        `/api/match-ratings/user-rating?match_id=${matchId}&player_id=${player.id}&voter_id=${encodeURIComponent(voterId)}`,
      )
      if (response.ok) {
        const data = await response.json()
        if (data.rating != null && Number(data.rating) > 0) {
          const rating = Number(data.rating)
          setUserRating(rating)
          setSelectedRating(rating)
        } else {
          setUserRating(null)
          setSelectedRating(null)
        }
      }
    } catch (error) {
      console.error('Error fetching user rating:', error)
    } finally {
      setIsLoadingRating(false)
    }
  }

  if (!player) return null

  const handleStarClick = async (rating: number) => {
    if (isSubmitting || votingLocked || isLoadingRating) return

    setIsSubmitting(true)
    try {
      const voterId = getOrCreateVoterId()
      const response = await fetch('/api/match-ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          match_id: matchId,
          player_id: player.id,
          rating,
          voter_id: voterId,
        }),
      })

      if (response.ok) {
        setSelectedRating(rating)
        setUserRating(rating)
        onRatingSubmitted?.(player.id, rating)
        setTimeout(() => {
          onOpenChange(false)
        }, 800)
      } else {
        const error = await response.json()
        console.error('Error submitting rating:', error)
        alert(error.error || 'Could not save rating')
      }
    } catch (error) {
      console.error('Error submitting rating:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Never fall back to community average — only this voter's stars
  const displayRating =
    hoveredRating !== null ? hoveredRating : selectedRating || userRating || 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-white/30 text-white max-w-md w-[90%]">
        <DialogHeader>
          <DialogTitle className="text-white text-center text-xl">Rate player</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          <div className="flex flex-col items-center gap-4">
            <Link
              href={`/players/${player.id}`}
              onClick={() => onOpenChange(false)}
              className="relative h-80 w-60 block hover:opacity-90 transition-opacity"
              aria-label={`Open ${player.first_name} ${player.last_name} profile`}
            >
              <Image
                src={getPlayerImageUrl(player.image_url)}
                alt={`${player.first_name} ${player.last_name}`}
                fill
                className="object-contain"
                sizes="128px"
                unoptimized
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/no-image-player.png'
                }}
              />
            </Link>
            <div className="text-center">
              <Link
                href={`/players/${player.id}`}
                onClick={() => onOpenChange(false)}
                className="text-xl font-bold text-white hover:text-[var(--fpl-cyan)] transition-colors"
              >
                {player.first_name} {player.last_name}
              </Link>
              {currentAverageRating > 0 && (
                <p className="text-sm text-white/70 mt-1">
                  Average rating: {currentAverageRating.toFixed(1)} ({ratingCount}{' '}
                  {ratingCount === 1 ? 'rating' : 'ratings'})
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            {votingLocked ? (
              <p className="text-amber-300 text-sm text-center px-2">
                Voting locked — ratings close 12 hours after the match is added.
              </p>
            ) : (
              <>
                {isLoadingRating ? (
                  <p className="text-white/60 text-sm">Loading your rating...</p>
                ) : userRating ? (
                  <p className="text-white/80 text-sm">
                    Your rating: {userRating} {userRating === 1 ? 'star' : 'stars'}
                  </p>
                ) : (
                  <p className="text-white/55 text-sm">Tap a star to rate</p>
                )}
                <div
                  className="flex items-center gap-2"
                  onMouseLeave={() => setHoveredRating(null)}
                >
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= displayRating
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleStarClick(star)}
                        onMouseEnter={() =>
                          !isSubmitting && !isLoadingRating && setHoveredRating(star)
                        }
                        disabled={isSubmitting || isLoadingRating}
                        className={cn(
                          'transition-all duration-150',
                          !isSubmitting &&
                            !isLoadingRating &&
                            'cursor-pointer hover:scale-125',
                          (isSubmitting || isLoadingRating) &&
                            'cursor-not-allowed opacity-60',
                        )}
                      >
                        <Star
                          className={cn(
                            'w-10 h-10',
                            isFilled
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'fill-transparent text-white/30',
                          )}
                        />
                      </button>
                    )
                  })}
                </div>
                {selectedRating && !isSubmitting && (
                  <p className="text-green-400 text-sm font-semibold animate-in fade-in">
                    Thanks for rating!
                  </p>
                )}
                {isSubmitting && <p className="text-white/60 text-sm">Submitting...</p>}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
