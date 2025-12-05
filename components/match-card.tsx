export default function MatchCard() {
  return (
    <section className="relative px-8 py-12 max-w-7xl mx-auto">
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Saturday, Dec 25</h2>
          <p className="text-blue-300/60 text-sm">Premier League on STRP</p>
        </div>

        <div className="space-y-4">
          {/* Match Card */}
          <div className="bg-slate-800/50 border border-blue-400/30 rounded-2xl p-6 backdrop-blur-md hover:border-blue-400/60 transition">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">RM</span>
                </div>
                <span className="text-white font-semibold">Real Madrid</span>
              </div>
              <span className="text-2xl font-bold text-white">3</span>
              <span className="text-blue-300/60">vs</span>
              <span className="text-2xl font-bold text-white">2</span>
              <div className="flex items-center gap-3">
                <span className="text-white font-semibold">Manchester City</span>
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">MC</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-blue-200/60">
              <span>FOX TV+</span>
              <span>FULL TIME</span>
              <span>12:00AM</span>
              <span className="text-red-400 font-semibold">● Live</span>
            </div>
          </div>

          {/* More matches */}
          {[
            { home: "Ipswich Town", homeScore: 3, away: "Arsenal", awayScore: 2 },
            { home: "Liverpool", homeScore: 2, away: "Chelsea", awayScore: 1 },
          ].map((match, idx) => (
            <div key={idx} className="bg-slate-800/40 border border-blue-400/20 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-white/80 font-semibold">{match.home}</span>
                  <span className="text-white font-bold">{match.homeScore}</span>
                </div>
                <span className="text-blue-300/40 text-sm">vs</span>
                <div className="flex items-center gap-3">
                  <span className="text-white font-bold">{match.awayScore}</span>
                  <span className="text-white/80 font-semibold">{match.away}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
