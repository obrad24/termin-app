/** Compact fantasy points rules — keep in sync with lib/fantasy/scoring.ts */

const RULES: { label: string; points: string }[] = [
  { label: 'Appearance (played)', points: '+2' },
  { label: 'Win', points: '+2' },
  { label: 'Draw', points: '0' },
  { label: 'Loss', points: '−1' },
  { label: 'Goal scored', points: '+4 each' },
  { label: 'Team scored 8 / 12 / 17+', points: '+1 / +2 / +3' },
  { label: 'Team conceded 7 / 11 / 16+', points: '−1 / −2 / −3' },
  { label: 'Fan vote MVP / 2nd / 3rd', points: '+3 / +2 / +1' },
  { label: 'Did not play', points: '0' },
]

export default function FantasyScoringRules({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-[var(--fpl-purple)]/60 px-3.5 py-3 ${className}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40 mb-2">
        Fantasy scoring rules
      </p>
      <ul className="space-y-1">
        {RULES.map((rule) => (
          <li
            key={rule.label}
            className="flex items-baseline justify-between gap-3 text-[10px] leading-snug text-white/45"
          >
            <span>{rule.label}</span>
            <span className="shrink-0 tabular-nums text-white/55 font-medium">{rule.points}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[9px] leading-snug text-white/30">
        Squad: 5 players, £40m budget, max 3 from the same team, max 2 transfers per GW. Captain
        scores double (change free until deadline). Points apply only if the player appeared in the
        match. Fan-vote points come from post-match ratings (top 3).
      </p>
    </div>
  )
}
