'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
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
          <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-gradient-to-br from-blue-900 via-slate-800 to-purple-900 border-blue-400/20">
            <SheetHeader>
              <SheetTitle className="text-white text-left">Meni</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-4 mt-8">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="text-white/80 hover:text-white transition py-3 px-4 rounded-lg hover:bg-blue-500/10 border border-transparent hover:border-blue-400/20"
              >
                Početna
              </Link>
              <Link
                href="/matches"
                onClick={() => setOpen(false)}
                className="text-white/80 hover:text-white transition py-3 px-4 rounded-lg hover:bg-blue-500/10 border border-transparent hover:border-blue-400/20"
              >
                Utakmice
              </Link>
              <Link
                href="/players"
                onClick={() => setOpen(false)}
                className="text-white/80 hover:text-white transition py-3 px-4 rounded-lg hover:bg-blue-500/10 border border-transparent hover:border-blue-400/20"
              >
                Igrači
              </Link>
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="text-white/80 hover:text-white transition py-3 px-4 rounded-lg hover:bg-blue-500/10 border border-transparent hover:border-blue-400/20"
              >
                Admin
              </Link>
            </nav>
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
