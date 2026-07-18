import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import type { Match } from '@/../product/sections/overview-dashboard/types'
import { MatchRow } from './MatchRow'
import { badgeTone, type Badge, type Tone } from './status'

interface AttentionCardProps {
  title: string
  count: number
  icon: LucideIcon
  tone: Tone
  matches: Match[]
  /** Maps a match to the badge shown on its row. */
  badgeFor?: (match: Match) => Badge
  /** Shown when there are no matches in this category. */
  emptyText: string
  onDrill?: () => void
  onOpenMatch?: (matchId: string) => void
}

const iconTone: Record<Tone, string> = {
  indigo:
    'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
  emerald:
    'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
  amber:
    'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
  red: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300',
  slate: 'bg-slate-100 text-slate-500 dark:bg-slate-700/60 dark:text-slate-300',
}

/**
 * One triage card in the health panel. Shows a count, up to three preview
 * rows, and a link to drill into the full filtered list.
 */
export function AttentionCard({
  title,
  count,
  icon: Icon,
  tone,
  matches,
  badgeFor,
  emptyText,
  onDrill,
  onOpenMatch,
}: AttentionCardProps) {
  const preview = matches.slice(0, 3)
  const remaining = count - preview.length

  return (
    <section className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <header className="flex items-center gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconTone[tone]}`}
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            {title}
          </h3>
        </div>
        <span
          className={`shrink-0 rounded-md px-2 py-0.5 font-mono text-sm font-bold tabular-nums ${badgeTone[tone]}`}
        >
          {count}
        </span>
      </header>

      <div className="mt-3 flex-1">
        {preview.length === 0 ? (
          <p className="px-2.5 py-4 text-sm text-slate-400 dark:text-slate-500">
            {emptyText}
          </p>
        ) : (
          <ul className="-mx-1 space-y-0.5">
            {preview.map((match) => (
              <li key={match.matchId}>
                <MatchRow
                  match={match}
                  badge={badgeFor?.(match)}
                  onOpen={() => onOpenMatch?.(match.matchId)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {count > 0 && (
        <button
          type="button"
          onClick={onDrill}
          className="mt-2 flex items-center justify-center gap-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          {remaining > 0 ? `View all ${count}` : 'View list'}
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </section>
  )
}
