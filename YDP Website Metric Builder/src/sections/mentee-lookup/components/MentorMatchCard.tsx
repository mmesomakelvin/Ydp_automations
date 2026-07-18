import { Mail, Crown } from 'lucide-react'
import type { MentorMatch } from '@/../product/sections/mentee-lookup/types'
import { badgeTone, statusBadge, riskBadge, scoreTone } from './status'

interface MentorMatchCardProps {
  match: MentorMatch
  onContact?: () => void
}

const scoreText: Record<string, string> = {
  emerald: 'text-emerald-600 dark:text-emerald-400',
  indigo: 'text-indigo-600 dark:text-indigo-400',
  amber: 'text-amber-600 dark:text-amber-400',
}

/** A single matched-mentor card in the ranked list. */
export function MentorMatchCard({ match, onContact }: MentorMatchCardProps) {
  const isBest = match.rank === 1
  const status = statusBadge(match)
  const risk = riskBadge(match)
  const tone = scoreTone(match.pairScore)

  return (
    <article
      className={`relative flex flex-col rounded-xl border bg-white p-4 transition-shadow hover:shadow-sm dark:bg-slate-900 ${
        isBest
          ? 'border-emerald-300 ring-1 ring-emerald-200 dark:border-emerald-500/40 dark:ring-emerald-500/20'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`flex h-7 min-w-7 items-center justify-center rounded-lg px-1.5 font-mono text-xs font-bold ${
              isBest
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            #{match.rank}
          </span>
          {isBest && (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Crown className="h-3.5 w-3.5" />
              Best match
            </span>
          )}
        </div>
        <div className="text-right">
          <div
            className={`font-mono text-2xl font-bold leading-none tabular-nums ${scoreText[tone]}`}
          >
            {match.pairScore}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500">
            pair score
          </div>
        </div>
      </div>

      <div className="mt-3">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          {match.mentorName}
        </h3>
        <p className="mt-0.5 font-mono text-xs text-slate-400 dark:text-slate-500">
          {match.mentorId}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {match.track}
        </span>
        <span
          className={`rounded-md px-2 py-0.5 text-xs font-medium ${badgeTone[status.tone]}`}
        >
          {status.label}
        </span>
        {risk && (
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-medium ${badgeTone[risk.tone]}`}
          >
            {risk.label}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={onContact}
        className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
      >
        <Mail className="h-4 w-4" />
        Contact {match.mentorName.split(' ')[0]}
      </button>
      <p className="mt-2 truncate text-center font-mono text-[11px] text-slate-400 dark:text-slate-500">
        {match.mentorEmail}
      </p>
    </article>
  )
}
