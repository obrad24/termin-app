'use client'

import { useState } from 'react'
import { Menu, Home, Calendar, Users, Settings, ChevronRight } from 'lucide-react'
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
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-2 sm:py-6 bg-gradient-to-br from-blue-900/80 via-slate-800/80 to-purple-900/80 backdrop-blur-md border-b border-blue-400/20">
      <div className="flex items-center gap-2 justify-center">
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
        <Link href="/players" className="text-white/60 hover:text-white transition text-sm lg:text-base">
          Igrači
        </Link>
        <Link href="/admin" className="text-white/60 hover:text-white transition text-sm lg:text-base">
          Admin
        </Link>
      </nav>

      {/* Mobile Menu */}
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="w-10 h-10 rounded-lg bg-transparent border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition backdrop-blur-sm">
              <Menu className="w-5 h-5" />
              <span className="sr-only">Open menu</span>
            </button>
          </SheetTrigger>
          <SheetContent 
            side="right" 
            className="w-[320px] sm:w-[380px] bg-gradient-to-br from-blue-950 via-slate-900 to-purple-950 backdrop-blur-xl border-l border-blue-500/20 p-0"
          >
            <div className="flex flex-col h-full">
              {/* Header Section */}
              <SheetHeader className="px-6 pt-8 pb-6 border-b border-white/10">
                <SheetTitle className="text-white text-2xl font-bold tracking-tight">
                  TERMIN
                </SheetTitle>
                <p className="text-white/60 text-sm mt-1">Navigacija</p>
              </SheetHeader>

              {/* Navigation Menu */}
              <nav className="flex flex-col gap-2 p-4 flex-1">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-4 px-4 py-4 rounded-xl text-white/90 hover:text-white transition-all duration-200 hover:bg-blue-500/20 border border-transparent hover:border-blue-400/30"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                    <Home className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="flex-1 font-medium">Početna</span>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
                </Link>

                <Link
                  href="/matches"
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-4 px-4 py-4 rounded-xl text-white/90 hover:text-white transition-all duration-200 hover:bg-purple-500/20 border border-transparent hover:border-purple-400/30"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
                    <Calendar className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="flex-1 font-medium">Utakmice</span>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
                </Link>

                <Link
                  href="/players"
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-4 px-4 py-4 rounded-xl text-white/90 hover:text-white transition-all duration-200 hover:bg-cyan-500/20 border border-transparent hover:border-cyan-400/30"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-500/20 group-hover:bg-cyan-500/30 transition-colors">
                    <Users className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="flex-1 font-medium">Igrači</span>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
                </Link>

                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-4 px-4 py-4 rounded-xl text-white/90 hover:text-white transition-all duration-200 hover:bg-amber-500/20 border border-transparent hover:border-amber-400/30"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/20 group-hover:bg-amber-500/30 transition-colors">
                    <Settings className="w-5 h-5 text-amber-400" />
                  </div>
                  <span className="flex-1 font-medium">Admin</span>
                  <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
                </Link>
              </nav>

              {/* Footer Section */}
              <div className="px-6 py-4 border-t border-white/10">
                <p className="text-white/40 text-xs text-center">
                  © 2024 TERMIN
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
    </header>
  )
}
