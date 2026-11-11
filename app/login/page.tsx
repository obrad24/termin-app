'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/header'

export default function LoginPage() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/player-auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) router.replace('/my-team')
      })
      .catch(() => {})
  }, [router])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/player-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, password }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Login failed')
      router.push('/my-team')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--fpl-p120)] pb-20 md:pb-0">
      <Header />
      <section className="relative px-3 sm:px-6 py-8 max-w-md mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Player login</h1>
        <p className="text-white/45 text-sm mb-6">
          Nickname = first name (e.g. Filip). Password = first name + 123 (e.g. Filip123).
        </p>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl bg-[var(--fpl-purple)] border border-white/10 p-4 sm:p-5 space-y-4"
        >
          <div>
            <label className="block text-white/60 text-xs mb-1.5">Nickname</label>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Filip"
              className="w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="block text-white/60 text-xs mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ime123"
              className="w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="text-red-300 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[var(--fpl-green)] text-[var(--fpl-purple)] font-bold py-2.5 hover:opacity-90 transition disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-white/40 text-xs mt-4">
          <Link href="/fantasy" className="underline hover:text-white/70">
            Back to Fantasy
          </Link>
        </p>
      </section>
    </main>
  )
}
