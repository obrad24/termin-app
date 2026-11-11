'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { Sparkles } from 'lucide-react'

const adminPanel =
  'bg-[var(--fpl-purple)] border-white/10 text-white shadow-none'
const adminOutlineBtn =
  'border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white'
const adminPrimaryBtn =
  'bg-[var(--fpl-green)] text-[var(--fpl-purple)] hover:bg-[var(--fpl-green)]/90'

type GameweekRow = {
  gameweek: number
  result_id: number
  date: string
  label: string
  locked: boolean
}

type LogRow = {
  id: number
  action: string
  message?: string | null
  gameweek?: number | null
  created_at: string
}

export default function FantasyAdminPanel({
  seasonId,
  players,
}: {
  seasonId: number | null
  players: Array<{ id: number; first_name: string; last_name: string }>
}) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [gameweeks, setGameweeks] = useState<GameweekRow[]>([])
  const [logs, setLogs] = useState<LogRow[]>([])
  const [adjustForm, setAdjustForm] = useState({
    result_id: '',
    player_id: '',
    points: '0',
    reason: '',
  })

  useEffect(() => {
    if (seasonId) {
      fetchGameweeks()
      fetchLogs()
    }
  }, [seasonId])

  const fetchGameweeks = async () => {
    if (!seasonId) return
    try {
      const res = await fetch(`/api/fantasy/gameweeks?season_id=${seasonId}`)
      if (res.ok) {
        const data = await res.json()
        setGameweeks(data.gameweeks || [])
      }
    } catch (error) {
      console.error(error)
    }
  }

  const fetchLogs = async () => {
    try {
      const q = seasonId ? `?season_id=${seasonId}&limit=20` : '?limit=20'
      const res = await fetch(`/api/fantasy/logs${q}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error(error)
    }
  }

  const recalculateSeason = async (force = false) => {
    if (!seasonId) {
      toast({ title: 'Error', description: 'Select a season first', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/fantasy/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ season_id: seasonId, force }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast({
        title: 'Recalculated',
        description: `${data.processed || 0} matches processed, ${data.skipped || 0} skipped`,
      })
      fetchGameweeks()
      fetchLogs()
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const toggleLock = async (gw: GameweekRow) => {
    if (!seasonId) return
    setLoading(true)
    try {
      const res = await fetch('/api/fantasy/gameweeks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          season_id: seasonId,
          gameweek: gw.gameweek,
          locked: !gw.locked,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast({
        title: gw.locked ? 'Unlocked' : 'Locked',
        description: `GW${gw.gameweek}`,
      })
      fetchGameweeks()
      fetchLogs()
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const submitAdjust = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/fantasy/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result_id: adjustForm.result_id,
          player_id: adjustForm.player_id,
          points: adjustForm.points,
          reason: adjustForm.reason,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast({ title: 'Adjustment saved' })
      setAdjustForm({ result_id: '', player_id: '', points: '0', reason: '' })
      fetchLogs()
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className={adminPanel}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Sparkles className="w-5 h-5 text-[var(--fpl-green)]" />
          Fantasy admin
        </CardTitle>
        <CardDescription className="text-white/50">
          Recalculate points, lock gameweeks, and apply manual adjustments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            disabled={loading || !seasonId}
            className={adminPrimaryBtn}
            onClick={() => recalculateSeason(false)}
          >
            Recalculate season
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={loading || !seasonId}
            className={adminOutlineBtn}
            onClick={() => recalculateSeason(true)}
          >
            Force recalculate (ignore locks)
          </Button>
        </div>

        <div>
          <h3 className="text-white font-semibold text-sm mb-2">Gameweeks</h3>
          {!seasonId ? (
            <p className="text-white/50 text-sm">Select a season to manage gameweeks</p>
          ) : gameweeks.length === 0 ? (
            <p className="text-white/50 text-sm">No matches in this season</p>
          ) : (
            <div className="max-h-56 overflow-y-auto space-y-2">
              {gameweeks.map((gw) => (
                <div
                  key={gw.gameweek}
                  className="flex items-center justify-between gap-3 p-2 rounded-lg border border-white/10 bg-white/5"
                >
                  <div className="min-w-0">
                    <p className="text-white text-sm font-semibold truncate">
                      GW{gw.gameweek} · {gw.label}
                    </p>
                    <p className="text-white/45 text-[11px]">
                      {format(new Date(gw.date), 'd MMM yyyy')} · match #{gw.result_id}
                      {gw.locked ? ' · locked' : ''}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={loading}
                    className={adminOutlineBtn}
                    onClick={() => toggleLock(gw)}
                  >
                    {gw.locked ? 'Unlock' : 'Lock'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={submitAdjust} className="space-y-3 border-t border-white/10 pt-4">
          <h3 className="text-white font-semibold text-sm">Manual adjustment</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-white/70">Match ID</Label>
              <Input
                value={adjustForm.result_id}
                onChange={(e) => setAdjustForm({ ...adjustForm, result_id: e.target.value })}
                placeholder="result id"
                className="mt-1 bg-[var(--fpl-p90)] border-white/15 text-white"
                required
              />
            </div>
            <div>
              <Label className="text-white/70">Points delta</Label>
              <Input
                type="number"
                value={adjustForm.points}
                onChange={(e) => setAdjustForm({ ...adjustForm, points: e.target.value })}
                className="mt-1 bg-[var(--fpl-p90)] border-white/15 text-white"
                required
              />
            </div>
          </div>
          <div>
            <Label className="text-white/70">Player</Label>
            <select
              value={adjustForm.player_id}
              onChange={(e) => setAdjustForm({ ...adjustForm, player_id: e.target.value })}
              className="mt-1 w-full h-9 rounded-md bg-[var(--fpl-p90)] border border-white/15 text-white text-sm px-3"
              required
            >
              <option value="">Select player</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-white/70">Reason (required)</Label>
            <Input
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
              placeholder="Why is this adjustment needed?"
              className="mt-1 bg-[var(--fpl-p90)] border-white/15 text-white placeholder:text-white/35"
              required
            />
          </div>
          <Button type="submit" disabled={loading} className={adminPrimaryBtn}>
            Save adjustment
          </Button>
        </form>

        <div className="border-t border-white/10 pt-4">
          <h3 className="text-white font-semibold text-sm mb-2">Calculation history</h3>
          {logs.length === 0 ? (
            <p className="text-white/50 text-sm">No logs yet</p>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-1.5 text-xs">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="px-2 py-1.5 rounded-md bg-white/5 border border-white/10"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[var(--fpl-cyan)] font-semibold">{log.action}</span>
                    <span className="text-white/40">
                      {format(new Date(log.created_at), 'd MMM HH:mm')}
                    </span>
                  </div>
                  <p className="text-white/70 mt-0.5">{log.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
