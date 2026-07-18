import { ArrowRight } from 'lucide-react'
import type { Match } from '@/../product/sections/overview-dashboard/types'
import { badgeTone, type Badge } from './status'

interface MatchRowProps {
  match: Match
  badge?: Badge
  onOpen?: () => void
}

/** Compact mentee → mentor row used inside the attention cards. */
export function MatchRow({ match, badge, onOpen }: MatchRowProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900 dark:text-white">
          <span className="truncate">{match.menteeName}</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="truncate">{match.mentorName}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 truncate font-mono text-[11px] text-slate-400 dark:text-slate-500">
          <span className="truncate">{match.menteeId}</span>
          <span aria-hidden>·</span>
          <span className="truncate text-slate-500 dark:text-slate-400">
            {match.track}
          </span>
        </div>
      </div>
      {badge && (
        <span
          className={`shrink-0 rounded-md px-2 py-0.5 font-mono text-xs font-semibold ${badgeTone[badge.tone]}`}
        >
          {badge.label}
        </span>
      )}
    </button>
  )
}
