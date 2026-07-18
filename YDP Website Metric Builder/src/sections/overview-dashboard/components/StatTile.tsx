import type { LucideIcon } from 'lucide-react'

type TileTone = 'indigo' | 'emerald' | 'slate'

interface StatTileProps {
  label: string
  value: string | number
  hint?: string
  icon: LucideIcon
  tone?: TileTone
  /** Optional 0–100 fill shown as a thin accent bar under the value. */
  fill?: number
  onClick?: () => void
}

const iconTone: Record<TileTone, string> = {
  indigo:
    'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
  emerald:
    'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
  slate: 'bg-slate-100 text-slate-500 dark:bg-slate-700/60 dark:text-slate-300',
}

const barTone: Record<TileTone, string> = {
  indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-500',
  slate: 'bg-slate-400',
}

/** A single KPI tile. Clickable to drill into the matches behind the number. */
export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'slate',
  fill,
  onClick,
}: StatTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-start rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
    >
      <div className="flex w-full items-center justify-between">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconTone[tone]}`}
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight text-slate-900 tabular-nums dark:text-white">
        {value}
      </div>
      <div className="mt-0.5 text-sm font-medium text-slate-500 dark:text-slate-400">
        {label}
      </div>
      {typeof fill === 'number' && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className={`h-full rounded-full ${barTone[tone]}`}
            style={{ width: `${Math.max(0, Math.min(100, fill))}%` }}
          />
        </div>
      )}
      {hint && (
        <div className="mt-2 text-xs text-slate-400 dark:text-slate-500">
          {hint}
        </div>
      )}
    </button>
  )
}
