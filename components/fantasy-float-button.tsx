'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function FantasyFloatButton() {
  const [href, setHref] = useState('/login')

  useEffect(() => {
    fetch('/api/player-auth/me')
      .then((r) => r.json())
      .then((data) => setHref(data.authenticated ? '/my-team' : '/login'))
      .catch(() => setHref('/login'))
  }, [])

  return (
    <Link
      href={href}
      aria-label="My Fantasy Team"
      className="fixed top-3 right-3 sm:top-4 sm:right-4 z-[120] w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-white/80 shadow-lg shadow-black/40 hover:scale-105 active:scale-95 transition-transform"
    >
      <Image
        src="/pl-lion-button.png"
        alt=""
        fill
        className="object-cover"
        sizes="48px"
        priority
        unoptimized
      />
    </Link>
  )
}
