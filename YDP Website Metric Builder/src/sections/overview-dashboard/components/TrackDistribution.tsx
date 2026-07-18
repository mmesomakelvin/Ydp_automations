import type { TrackStat } from '@/../product/sections/overview-dashboard/types'

interface TrackDistributionProps {
  tracks: TrackStat[]
  onSelect?: (track: string) => void
}

/** Horizontal bars showing match count per track, scaled to the busiest track. */
export function TrackDistribution({ tracks, onSelect }: TrackDistributionProps) {
  const max = Math.max(1, ...tracks.map((t) => t.matchCount))

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
          Matches by track
        </h2>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {tracks.length} tracks
        </span>
      </div>

      <ul className="mt-4 space-y-3">
        {tracks.map((track) => (
          <li key={track.name}>
            <button
              type="button"
              onClick={() => onSelect?.(track.name)}
              className="group block w-full text-left"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm font-medium text-slate-700 group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-white">
                  {track.name}
                </span>
                <span className="shrink-0 font-mono text-sm font-semibold text-slate-900 tabular-nums dark:text-white">
                  {track.matchCount}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all group-hover:bg-indigo-600 dark:bg-indigo-500 dark:group-hover:bg-indigo-400"
                    style={{ width: `${(track.matchCount / max) * 100}%` }}
                  />
                </div>
                <span className="w-28 shrink-0 text-right text-xs text-slate-400 dark:text-slate-500">
                  {track.menteeCount} mentees · {track.mentorCount} mentors
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
