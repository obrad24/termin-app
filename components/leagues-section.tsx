export default function LeaguesSection() {
  return (
    <section className="relative px-8 py-12 max-w-7xl mx-auto pb-20">
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left - League Navigation */}
        <div className="space-y-4">
          <h3 className="text-white font-semibold text-lg">Football Leagues</h3>
          <div className="space-y-2">
            {[
              { name: "Premier League", badge: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
              { name: "La Liga", badge: "🇪🇸" },
              { name: "Serie A", badge: "🇮🇹" },
              { name: "Bundesliga", badge: "🇩🇪" },
            ].map((league) => (
              <button
                key={league.name}
                className="w-full text-left px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-400/20 text-white/80 hover:bg-blue-500/20 hover:border-blue-400/40 transition text-sm"
              >
                {league.badge} {league.name}
              </button>
            ))}
          </div>
        </div>

        {/* Center - Live Matches */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-white font-semibold text-lg">Live Matches</h3>
          <div className="space-y-3">
            {[
              { team1: "Sheffield United", team2: "Manchester City", time: "1:20 AM", status: "Live" },
              { team1: "Manchester City", team2: "Liverpool", score: "4 - 2", time: "2h 00" },
              { team1: "Arsenal", team2: "Chelsea", status: "Upcoming" },
            ].map((match, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-r from-slate-800/50 to-blue-500/10 border border-blue-400/20 rounded-lg p-4 backdrop-blur-sm hover:border-blue-400/40 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-white/90 font-semibold text-sm">{match.team1}</p>
                    {match.score && <p className="text-blue-300 font-bold text-lg">{match.score}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-blue-300/60 text-xs">
                      {match.status === "Live" && <span className="text-red-400 font-semibold">● LIVE</span>}
                      {match.status === "Upcoming" && <span className="text-blue-300/60">Upcoming</span>}
                    </p>
                    {match.time && <p className="text-white/60 text-sm">{match.time}</p>}
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-white/90 font-semibold text-sm">{match.team2}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
