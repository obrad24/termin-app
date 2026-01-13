'use client'

import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Player } from '@/lib/supabase'
import { getPlayerImageUrl } from '@/lib/image-utils'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface PlayerRatingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  player: Player | null
  matchId: number
  currentAverageRating?: number
  ratingCount?: number
  onRatingSubmitted?: () => void
}

export default function PlayerRatingDialog({
  open,
  onOpenChange,
  player,
  matchId,
  currentAverageRating = 0,
  ratingCount = 0,
  onRatingSubmitted
}: PlayerRatingDialogProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [userRating, setUserRating] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingRating, setIsLoadingRating] = useState(false)

  // Dohvati korisnikovu ocjenu kada se dialog otvori
  useEffect(() => {
    if (open && player) {
      fetchUserRating()
    } else {
      // Resetuj kada se zatvori
      setUserRating(null)
      setSelectedRating(null)
      setHoveredRating(null)
    }
  }, [open, player, matchId])

  const fetchUserRating = async () => {
    if (!player) return
    
    setIsLoadingRating(true)
    try {
      const response = await fetch(
        `/api/match-ratings/user-rating?match_id=${matchId}&player_id=${player.id}`
      )
      if (response.ok) {
        const data = await response.json()
        if (data.rating !== null) {
          setUserRating(data.rating)
          setSelectedRating(data.rating)
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
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/match-ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          match_id: matchId,
          player_id: player.id,
          rating: rating,
        }),
      })

      if (response.ok) {
        setSelectedRating(rating)
        setUserRating(rating)
        if (onRatingSubmitted) {
          onRatingSubmitted()
        }
        // Zatvori dialog nakon kratke pauze
        setTimeout(() => {
          onOpenChange(false)
        }, 1000)
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

  const displayRating = hoveredRating !== null ? hoveredRating : (selectedRating || userRating || 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-white/30 text-white max-w-md w-[90%]">
        <DialogHeader>
          <DialogTitle className="text-white text-center text-xl">
            Ocijeni igrača
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-6 py-4">
          {/* Player Image and Name */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-80 w-60">
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
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-white">
                {player.first_name} {player.last_name}
              </h3>
              {currentAverageRating > 0 && (
                <p className="text-sm text-white/70 mt-1">
                  Prosječna ocjena: {currentAverageRating.toFixed(1)} ({ratingCount} {ratingCount === 1 ? 'ocjena' : 'ocjena'})
                </p>
              )}
            </div>
          </div>

          {/* Star Rating */}
          <div className="flex flex-col items-center gap-4">
            {userRating && (
              <p className="text-white/80 text-sm">
                Tvoja ocjena: {userRating} {userRating === 1 ? 'zvjezdica' : 'zvjezdice'}
              </p>
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
                    onMouseEnter={() => !isSubmitting && setHoveredRating(star)}
                    disabled={isSubmitting}
                    className={cn(
                      "transition-all duration-150",
                      !isSubmitting && "cursor-pointer hover:scale-125",
                      isSubmitting && "cursor-not-allowed opacity-60"
                    )}
                  >
                    <Star
                      className={cn(
                        "w-10 h-10",
                        isFilled
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-transparent text-white/30"
                      )}
                    />
                  </button>
                )
              })}
            </div>
            {selectedRating && (
              <p className="text-green-400 text-sm font-semibold animate-in fade-in">
                Hvala na ocjeni!
              </p>
            )}
            {isSubmitting && (
              <p className="text-white/60 text-sm">Šalje se...</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
