export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-8">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-slate-800 to-purple-900" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      
      {/* Main match display */}
      <div className="relative z-10 w-full max-w-6xl mx-auto">
        {/* Match result */}
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-400/30 rounded-3xl p-12 backdrop-blur-md shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Home team */}
            <div className="text-center md:text-right space-y-4">
              <div className="flex flex-col md:flex-row items-center md:justify-end gap-4">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl md:text-3xl">RM</span>
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                  Real Madrid
                </h2>
              </div>
            </div>

            {/* Score */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-6">
                <span className="text-6xl md:text-7xl lg:text-8xl font-bold text-white">
                  3
                </span>
                <span className="text-3xl md:text-4xl text-blue-300/60 font-light">-</span>
                <span className="text-6xl md:text-7xl lg:text-8xl font-bold text-white">
                  2
                </span>
              </div>
              <div className="flex items-center justify-center gap-4 text-sm text-blue-200/60">
                <span>FOX TV+</span>
                <span>•</span>
                <span>FULL TIME</span>
                <span>•</span>
                <span>12:00AM</span>
              </div>
            </div>

            {/* Away team */}
            <div className="text-center md:text-left space-y-4">
              <div className="flex flex-col md:flex-row items-center md:justify-start gap-4">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                  Manchester City
                </h2>
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-2xl md:text-3xl">MC</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
