'use client'

import { useState } from 'react'
import { Menu, X, Users, Coins } from 'lucide-react'
import Link from 'next/link'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

export default function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center border-none justify-end sm:justify-between px-4 sm:px-6 lg:px-8 py-2 sm:py-6  border-b sm:border-blue-400/20">
      <div className="hidden md:flex items-center gap-2 justify-center">
        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
          TERMIN
        </p>
      </div>
      
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-6 lg:gap-8">
        <Link href="/" className="text-white/60 hover:text-white transition text-sm lg:text-base">
          Početna
        </Link>
        <Link href="/matches" className="text-white/60 hover:text-white transition text-sm lg:text-base">
          Utakmice
        </Link>
        <Link href="/players" className="flex items-center gap-2 text-white/60 hover:text-white transition text-sm lg:text-base">
          <Users className="w-4 h-4 lg:w-5 lg:h-5" />
          <span>Igrači</span>
        </Link>
        <Link href="/statistics" className="text-white/60 hover:text-white transition text-sm lg:text-base">
          Statistika
        </Link>
        <Link href="/terminbet" className="flex items-center gap-2 text-white/60 hover:text-white transition text-sm lg:text-base">
          <Coins className="w-4 h-4 lg:w-5 lg:h-5" />
          <span>TerminBet</span>
        </Link>
        <Link href="/admin" className="text-white/60 hover:text-white transition text-sm lg:text-base">
          Admin
        </Link>
      </nav>

      {/* Mobile Menu */}
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="w-10 h-10 rounded-lg bg-transparent border-none border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition backdrop-blur-sm">
              <Menu className="w-5 h-5" />
              <span className="sr-only">Open menu</span>
            </button>
          </SheetTrigger>
          <SheetContent 
            side="right" 
            className="!w-full sm:!w-[380px] hero-bg backdrop-blur-xl border-l border-blue-500/20 p-0 [&>button]:hidden"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col h-full">
              {/* Close Button */}
              <div className="flex justify-end p-4 pb-2">
                <button
                  onClick={() => setOpen(false)}
                  className="w-10 h-10 rounded-lg bg-transparent flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition backdrop-blur-sm"
                >
                  <X className="w-5 h-5" />
                  <span className="sr-only">Close menu</span>
                </button>
              </div>

              {/* Navigation Menu */}
              <nav className="flex flex-col gap-2 px-4 pb-4 flex-1">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-4 px-4 py-4 rounded-xl text-white/90 hover:text-white transition-all duration-200 hover:bg-blue-500/20 border border-transparent hover:border-blue-400/30"
                >
                  <span className="flex-1 font-medium">Početna</span>
                </Link>

                <Link
                  href="/matches"
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-4 px-4 py-4 rounded-xl text-white/90 hover:text-white transition-all duration-200 hover:bg-purple-500/20 border border-transparent hover:border-purple-400/30"
                >
                  <span className="flex-1 font-medium">Utakmice</span>
                </Link>

                <Link
                  href="/players"
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-4 px-4 py-4 rounded-xl text-white/90 hover:text-white transition-all duration-200 hover:bg-cyan-500/20 border border-transparent hover:border-cyan-400/30"
                >
                  <span className="flex-1 font-medium">Igrači</span>
                </Link>

                <Link
                  href="/statistics"
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-4 px-4 py-4 rounded-xl text-white/90 hover:text-white transition-all duration-200 hover:bg-green-500/20 border border-transparent hover:border-green-400/30"
                >
                  <span className="flex-1 font-medium">Statistika</span>
                </Link>

                <Link
                  href="/terminbet"
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-4 px-4 py-4 rounded-xl text-white/90 hover:text-white transition-all duration-200 hover:bg-yellow-500/20 border border-transparent hover:border-yellow-400/30"
                >
                  <span className="flex-1 font-medium">TerminBet</span>
                </Link>

                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-4 px-4 py-4 rounded-xl text-white/90 hover:text-white transition-all duration-200 hover:bg-amber-500/20 border border-transparent hover:border-amber-400/30"
                >
                  <span className="flex-1 font-medium">Admin</span>
                </Link>
              </nav>

              {/* Footer Section */}
              <div className="px-6 py-4 border-t border-white/10">
                <p className="text-white/40 text-xs text-center">
                  © OBRAD DESIGN
                </p>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Search Button */}
      <button className="hidden md:flex w-10 h-10 rounded-full bg-transparent border border-white/20 items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition backdrop-blur-sm">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </button>

      {/* Mobile Bottom Navigation - Fixed navigation buttons */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] hero-bg/50 backdrop-blur-xl border-t border-white/20 rounded-t-3xl">
        <div className="flex items-center justify-around px-2 py-2">
          <Link
            href="/"
            className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all active:scale-95 flex-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
          
          <Link
            href="/matches"
            className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all active:scale-95 flex-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </Link>
          
          <Link
            href="/players"
            className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all active:scale-95 flex-1"
          >
            <Users className="w-6 h-6" />
          </Link>
          
          <Link
            href="/statistics"
            className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all active:scale-95 flex-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </Link>

          <Link
            href="/terminbet"
            className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all active:scale-95 flex-1"
          >
            <Coins className="w-6 h-6" />
          </Link>

          <Link
            href="/admin"
            className="flex flex-col items-center gap-1 px-2 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all active:scale-95 flex-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  )
}
