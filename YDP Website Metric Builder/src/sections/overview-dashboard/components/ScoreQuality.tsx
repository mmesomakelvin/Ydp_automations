import type { ScoreBand } from '@/../product/sections/overview-dashboard/types'

interface ScoreQualityProps {
  averagePairScore: number
  scoreBands: ScoreBand[]
  onClick?: () => void
}

// Ordered tones for the bands, best → worst.
const bandTones = ['bg-emerald-500', 'bg-indigo-500', 'bg-amber-500']
const bandDots = ['bg-emerald-500', 'bg-indigo-500', 'bg-amber-500']

/**
 * Signature panel: a match-quality ring showing the average pair score,
 * with a segmented breakdown of matches by score band.
 */
export function ScoreQuality({
  averagePairScore,
  scoreBands,
  onClick,
}: ScoreQualityProps) {
  const total = Math.max(
    1,
    scoreBands.reduce((sum, b) => sum + b.count, 0),
  )

  // Ring geometry
  const radius = 52
  const stroke = 12
  const circumference = 2 * Math.PI * radius
  const dash = (averagePairScore / 100) * circumference

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col rounded-xl border border-slate-200 bg-white p-5 text-left transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
    >
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
          Match quality
        </h2>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          avg pair score
        </span>
      </div>

      <div className="mt-4 flex items-center gap-5">
        <div className="relative shrink-0">
          <svg width="132" height="132" viewBox="0 0 132 132" className="-rotate-90">
            <circle
              cx="66"
              cy="66"
              r={radius}
              fill="none"
              strokeWidth={stroke}
              className="stroke-slate-100 dark:stroke-slate-800"
            />
            <circle
              cx="66"
              cy="66"
              r={radius}
              fill="none"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
              className="stroke-emerald-500 transition-all"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-3xl font-bold tracking-tight text-slate-900 tabular-nums dark:text-white">
              {averagePairScore}
            </span>
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
              of 100
            </span>
          </div>
        </div>

        <ul className="min-w-0 flex-1 space-y-2.5">
          {scoreBands.map((band, i) => {
            const pct = Math.round((band.count / total) * 100)
            return (
              <li key={band.band}>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                    <span
                      className={`h-2 w-2 rounded-full ${bandDots[i] ?? 'bg-slate-400'}`}
                    />
                    {band.band}
                  </span>
                  <span className="font-mono text-slate-400 tabular-nums dark:text-slate-500">
                    {band.count}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full ${bandTones[i] ?? 'bg-slate-400'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </button>
  )
}
