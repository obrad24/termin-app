'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { X } from 'lucide-react'
import Header from '@/components/header'
import { useSeason } from '@/components/season-provider'
import { getPlayerImageUrl } from '@/lib/image-utils'
import FantasyScoringRules from '@/components/fantasy-scoring-rules'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

type PlayerOpt = {
  id: number
  first_name: string
  last_name: string
  team: string | null
  image_url?: string | null
  price?: number | null
}

function toId(value: unknown): number {
  const n = typeof value === 'string' ? parseInt(value, 10) : Number(value)
  return Number.isFinite(n) ? n : NaN
}

function formatPrice(price?: number | null) {
  if (price == null || Number.isNaN(Number(price))) return '—'
  const n = Number(price)
  return `£${n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)}m`
}

function normalizePlayer(p: any): PlayerOpt {
  const priceRaw = p.price
  const price =
    priceRaw === null || priceRaw === undefined || priceRaw === ''
      ? null
      : Number(priceRaw)
  return {
    id: toId(p.id),
    first_name: p.first_name,
    last_name: p.last_name,
    team: p.team ?? null,
    image_url: p.image_url ?? null,
    price: price != null && !Number.isNaN(price) ? price : null,
  }
}

type TransferWindow = {
  locked: boolean
  timezone: string
  lock_weekday: string
  lock_time: string
  unlock_weekday: string
  unlock_time: string
  next_deadline_at: string
  next_unlock_at: string
  message: string
}

type MyTeamData = {
  gameweek: number
  locked: boolean
  schedule_locked?: boolean
  admin_locked?: boolean
  transfer_window?: TransferWindow
  squad_size: number
  max_transfers: number
  max_per_team?: number
  max_budget?: number
  has_previous_squad: boolean
  free_initial_pick: boolean
  transfers_used: number
  transfers_remaining: number | null
  player_ids: number[]
  captain_player_id?: number | null
  previous_player_ids?: number[]
  available_players: PlayerOpt[]
  team_limit_ok?: boolean
  team_limit_warning?: string | null
}

function formatDeadline(iso: string, timeZone = 'Europe/Belgrade') {
  try {
    return new Intl.DateTimeFormat('sr-Latn', {
      timeZone,
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function PitchCard({
  player,
  onClick,
  emptyLabel,
  disabled,
  isCaptain,
  teamLogo,
}: {
  player?: PlayerOpt | null
  onClick?: () => void
  emptyLabel?: string
  disabled?: boolean
  isCaptain?: boolean
  teamLogo?: string | null
}) {
  if (!player) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="relative flex flex-col items-center w-[80px] sm:w-[88px] group disabled:opacity-60"
      >
        <div className="relative z-0 w-[68px] h-[80px] sm:w-[76px] sm:h-[90px] rounded-lg border-2 border-dashed border-white/35 bg-black/20 flex items-center justify-center">
          <span className="text-white/70 text-2xl font-light leading-none">+</span>
        </div>
        <div className="relative z-10 w-full -mt-1 overflow-hidden rounded-[4px] bg-white/90 shadow-sm leading-none">
          <p className="text-[var(--fpl-purple)] text-[11px] font-bold truncate text-center px-1 py-[4px]">
            {emptyLabel || 'Empty'}
          </p>
          <p className="bg-[#e8e8e8] text-[var(--fpl-purple)]/50 text-[11px] font-bold text-center px-1 py-[4px]">
            —
          </p>
        </div>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="relative flex flex-col items-center w-[80px] sm:w-[88px] group disabled:opacity-70"
    >
      <div className="relative z-0 w-[68px] h-[80px] sm:w-[76px] sm:h-[90px]">
        <Image
          src={getPlayerImageUrl(player.image_url, true)}
          alt={`${player.first_name} ${player.last_name}`}
          fill
          className="object-contain object-bottom drop-shadow-md group-hover:scale-105 transition-transform"
          unoptimized
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = '/no-image-player.png'
          }}
        />
        {isCaptain && (
          <span className="absolute top-0 left-0 z-20 w-5 h-5 rounded-full bg-[var(--fpl-green)] text-[var(--fpl-purple)] text-[10px] font-black flex items-center justify-center shadow">
            C
          </span>
        )}
        {teamLogo && (
          <span className="absolute top-0 right-0 z-20 w-4 h-4 sm:w-[18px] sm:h-[18px] overflow-hidden flex items-center justify-center drop-shadow-md">
            <Image
              src={teamLogo}
              alt={player.team || 'Team'}
              width={18}
              height={18}
              className="object-contain"
              unoptimized
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = '/placeholder-logo.svg'
              }}
            />
          </span>
        )}
      </div>
      <div className="relative z-10 w-full -mt-1 overflow-hidden rounded-[4px] bg-white shadow-sm leading-none">
        <p className="text-[var(--fpl-purple)] text-[11px] font-bold truncate text-center px-1 py-[4px]">
          {player.last_name}
        </p>
        <p
          className={`text-[10px] font-semibold truncate text-center px-1 py-[4px] ${
            isCaptain
              ? 'bg-[var(--fpl-green)] text-[var(--fpl-purple)]'
              : 'bg-[#e8e8e8] text-[var(--fpl-purple)]'
          }`}
        >
          {isCaptain ? 'Captain · x2' : formatPrice(player.price)}
        </p>
      </div>
    </button>
  )
}

