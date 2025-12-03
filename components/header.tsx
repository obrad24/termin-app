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
    <header className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-6 rajko">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-blue-400/20 border border-blue-400/50 flex items-center justify-center">
            <span className="text-blue-300 font-bold text-sm">ST</span>
          </div>
          <span className="text-white font-bold hidden sm:inline">STRP</span>
        </Link>
      </div>
      
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-8">
        <Link href="/" className="text-white/60 hover:text-white transition">
          Home
        </Link>
        <Link href="/admin" className="text-white/60 hover:text-white transition">
          Admin
        </Link>
      </nav>

      {/* Mobile Menu */}
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-400/50 flex items-center justify-center text-white/60 hover:text-white transition">
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
      <button className="hidden md:flex w-10 h-10 rounded-full bg-blue-500/20 border border-blue-400/50 items-center justify-center text-white/60 hover:text-white transition">
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
