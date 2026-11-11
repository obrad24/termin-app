'use client'

import { useState } from 'react'
import { Menu, X, Users, Coins, Newspaper } from 'lucide-react'
import Link from 'next/link'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSeason } from '@/components/season-provider'

export default function Header() {
  const [open, setOpen] = useState(false)
  const { seasons, currentSeason, setCurrentSeasonId } = useSeason()

  return (
    <header className="relative z-50 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-5">
      <div className="mx-auto max-w-7xl flex items-center justify-between gap-3">
        <div className="flex items-center min-w-0 flex-1">
          {seasons.length > 0 ? (
            <Select
              value={currentSeason ? String(currentSeason.id) : undefined}
              onValueChange={(value) => setCurrentSeasonId(parseInt(value, 10))}
            >
              <SelectTrigger className="h-auto w-auto max-w-[70vw] border-0 bg-transparent p-0 shadow-none focus:ring-0 focus:ring-offset-0 text-left [&>svg]:text-[var(--gold-300)]">
                <SelectValue placeholder="Sezona">
                  <span className="font-display text-xl sm:text-2xl lg:text-3xl font-bold gold-text tracking-tight truncate">
                    {currentSeason ? currentSeason.name : 'Sezona'}
                  </span>
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
            <span className="font-display text-xl sm:text-2xl font-bold gold-text tracking-tight">
              TERMIN
            </span>
          )}
        </div>

        <nav className="hidden md:flex items-center gap-5 lg:gap-7 justify-end">
          <Link href="/" className="text-[var(--champagne)]/70 hover:text-[var(--gold-200)] transition text-sm lg:text-base">
            Početna
          </Link>
          <Link href="/matches" className="text-[var(--champagne)]/70 hover:text-[var(--gold-200)] transition text-sm lg:text-base">
            Utakmice
          </Link>
          <Link href="/players" className="flex items-center gap-2 text-[var(--champagne)]/70 hover:text-[var(--gold-200)] transition text-sm lg:text-base">
            <Users className="w-4 h-4 lg:w-5 lg:h-5" />
            <span>Igrači</span>
          </Link>
          <Link href="/statistics" className="text-[var(--champagne)]/70 hover:text-[var(--gold-200)] transition text-sm lg:text-base">
            Statistika
          </Link>
          <Link href="/terminbet" className="flex items-center gap-2 text-[var(--champagne)]/70 hover:text-[var(--gold-200)] transition text-sm lg:text-base">
            <Coins className="w-4 h-4 lg:w-5 lg:h-5" />
            <span>TerminBet</span>
          </Link>
          <Link href="/terminnews" className="flex items-center gap-2 text-[var(--champagne)]/70 hover:text-[var(--gold-200)] transition text-sm lg:text-base">
            <Newspaper className="w-4 h-4 lg:w-5 lg:h-5" />
            <span>TerminNews</span>
          </Link>
          <Link href="/admin" className="text-[var(--champagne)]/70 hover:text-[var(--gold-200)] transition text-sm lg:text-base">
            Admin
          </Link>
        </nav>

        <div className="md:hidden shrink-0">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="w-10 h-10 flex items-center justify-center text-[var(--gold-200)] hover:text-white transition">
                <Menu className="w-6 h-6" />
                <span className="sr-only">Open menu</span>
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="!w-full sm:!w-[380px] !bg-[#121212] border-l border-[var(--glass-border)] p-0 [&>button]:hidden"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation Menu</SheetTitle>
              </SheetHeader>
              <div className="relative z-10 flex flex-col h-full bg-[#121212]">
                <div className="flex items-center justify-between p-4 pb-2">
                  <span className="font-display text-xl gold-text tracking-[0.08em]">TERMIN</span>
                  <button
                    onClick={() => setOpen(false)}
                    className="w-10 h-10 rounded-xl liquid-glass flex items-center justify-center text-[var(--gold-200)] hover:text-white transition"
                  >
                    <X className="w-5 h-5" />
                    <span className="sr-only">Close menu</span>
                  </button>
                </div>

                <nav className="flex flex-col gap-2 px-4 pb-4 flex-1">
                  {seasons.length > 0 && (
                    <div className="mb-4 liquid-glass rounded-xl p-3">
                      <p className="text-xs text-[var(--champagne)]/60 mb-1">Sezona</p>
                      <Select
                        value={currentSeason ? String(currentSeason.id) : undefined}
                        onValueChange={(value) => setCurrentSeasonId(parseInt(value, 10))}
                      >
                        <SelectTrigger className="h-10 w-full bg-transparent border-[var(--glass-border)] text-[var(--champagne)] text-sm">
                          <SelectValue placeholder="Sezona">
                            {currentSeason ? currentSeason.name : 'Sezona'}
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
                    { href: '/', label: 'Početna' },
                    { href: '/matches', label: 'Utakmice' },
                    { href: '/players', label: 'Igrači' },
                    { href: '/statistics', label: 'Statistika' },
                    { href: '/terminbet', label: 'TerminBet' },
                    { href: '/terminnews', label: 'TerminNews' },
                    { href: '/admin', label: 'Admin' },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="group flex items-center gap-4 px-4 py-4 rounded-xl text-[var(--champagne)]/90 hover:text-white transition-all duration-200 liquid-glass border border-transparent hover:border-[var(--gold-400)]/40"
                    >
                      <span className="flex-1 font-medium">{item.label}</span>
                    </Link>
                  ))}
                </nav>

                <div className="px-6 py-4 border-t border-[var(--glass-border)]">
                  <p className="text-[var(--champagne)]/40 text-xs text-center">
                    © OBRAD DESIGN
                  </p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-[100] px-2 pb-2 transition-opacity ${open ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
        <div className="liquid-glass-strong rounded-2xl">
          <div className="flex items-center justify-around px-2 py-2">
            <Link href="/" className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-[var(--champagne)]/80 hover:text-[var(--gold-200)] hover:bg-white/5 transition-all active:scale-95 flex-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </Link>
            <Link href="/matches" className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-[var(--champagne)]/80 hover:text-[var(--gold-200)] hover:bg-white/5 transition-all active:scale-95 flex-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </Link>
            <Link href="/players" className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-[var(--champagne)]/80 hover:text-[var(--gold-200)] hover:bg-white/5 transition-all active:scale-95 flex-1">
              <Users className="w-6 h-6" />
            </Link>
            <Link href="/statistics" className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-[var(--champagne)]/80 hover:text-[var(--gold-200)] hover:bg-white/5 transition-all active:scale-95 flex-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </Link>
            <Link href="/terminbet" className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-[var(--champagne)]/80 hover:text-[var(--gold-200)] hover:bg-white/5 transition-all active:scale-95 flex-1">
              <Coins className="w-6 h-6" />
            </Link>
            <Link href="/admin" className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-[var(--champagne)]/80 hover:text-[var(--gold-200)] hover:bg-white/5 transition-all active:scale-95 flex-1">
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