export default function MyTeamPage() {
  const router = useRouter()
  const { currentSeason } = useSeason()
  const [nickname, setNickname] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [data, setData] = useState<MyTeamData | null>(null)
  const [selected, setSelected] = useState<number[]>([])
  const [captainId, setCaptainId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'pitch' | 'list'>('pitch')

  const [activePlayer, setActivePlayer] = useState<PlayerOpt | null>(null)
  const [playerSheetOpen, setPlayerSheetOpen] = useState(false)
  const [replaceSheetOpen, setReplaceSheetOpen] = useState(false)
  const [replacingId, setReplacingId] = useState<number | null>(null)

  const [passwordSheetOpen, setPasswordSheetOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [teamLogos, setTeamLogos] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch('/api/player-auth/me')
      .then((r) => r.json())
      .then((me) => {
        if (!me.authenticated) {
          router.replace('/login')
          return
        }
        setNickname(me.account?.nickname || null)
        setAuthChecked(true)
      })
      .catch(() => router.replace('/login'))
  }, [router])

  useEffect(() => {
    if (!authChecked || !currentSeason?.id) return
    loadTeam()
  }, [authChecked, currentSeason?.id])

  useEffect(() => {
    let cancelled = false
    const loadTeams = async () => {
      try {
        const seasonQuery = currentSeason?.id != null ? `?season_id=${currentSeason.id}` : ''
        const res = await fetch(`/api/teams${seasonQuery}`)
        if (!res.ok) return
        const teams = await res.json()
        if (cancelled || !Array.isArray(teams)) return
        const map: Record<string, string> = {}
        for (const t of teams) {
          if (t?.name && t?.logo_url) map[t.name] = t.logo_url
        }
        setTeamLogos(map)
      } catch {
        // ignore
      }
    }
    loadTeams()
    return () => {
      cancelled = true
    }
  }, [currentSeason?.id])

  const logoFor = (team: string | null | undefined) =>
    team ? teamLogos[team] || null : null

  const loadTeam = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/my-team?season_id=${currentSeason!.id}`)
      if (response.status === 401) {
        router.replace('/login')
        return
      }
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Failed to load')
      const available_players = (json.available_players || []).map(normalizePlayer)
      const player_ids = (json.player_ids || []).map(toId).filter((n: number) => !Number.isNaN(n))
      const previous_player_ids = (json.previous_player_ids || [])
        .map(toId)
        .filter((n: number) => !Number.isNaN(n))
      const captainRaw = json.captain_player_id
      const captain =
        captainRaw == null || captainRaw === '' ? null : toId(captainRaw)
      const validCaptain =
        captain != null && !Number.isNaN(captain) && player_ids.includes(captain)
          ? captain
          : null
      setData({
        ...json,
        available_players,
        player_ids,
        previous_player_ids,
        captain_player_id: validCaptain,
      })
      setSelected(player_ids)
      setCaptainId(validCaptain)
    } catch (err: any) {
      setError(err.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  const baselineIds = useMemo(() => {
    if (!data || data.free_initial_pick) return new Set<number>()
    return new Set(data.previous_player_ids || [])
  }, [data])

  const transfersUsedNow = useMemo(() => {
    if (!data || data.free_initial_pick) return 0
    let incoming = 0
    for (const id of selected) {
      if (!baselineIds.has(id)) incoming += 1
    }
    return incoming
  }, [data, selected, baselineIds])

  const transfersLeft = data?.free_initial_pick
    ? null
    : Math.max(0, (data?.max_transfers || 2) - transfersUsedNow)

  const maxBudget = data?.max_budget ?? 40

  const playersById = useMemo(() => {
    const map = new Map<number, PlayerOpt>()
    ;(data?.available_players || []).forEach((p) => map.set(p.id, p))
    return map
  }, [data])

  const slots = useMemo(() => {
    const size = data?.squad_size || 5
    const filled = selected
      .map((id) => playersById.get(id))
      .filter(Boolean) as PlayerOpt[]
    const out: (PlayerOpt | null)[] = [...filled]
    while (out.length < size) out.push(null)
    return out.slice(0, size)
  }, [selected, playersById, data])

  const top = slots[0]
  const mid = slots.slice(1, 3)
  const bottom = slots.slice(3, 5)

  const selectedPlayers = useMemo(() => {
    return selected
      .map((id) => playersById.get(id))
      .filter(Boolean) as PlayerOpt[]
  }, [selected, playersById])

  const budgetSpent = useMemo(() => {
    return Math.round(
      selectedPlayers.reduce((sum, p) => sum + (Number(p.price) || 0), 0) * 10,
    ) / 10
  }, [selectedPlayers])

  const budgetRemaining = Math.round((maxBudget - budgetSpent) * 10) / 10

  const selectablePlayers = useMemo(() => {
    const exclude = new Set(selected)
    if (replacingId != null) exclude.delete(replacingId)
    const list = (data?.available_players || []).filter((p) => !exclude.has(p.id))
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter((p) =>
      `${p.first_name} ${p.last_name} ${p.team || ''}`.toLowerCase().includes(q),
    )
  }, [data, search, selected, replacingId])

  const openPlayerSheet = (player: PlayerOpt) => {
    setActivePlayer(player)
    setPlayerSheetOpen(true)
  }

  const openAddSheet = () => {
    if (data?.locked) return
    if (selected.length >= (data?.squad_size || 5)) {
      setError('Squad is full — tap a player to select a replacement')
      return
    }
    setReplacingId(null)
    setSearch('')
    setReplaceSheetOpen(true)
  }

  const openReplaceSheet = () => {
    if (!activePlayer || data?.locked) return
    setReplacingId(activePlayer.id)
    setSearch('')
    setPlayerSheetOpen(false)
    setReplaceSheetOpen(true)
  }

  const removePlayer = (id: number) => {
    if (data?.locked) return
    setMessage(null)
    setError(null)
    setSelected((prev) => prev.filter((x) => x !== id))
    setCaptainId((prev) => (prev === id ? null : prev))
    setPlayerSheetOpen(false)
    setActivePlayer(null)
  }

  const makeCaptain = (id: number) => {
    if (data?.locked) return
    if (!selected.includes(id)) return
    setCaptainId(id)
    setMessage(null)
    setError(null)
    setPlayerSheetOpen(false)
    setActivePlayer(null)
  }

  const maxPerTeam = data?.max_per_team || 3

  const maxFromOneTeam = (ids: number[]) => {
    const counts: Record<string, number> = {}
    let max = 0
    for (const id of ids) {
      const team = (playersById.get(id)?.team || '').trim()
      if (!team) continue
      counts[team] = (counts[team] || 0) + 1
      max = Math.max(max, counts[team])
    }
    return max
  }

  const teamLimitViolation = (ids: number[]) => {
    const counts: Record<string, number> = {}
    let worst: { team: string; count: number } | null = null
    for (const id of ids) {
      const team = (playersById.get(id)?.team || '').trim()
      if (!team) continue
      counts[team] = (counts[team] || 0) + 1
      if (counts[team] > maxPerTeam && (!worst || counts[team] > worst.count)) {
        worst = { team, count: counts[team] }
      }
    }
    return worst
  }

  /** Allow repair of grandfathered over-limit squads; never create/worsen a violation. */
  const isTeamChangeAllowed = (prevIds: number[], nextIds: number[]) => {
    const prevMax = maxFromOneTeam(prevIds)
    const nextMax = maxFromOneTeam(nextIds)
    if (nextMax <= maxPerTeam) return true
    if (prevMax <= maxPerTeam) return false
    return nextMax <= prevMax
  }

  const sameIds = (a: number[], b: number[]) => {
    if (a.length !== b.length) return false
    const left = [...a].sort((x, y) => x - y)
    const right = [...b].sort((x, y) => x - y)
    return left.every((id, i) => id === right[i])
  }

  const applySelection = (newId: number) => {
    if (data?.locked) return
    setMessage(null)
    setError(null)

    let next: number[]
    let nextCaptain = captainId
    if (replacingId != null) {
      next = selected.map((id) => (id === replacingId ? newId : id))
      if (!selected.includes(replacingId)) {
        next = selected.includes(newId) ? selected : [...selected, newId]
      }
      if (captainId === replacingId) nextCaptain = newId
    } else {
      if (selected.includes(newId)) return
      if (selected.length >= (data?.squad_size || 5)) {
        setError(`Squad is full (${data?.squad_size || 5})`)
        return
      }
      next = [...selected, newId]
      if (nextCaptain == null) nextCaptain = newId
    }

    const cost = next.reduce((sum, id) => {
      const p = playersById.get(id)
      return sum + (Number(p?.price) || 0)
    }, 0)
    if (cost > maxBudget + 0.05) {
      setError(`Budget exceeded: £${cost.toFixed(1)}m / £${maxBudget}m`)
      return
    }

    if (!isTeamChangeAllowed(selected, next)) {
      const teamHit = teamLimitViolation(next)
      setError(
        teamHit
          ? `Max ${maxPerTeam} players from the same team (${teamHit.team})`
          : `Max ${maxPerTeam} players from the same team`,
      )
      return
    }

    if (!data?.free_initial_pick) {
      let incoming = 0
      for (const pid of next) {
        if (!baselineIds.has(pid)) incoming += 1
      }
      if (incoming > (data?.max_transfers || 2)) {
        setError(`Max ${data?.max_transfers || 2} changes this gameweek`)
        return
      }
    }

    setSelected(next)
    setCaptainId(nextCaptain != null && next.includes(nextCaptain) ? nextCaptain : null)
    setReplaceSheetOpen(false)
    setReplacingId(null)
    setActivePlayer(null)
  }

  const save = async () => {
    if (!currentSeason?.id || !data) return
    if (selected.length !== data.squad_size) {
      setError(`Select exactly ${data.squad_size} players`)
      return
    }
    if (captainId == null || !selected.includes(captainId)) {
      setError('Select a captain — their points count double')
      return
    }
    if (budgetSpent > maxBudget + 0.05) {
      setError(`Budget exceeded: £${budgetSpent.toFixed(1)}m / £${maxBudget}m`)
      return
    }
    const unchanged =
      sameIds(selected, data.player_ids || []) && captainId === (data.captain_player_id ?? null)
    const teamHit = teamLimitViolation(selected)
    if (teamHit && !sameIds(selected, data.player_ids || [])) {
      setError(
        `Max ${maxPerTeam} players from the same team (${teamHit.team}). Reduce to ${maxPerTeam} before saving changes.`,
      )
      return
    }
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const response = await fetch('/api/my-team', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          season_id: currentSeason.id,
          player_ids: selected,
          captain_player_id: captainId,
        }),
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Save failed')
      setMessage(`Squad saved for GW${json.gameweek}`)
      await loadTeam()
    } catch (err: any) {
      setError(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const logout = async () => {
    await fetch('/api/player-auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const openPasswordSheet = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError(null)
    setPasswordMessage(null)
    setPasswordSheetOpen(true)
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordSaving(true)
    setPasswordError(null)
    setPasswordMessage(null)
    try {
      const response = await fetch('/api/player-auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Failed to change password')
      setPasswordMessage('Password updated')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password')
    } finally {
      setPasswordSaving(false)
    }
  }

  if (!authChecked) {
    return (
      <main className="min-h-screen bg-[var(--fpl-p120)]">
        <Header />
        <p className="text-white/60 text-center py-16 text-sm">Checking login...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[var(--fpl-p120)] pb-28 md:pb-10">
      <Header />
      <section className="relative px-3 sm:px-6 py-4 max-w-3xl mx-auto">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">My Fantasy Team</h1>
            <p className="text-white/45 text-sm mt-1">
              {nickname ? `${nickname} · ` : ''}
              {currentSeason?.name || 'Season'}
              {data ? ` · GW${data.gameweek}` : ''}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0 mt-1">
            <button
              type="button"
              onClick={openPasswordSheet}
              className="text-white/60 text-xs font-semibold hover:text-white"
            >
              Change password
            </button>
            <button
              type="button"
              onClick={logout}
              className="text-white/60 text-xs font-semibold hover:text-white"
            >
              Log out
            </button>
          </div>
        </div>

        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="inline-flex rounded-full bg-[var(--fpl-purple)] border border-white/10 p-0.5">
            <button
              type="button"
              onClick={() => setView('pitch')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
                view === 'pitch'
                  ? 'bg-[var(--fpl-p110)] text-white'
                  : 'text-white/55 hover:text-white'
              }`}
            >
              Pitch
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
                view === 'list'
                  ? 'bg-[var(--fpl-p110)] text-white'
                  : 'text-white/55 hover:text-white'
              }`}
            >
              List
            </button>
          </div>
          <p className="text-white/55 text-[11px] font-semibold">
            {selected.length}/{data?.squad_size || 5}
            {data?.free_initial_pick
              ? ' · pick any 5'
              : ` · ${transfersUsedNow}/${data?.max_transfers || 2} transfers`}
            {` · max ${data?.max_per_team || 3}/team`}
          </p>
        </div>

        <div
          className={`mb-3 rounded-xl px-3 py-2.5 flex items-center justify-between gap-2 ${
            budgetRemaining < 0
              ? 'bg-red-500/15 border border-red-500/30'
              : 'bg-[var(--fpl-cyan)]/20 border border-[var(--fpl-cyan)]/30'
          }`}
        >
          <span className="text-white text-sm font-semibold">
            Bank £{budgetRemaining.toFixed(1)}m
          </span>
          <span className="text-white/70 text-xs">
            £{budgetSpent.toFixed(1)}m / £{maxBudget}m
          </span>
        </div>

        {(data?.team_limit_warning || teamLimitViolation(selected)) && (
          <div className="mb-3 rounded-xl px-3 py-2.5 border border-amber-400/30 bg-amber-500/10">
            <p className="text-amber-200 text-xs leading-snug">
              {data?.team_limit_warning ||
                `Max ${maxPerTeam} players from the same team. Your current pick is over the limit — reduce it before saving changes.`}
            </p>
          </div>
        )}

        {data?.transfer_window && (
          <div
            className={`mb-3 rounded-xl px-3 py-2.5 border ${
              data.locked
                ? 'bg-amber-500/10 border-amber-400/30'
                : 'bg-white/5 border-white/10'
            }`}
          >
            <p
              className={`text-sm font-semibold ${
                data.locked ? 'text-amber-200' : 'text-white'
              }`}
            >
              {data.locked ? 'Transfers locked' : 'Transfer window open'}
            </p>
            <p className="text-white/55 text-xs mt-0.5">
              {data.locked
                ? `Opens ${formatDeadline(
                    data.transfer_window.next_unlock_at,
                    data.transfer_window.timezone,
                  )} · max ${data.max_transfers} changes/GW`
                : `Deadline ${formatDeadline(
                    data.transfer_window.next_deadline_at,
                    data.transfer_window.timezone,
                  )} · max ${data.max_transfers} changes`}
            </p>
          </div>
        )}

        {loading ? (
          <p className="text-white/60 text-center py-12 text-sm">Loading squad...</p>
        ) : (
          <>
            {view === 'pitch' ? (
              <div className="mb-4 overflow-hidden rounded-2xl border border-white/10 bg-[var(--fpl-purple)]">
                <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
                  <h2 className="text-white font-bold text-sm">Your team</h2>
                  <span className="text-white/45 text-[11px]">
                    {data?.locked ? 'Locked' : 'Tap player for options'}
                  </span>
                </div>

                <div className="relative w-full aspect-[344/389] min-h-[360px] sm:min-h-[420px]">
                  <Image
                    src="/pitch-graphic.svg"
                    alt=""
                    fill
                    className="object-cover object-[center_12%] pointer-events-none select-none"
                    priority
                    unoptimized
                  />

                  <div className="absolute inset-0 z-10 flex flex-col justify-between py-4 sm:py-5 px-2">
                    <div className="relative z-[3] flex justify-center">
                      <PitchCard
                        player={top}
                        emptyLabel="Slot 1"
                        isCaptain={!!top && top.id === captainId}
                        teamLogo={logoFor(top?.team)}
                        disabled={!!data?.locked && !!top}
                        onClick={() => (top ? openPlayerSheet(top) : openAddSheet())}
                      />
                    </div>

                    <div className="relative z-[2] flex justify-center gap-12 sm:gap-16">
                      {mid.map((p, i) => (
                        <PitchCard
                          key={p?.id ?? `mid-${i}`}
                          player={p}
                          emptyLabel={`Slot ${i + 2}`}
                          isCaptain={!!p && p.id === captainId}
                          teamLogo={logoFor(p?.team)}
                          disabled={!!data?.locked && !!p}
                          onClick={() => (p ? openPlayerSheet(p) : openAddSheet())}
                        />
                      ))}
                    </div>

                    <div className="relative z-[1] flex justify-center gap-12 sm:gap-16 pb-1">
                      {bottom.map((p, i) => (
                        <PitchCard
                          key={p?.id ?? `bot-${i}`}
                          player={p}
                          emptyLabel={`Slot ${i + 4}`}
                          isCaptain={!!p && p.id === captainId}
                          teamLogo={logoFor(p?.team)}
                          disabled={!!data?.locked && !!p}
                          onClick={() => (p ? openPlayerSheet(p) : openAddSheet())}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-black/35 border-t border-white/10 px-3 py-3">
                  <p className="text-center text-white/70 text-xs mb-2">
                    {data?.free_initial_pick
                      ? 'First pick — choose any 5 players + captain (x2)'
                      : `Transfers left: ${transfersLeft} · captain change free until deadline`}
                  </p>
                  <button
                    type="button"
                    onClick={openAddSheet}
                    disabled={!!data?.locked || selected.length >= (data?.squad_size || 5)}
                    className="w-full rounded-xl border border-white/15 text-white text-sm font-semibold py-2.5 hover:bg-white/5 disabled:opacity-50"
                  >
                    Add players
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-4 overflow-hidden rounded-2xl border border-white/10 bg-[var(--fpl-purple)]">
                <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
                  <h2 className="text-white font-bold text-sm">Selected squad</h2>
                  <span className="text-white/45 text-[11px]">
                    {selectedPlayers.length}/{data?.squad_size || 5}
                  </span>
                </div>

                {selectedPlayers.length === 0 ? (
                  <p className="text-white/50 text-sm text-center py-10 px-4">
                    No players selected yet. Add from Pitch empty slots.
                  </p>
                ) : (
                  <div>
                    {selectedPlayers.map((p, index) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => openPlayerSheet(p)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 border-b border-white/10 last:border-0 text-left hover:bg-white/5 transition"
                      >
                        <span className="w-5 text-white/40 text-xs font-bold tabular-nums">
                          {index + 1}
                        </span>
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-b from-[var(--fpl-cyan)] to-[var(--fpl-lilac)] shrink-0">
                          <Image
                            src={getPlayerImageUrl(p.image_url, true)}
                            alt={p.last_name}
                            fill
                            className="object-contain object-bottom"
                            unoptimized
                          />
                          {p.id === captainId && (
                            <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-[var(--fpl-green)] text-[var(--fpl-purple)] text-[9px] font-black flex items-center justify-center">
                              C
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-white text-sm font-semibold truncate">
                            {p.first_name} {p.last_name}
                            {p.id === captainId ? ' · C' : ''}
                          </p>
                          <p className="text-white/45 text-xs truncate">
                            {p.id === captainId
                              ? 'Captain · points x2'
                              : p.team || 'Free agent'}
                          </p>
                        </div>
                        <span className="text-white font-bold text-sm tabular-nums shrink-0">
                          {formatPrice(p.price)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {!data?.locked && selected.length < (data?.squad_size || 5) && (
                  <div className="p-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={openAddSheet}
                      className="w-full rounded-xl bg-[var(--fpl-green)] text-[var(--fpl-purple)] text-sm font-bold py-2.5"
                    >
                      Add players
                    </button>
                  </div>
                )}
              </div>
            )}

            {message && (
              <p className="text-[var(--fpl-green)] text-sm mb-3 bg-[var(--fpl-green)]/10 border border-[var(--fpl-green)]/20 rounded-xl px-3 py-2">
                {message}
              </p>
            )}
            {error && (
              <p className="text-red-300 text-sm mb-3 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                {error}
              </p>
            )}
            {data?.locked && (
              <p className="text-amber-300 text-xs mb-3">
                {data.schedule_locked
                  ? 'Locked Thu 17:00 → Fri 12:00 — squad cannot be changed.'
                  : 'This gameweek is locked — squad cannot be changed.'}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={save}
                disabled={saving || !!data?.locked || selected.length !== (data?.squad_size || 5)}
                className="flex-1 rounded-xl bg-[var(--fpl-green)] text-[var(--fpl-purple)] font-bold py-3 hover:opacity-90 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save My Team'}
              </button>
              <Link
                href="/fantasy"
                className="rounded-xl border border-white/15 text-white/80 px-4 py-3 text-sm font-semibold hover:bg-white/5"
              >
                Fantasy
              </Link>
            </div>

            <FantasyScoringRules className="mt-4" />
          </>
        )}
      </section>

      {/* Player actions sheet */}
      <Sheet
        open={playerSheetOpen}
        onOpenChange={(open) => {
          setPlayerSheetOpen(open)
          if (!open) setActivePlayer(null)
        }}
      >
        <SheetContent
          side="bottom"
          className="!bg-[var(--fpl-p120)] border-t border-white/15 rounded-t-3xl p-0 gap-0 [&>button]:hidden max-h-[85vh]"
        >
          {activePlayer && (
            <div className="px-4 pt-4 pb-6">
              <div className="flex justify-end mb-2">
                <button
                  type="button"
                  onClick={() => setPlayerSheetOpen(false)}
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[var(--fpl-cyan)] via-[#7a5cff] to-[var(--fpl-lilac)] min-h-[120px] mb-4">
                <div className="absolute left-0 bottom-0 w-[40%] h-full">
                  <Image
                    src={getPlayerImageUrl(activePlayer.image_url)}
                    alt={`${activePlayer.first_name} ${activePlayer.last_name}`}
                    fill
                    className="object-contain object-bottom"
                    unoptimized
                  />
                </div>
                <div className="relative z-10 pl-[38%] pr-4 py-4">
                  <p className="text-[var(--fpl-purple)]/75 text-xs font-semibold">
                    {activePlayer.id === captainId ? 'Captain' : 'Player'}
                  </p>
                  <p className="text-[var(--fpl-purple)] text-sm font-medium leading-tight">
                    {activePlayer.first_name}
                  </p>
                  <h2 className="text-[var(--fpl-purple)] text-2xl font-black leading-tight">
                    {activePlayer.last_name}
                  </h2>
                  {activePlayer.team && (
                    <p className="text-[var(--fpl-purple)]/85 text-sm font-semibold mt-0.5">
                      {activePlayer.team}
                    </p>
                  )}
                  <p className="text-[var(--fpl-purple)] text-sm font-bold mt-1">
                    Price: {formatPrice(activePlayer.price)}
                    {activePlayer.id === captainId ? ' · x2 pts' : ''}
                  </p>
                </div>
              </div>

              <SheetHeader className="sr-only">
                <SheetTitle>
                  {activePlayer.first_name} {activePlayer.last_name}
                </SheetTitle>
                <SheetDescription>Player actions</SheetDescription>
              </SheetHeader>

              {!data?.locked && (
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => makeCaptain(activePlayer.id)}
                    disabled={activePlayer.id === captainId}
                    className="col-span-2 rounded-full bg-[var(--fpl-green)] text-[var(--fpl-purple)] font-bold text-sm py-3 disabled:opacity-60"
                  >
                    {activePlayer.id === captainId
                      ? 'Already captain (x2 points)'
                      : 'Make captain (x2 points)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => removePlayer(activePlayer.id)}
                    className="rounded-full bg-white text-[var(--fpl-purple)] font-bold text-sm py-3"
                  >
                    Remove
                  </button>
                  <button
                    type="button"
                    onClick={openReplaceSheet}
                    className="rounded-full bg-white text-[var(--fpl-purple)] font-bold text-sm py-3"
                  >
                    Select Replacement
                  </button>
                </div>
              )}

              <Link
                href={`/players/${activePlayer.id}`}
                className="block w-full text-center rounded-full border border-white/20 text-white font-semibold text-sm py-3 hover:bg-white/5"
              >
                Full Profile
              </Link>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={passwordSheetOpen} onOpenChange={setPasswordSheetOpen}>
        <SheetContent
          side="bottom"
          className="!bg-[var(--fpl-p120)] border-t border-white/15 rounded-t-3xl p-0 gap-0 [&>button]:hidden"
        >
          <div className="px-4 pt-4 pb-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <SheetTitle className="text-white text-xl font-bold">
                  Change password
                </SheetTitle>
                <SheetDescription className="text-white/50 text-xs mt-1">
                  Enter your current password, then choose a new one.
                </SheetDescription>
              </div>
              <button
                type="button"
                onClick={() => setPasswordSheetOpen(false)}
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={changePassword} className="space-y-3">
              <div>
                <label className="block text-white/60 text-xs mb-1.5">Current password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl bg-[var(--fpl-purple)] border border-white/15 px-3 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                  autoComplete="current-password"
                  required
                />
              </div>
              <div>
                <label className="block text-white/60 text-xs mb-1.5">New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl bg-[var(--fpl-purple)] border border-white/15 px-3 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                  autoComplete="new-password"
                  minLength={4}
                  required
                />
              </div>
              <div>
                <label className="block text-white/60 text-xs mb-1.5">Confirm new password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl bg-[var(--fpl-purple)] border border-white/15 px-3 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                  autoComplete="new-password"
                  minLength={4}
                  required
                />
              </div>

              {passwordError && (
                <p className="text-red-300 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                  {passwordError}
                </p>
              )}
              {passwordMessage && (
                <p className="text-[var(--fpl-green)] text-sm bg-[var(--fpl-green)]/10 border border-[var(--fpl-green)]/20 rounded-xl px-3 py-2">
                  {passwordMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={passwordSaving}
                className="w-full rounded-xl bg-[var(--fpl-green)] text-[var(--fpl-purple)] font-bold py-3 hover:opacity-90 transition disabled:opacity-60"
              >
                {passwordSaving ? 'Saving...' : 'Update password'}
              </button>
            </form>
          </div>
        </SheetContent>
      </Sheet>

      {/* Player selection / replacement sheet */}
      <Sheet open={replaceSheetOpen} onOpenChange={setReplaceSheetOpen}>
        <SheetContent
          side="bottom"
          className="!bg-[var(--fpl-p120)] border-t border-white/15 rounded-t-3xl p-0 gap-0 [&>button]:hidden h-[88vh] max-h-[88vh]"
        >
          <div className="flex flex-col h-full">
            <div className="px-4 pt-4 pb-3 border-b border-white/10">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <SheetTitle className="text-white text-xl font-bold">
                    Player Selection
                  </SheetTitle>
                  <SheetDescription className="text-white/50 text-xs mt-1">
                    {replacingId != null
                      ? 'Choose a replacement for your squad'
                      : 'Add a player to an empty slot'}
                  </SheetDescription>
                </div>
                <button
                  type="button"
                  onClick={() => setReplaceSheetOpen(false)}
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name"
                className="w-full rounded-xl bg-[var(--fpl-purple)] border border-white/15 px-3 py-2.5 text-white placeholder:text-white/35 focus:outline-none focus:border-white/30"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="px-4 py-2 flex items-center justify-between text-[11px] text-white/45 font-semibold uppercase tracking-wide border-b border-white/10 sticky top-0 bg-[var(--fpl-p120)] z-10">
                <span>Players</span>
                <span>Price</span>
              </div>

              {selectablePlayers.length === 0 ? (
                <p className="text-white/50 text-sm text-center py-12">No players found</p>
              ) : (
                selectablePlayers.map((p) => {
                  const outgoing =
                    replacingId != null
                      ? Number(playersById.get(replacingId)?.price) || 0
                      : 0
                  const projected =
                    Math.round((budgetSpent - outgoing + (Number(p.price) || 0)) * 10) / 10
                  const overBudget = projected > maxBudget + 0.05
                  const previewIds =
                    replacingId != null
                      ? selected.map((id) => (id === replacingId ? p.id : id))
                      : [...selected, p.id]
                  const overTeam = !isTeamChangeAllowed(selected, previewIds)
                  const blocked = overBudget || overTeam
                  return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applySelection(p.id)}
                    disabled={blocked}
                    className="w-full flex items-center gap-3 px-4 py-2.5 border-b border-white/10 text-left hover:bg-white/5 transition disabled:opacity-40"
                  >
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-b from-[var(--fpl-cyan)] to-[var(--fpl-lilac)] shrink-0">
                      <Image
                        src={getPlayerImageUrl(p.image_url, true)}
                        alt={p.last_name}
                        fill
                        className="object-contain object-bottom"
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-semibold truncate">
                        {p.first_name} {p.last_name}
                      </p>
                      <p className="text-white/45 text-xs truncate">{p.team || 'Free agent'}</p>
                    </div>
                    <span className="text-white text-sm font-bold tabular-nums shrink-0 mr-2">
                      {formatPrice(p.price)}
                    </span>
                    <span className="w-8 h-8 rounded-full bg-[var(--fpl-purple)] border border-white/15 text-white flex items-center justify-center text-lg font-light shrink-0">
                      {blocked ? '!' : '+'}
                    </span>
                  </button>
                  )
                })
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </main>
  )
}
