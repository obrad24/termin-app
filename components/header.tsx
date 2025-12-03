export default function Header() {
  return (
    <header className="relative z-10 flex items-center justify-between px-8 py-6">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-lg bg-blue-400/20 border border-blue-400/50 flex items-center justify-center">
          <span className="text-blue-300 font-bold text-sm">ST</span>
        </div>
        <span className="text-white font-bold hidden sm:inline">STRP</span>
      </div>
      <nav className="hidden md:flex items-center gap-8">
        <a href="/" className="text-white/60 hover:text-white transition">
          Home
        </a>
        <a href="/admin" className="text-white/60 hover:text-white transition">
          Admin
        </a>
      </nav>
      <button className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-400/50 flex items-center justify-center text-white/60 hover:text-white transition">
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
