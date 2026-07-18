import { useEffect, useState } from 'react'
import { CalendarClock, PartyPopper } from 'lucide-react'

interface CountdownBannerProps {
  /** ISO datetime matching goes out (local time). */
  targetDate: string
  /** Cohort label, e.g. "Cohort 2". */
  cohortLabel?: string
}

function parts(msLeft: number) {
  const days = Math.floor(msLeft / 86_400_000)
  const hours = Math.floor((msLeft % 86_400_000) / 3_600_000)
  const minutes = Math.floor((msLeft % 3_600_000) / 60_000)
  return { days, hours, minutes }
}

/**
 * Persistent banner counting down to when matches are sent out.
 * Flips to a "Matching sent" state once the target passes.
 */
export function CountdownBanner({
  targetDate,
  cohortLabel = 'Cohort 2',
}: CountdownBannerProps) {
  const target = new Date(targetDate).getTime()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  const msLeft = target - now
  const sent = msLeft <= 0

  const dateLabel = new Date(targetDate).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  if (sent) {
    return (
      <div className="flex items-center gap-3 border-b border-emerald-200 bg-emerald-50 px-4 py-2.5 sm:px-6 dark:border-emerald-500/25 dark:bg-emerald-500/10">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white">
          <PartyPopper className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
            Matching sent 🎉
          </p>
          <p className="truncate text-xs text-emerald-700/80 dark:text-emerald-300/80">
            {cohortLabel} matches went out {dateLabel}.
          </p>
        </div>
      </div>
    )
  }

  const { days, hours, minutes } = parts(msLeft)
  const lead = days > 0 ? days : hours > 0 ? hours : minutes
  const unit = days > 0 ? 'day' : hours > 0 ? 'hour' : 'minute'

  return (
    <div className="flex items-center gap-3 border-b border-indigo-100 bg-indigo-50 px-4 py-2.5 sm:px-6 dark:border-indigo-500/20 dark:bg-indigo-500/10">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white dark:bg-indigo-500">
        <CalendarClock className="h-5 w-5" strokeWidth={2} />
      </span>
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
        <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
          <span className="font-mono tabular-nums">{lead}</span> {unit}
          {lead === 1 ? '' : 's'} to go
        </p>
        <p className="truncate text-xs text-indigo-700/80 dark:text-indigo-300/80">
          until {cohortLabel} matches are sent · {dateLabel}
          {days === 0 && (
            <span className="ml-1 font-mono">
              ({hours}h {minutes}m left)
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
