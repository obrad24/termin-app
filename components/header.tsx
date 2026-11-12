'use client'

import { useEffect, useState } from 'react'
import { Menu, X, Users, Coins, Newspaper } from 'lucide-react'
import { SHOW_TERMINBET } from '@/lib/features'
import Link from 'next/link'
import Image from 'next/image'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSeason } from '@/components/season-provider'

function SeasonWordmark({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    const mid = Math.ceil(parts.length / 2)
    return (
      <span className="flex flex-col leading-none">
        <span className="text-[13px] sm:text-sm font-bold tracking-wide">{parts.slice(0, mid).join(' ')}</span>
        <span className="text-[13px] sm:text-sm font-bold tracking-wide">{parts.slice(mid).join(' ')}</span>
      </span>
    )
  }

  return (
    <span className="text-base sm:text-lg font-bold tracking-wide leading-none">
      {name}
    </span>
  )
}

export default function Header() {
  const [open, setOpen] = useState(false)
  const [playerLoggedIn, setPlayerLoggedIn] = useState(false)
  const [playerNickname, setPlayerNickname] = useState<string | null>(null)
  const [fantasyPinned, setFantasyPinned] = useState(false)
  const { seasons, currentSeason, setCurrentSeasonId } = useSeason()
  const seasonLabel = currentSeason?.name || 'TERMIN'

  useEffect(() => {
    fetch('/api/player-auth/me')
      .then((r) => r.json())
      .then((data) => {
        const loggedIn = !!data.authenticated
        setPlayerLoggedIn(loggedIn)
        setPlayerNickname(loggedIn ? data.account?.nickname || null : null)
      })
      .catch(() => {
        setPlayerLoggedIn(false)
        setPlayerNickname(null)
      })
  }, [])

  useEffect(() => {
    const onScroll = () => setFantasyPinned(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const fantasyNav = playerLoggedIn
    ? [
        { href: '/fantasy', label: 'Fantasy' },
        { href: '/my-team', label: 'My Fantasy Team' },
      ]
    : [
        { href: '/fantasy', label: 'Fantasy' },
        { href: '/login', label: 'Login' },
      ]

  const fantasyHref = playerLoggedIn ? '/my-team' : '/login'

  return (
    <header className="relative z-50 bg-[var(--fpl-p120)] border-b border-white/10">
      <div className="mx-auto max-w-7xl h-14 sm:h-16 px-3 sm:px-6 flex items-center gap-3">
        {/* PL-style: menu left + season name */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition shrink-0"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" strokeWidth={2} />
              </button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="!w-full sm:!w-[360px] !bg-[var(--fpl-p120)] border-r border-white/15 p-0 [&>button]:hidden"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation Menu</SheetTitle>
              </SheetHeader>
              <div className="relative z-10 flex flex-col h-full bg-[var(--fpl-p120)]">
                <div className="flex items-center justify-between p-4 pb-2">
                  <span className="font-display text-xl text-white tracking-[0.08em]">TERMIN</span>
                  <button
                    onClick={() => setOpen(false)}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/15 transition"
                  >
                    <X className="w-5 h-5" />
                    <span className="sr-only">Close menu</span>
                  </button>
                </div>

                <nav className="flex flex-col gap-2 px-4 pb-4 flex-1">
                  {seasons.length > 0 && (
                    <div className="mb-4 rounded-xl p-3 bg-white/10 border border-white/15">
                      <p className="text-xs text-white/60 mb-1">Season</p>
                      <Select
                        value={currentSeason ? String(currentSeason.id) : undefined}
                        onValueChange={(value) => setCurrentSeasonId(parseInt(value, 10))}
                      >
                        <SelectTrigger className="h-10 w-full bg-transparent border-white/20 text-white text-sm">
                          <SelectValue placeholder="Season">
                            {currentSeason ? currentSeason.name : 'Season'}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {seasons.map((season) => (
                            <SelectItem key={season.id} value={String(season.id)}>
                              {season.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {[
                    { href: '/', label: 'Home' },
                    { href: '/matches', label: 'Fixtures & Results' },
                    { href: '/players', label: 'Players' },
                    { href: '/statistics', label: 'Statistics' },
                    ...fantasyNav,
                    ...(SHOW_TERMINBET ? [{ href: '/terminbet', label: 'TerminBet' }] : []),
                    { href: '/terminnews', label: 'TerminNews' },
                    { href: '/admin', label: 'Admin' },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="group flex items-center gap-4 px-4 py-4 rounded-xl text-white/90 hover:text-white transition-all duration-200 bg-white/5 border border-transparent hover:border-[var(--fpl-cyan)]/40 hover:bg-white/10"
                    >
                      <span className="flex-1 font-medium">{item.label}</span>
                    </Link>
                  ))}
                </nav>

                <div className="px-6 py-4 border-t border-white/15">
                  <p className="text-white/40 text-xs text-center">© OBRAD DESIGN</p>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {seasons.length > 0 ? (
            <Select
              value={currentSeason ? String(currentSeason.id) : undefined}
              onValueChange={(value) => setCurrentSeasonId(parseInt(value, 10))}
            >
              <SelectTrigger className="h-auto w-auto max-w-[55vw] border-0 bg-transparent p-0 shadow-none focus:ring-0 focus:ring-offset-0 text-left text-white [&>svg]:hidden">
                <SelectValue placeholder="Season">
                  <SeasonWordmark name={seasonLabel} />
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {seasons.map((season) => (
                  <SelectItem key={season.id} value={String(season.id)}>
                    {season.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-white">
              <SeasonWordmark name="TERMIN" />
            </span>
          )}
        </div>

        {/* Desktop links on the right */}
        <nav className="hidden md:flex items-center gap-5 lg:gap-6 ml-auto">
          <Link href="/" className="text-white/75 hover:text-white transition text-sm font-medium">
            Home
          </Link>
          <Link href="/matches" className="text-white/75 hover:text-white transition text-sm font-medium">
            Fixtures & Results
          </Link>
          <Link href="/players" className="flex items-center gap-1.5 text-white/75 hover:text-white transition text-sm font-medium">
            <Users className="w-4 h-4" />
            <span>Players</span>
          </Link>
          <Link href="/statistics" className="text-white/75 hover:text-white transition text-sm font-medium">
            Statistics
          </Link>
          <Link href="/fantasy" className="text-white/75 hover:text-white transition text-sm font-medium">
            Fantasy
          </Link>
          {playerLoggedIn ? (
            <Link href="/my-team" className="text-white/75 hover:text-white transition text-sm font-medium">
              My Fantasy Team
            </Link>
          ) : (
            <Link href="/login" className="text-white/75 hover:text-white transition text-sm font-medium">
              Login
            </Link>
          )}
          {SHOW_TERMINBET && (
            <Link href="/terminbet" className="flex items-center gap-1.5 text-white/75 hover:text-white transition text-sm font-medium">
              <Coins className="w-4 h-4" />
              <span>TerminBet</span>
            </Link>
          )}
          <Link href="/terminnews" className="flex items-center gap-1.5 text-white/75 hover:text-white transition text-sm font-medium">
            <Newspaper className="w-4 h-4" />
            <span>TerminNews</span>
          </Link>
          <Link href="/admin" className="text-white/75 hover:text-white transition text-sm font-medium">
            Admin
          </Link>
        </nav>

        <div className="ml-auto md:ml-3 flex items-center gap-2 shrink-0">
          {playerNickname && (
            <Link
              href="/my-team"
              className="max-w-[7.5rem] sm:max-w-[10rem] truncate text-white text-sm font-semibold hover:text-[var(--fpl-cyan)] transition"
              title={playerNickname}
            >
              {playerNickname}
            </Link>
          )}

          {/* Spacer keeps nav layout; button pins on scroll */}
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 shrink-0">
            <Link
              href={fantasyHref}
              aria-label="My Fantasy Team"
              className={`rounded-full overflow-hidden border-2 border-white/80 shadow-md shadow-black/30 hover:scale-105 active:scale-95 transition-transform ${
                fantasyPinned
                  ? 'fixed top-2 right-3 sm:top-2.5 sm:right-4 z-[120] w-10 h-10 sm:w-11 sm:h-11'
                  : 'absolute inset-0'
              }`}
            >
              <Image
                src="/pl-lion-button.png"
                alt=""
                fill
                className="object-cover"
                sizes="44px"
                priority
                unoptimized
              />
            </Link>
          </div>
        </div>
      </div>

      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-[100] px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-opacity ${open ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
        <div className="liquid-glass-strong rounded-[1.35rem] overflow-hidden">
          <div className="flex items-center justify-around px-1.5 py-1.5">
            <Link href="/" className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-white/80 hover:text-[var(--fpl-cyan)] hover:bg-white/5 transition-all active:scale-95 flex-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </Link>
            <Link href="/matches" className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-white/80 hover:text-[var(--fpl-cyan)] hover:bg-white/5 transition-all active:scale-95 flex-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </Link>
            <Link href="/players" className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-white/80 hover:text-[var(--fpl-cyan)] hover:bg-white/5 transition-all active:scale-95 flex-1">
              <Users className="w-6 h-6" />
            </Link>
            <Link href="/statistics" className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-white/80 hover:text-[var(--fpl-cyan)] hover:bg-white/5 transition-all active:scale-95 flex-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </Link>
            <Link href="/fantasy" className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-white/80 hover:text-[var(--fpl-cyan)] hover:bg-white/5 transition-all active:scale-95 flex-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </Link>
            {SHOW_TERMINBET && (
              <Link href="/terminbet" className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-white/80 hover:text-[var(--fpl-cyan)] hover:bg-white/5 transition-all active:scale-95 flex-1">
                <Coins className="w-6 h-6" />
              </Link>
            )}
            <Link href="/admin" className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-white/80 hover:text-[var(--fpl-cyan)] hover:bg-white/5 transition-all active:scale-95 flex-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
