// Status/tone helpers for Mentee Lookup (self-contained for portability).
import type {
  MentorMatch,
} from '@/../product/sections/mentee-lookup/types'

export type Tone = 'indigo' | 'emerald' | 'amber' | 'red' | 'slate'

export const badgeTone: Record<Tone, string> = {
  indigo:
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  emerald:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  amber:
    'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  slate:
    'bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300',
}

export interface Badge {
  label: string
  tone: Tone
}

/** The pairing's active/review status. */
export function statusBadge(match: MentorMatch): Badge {
  switch (match.activeStatus) {
    case 'Active':
      return { label: 'Active', tone: 'emerald' }
    case 'Pending Review':
      return { label: 'Pending review', tone: 'indigo' }
    case 'Paused':
      return { label: 'Paused', tone: 'amber' }
    default:
      return { label: 'Completed', tone: 'slate' }
  }
}

/** A risk badge, only meaningful when a match is off track. */
export function riskBadge(match: MentorMatch): Badge | null {
  switch (match.riskStatus) {
    case 'Off Track':
      return { label: 'Off track', tone: 'red' }
    case 'At Risk':
      return { label: 'At risk', tone: 'amber' }
    default:
      return null
  }
}

/** Tone for a pair score, used to color the score figure. */
export function scoreTone(score: number): Tone {
  if (score >= 90) return 'emerald'
  if (score >= 80) return 'indigo'
  return 'amber'
}
