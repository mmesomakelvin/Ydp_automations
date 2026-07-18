// Shared status/tone helpers for the Overview Dashboard.
// Kept in one place so badges read consistently across every panel.
import type { Match } from '@/../product/sections/overview-dashboard/types'

export type Tone = 'indigo' | 'emerald' | 'amber' | 'red' | 'slate'

/** Badge background/text classes per tone (light + dark). */
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

export function riskBadge(match: Match): Badge {
  switch (match.riskStatus) {
    case 'Off Track':
      return { label: 'Off track', tone: 'red' }
    case 'At Risk':
      return { label: 'At risk', tone: 'amber' }
    case 'On Track':
      return { label: 'On track', tone: 'emerald' }
    default:
      return { label: 'Not started', tone: 'slate' }
  }
}

export function emailBadge(match: Match): Badge {
  switch (match.emailStatus) {
    case 'Failed':
      return { label: 'Bounced', tone: 'red' }
    case 'Not Sent':
      return { label: 'Not sent', tone: 'amber' }
    default:
      return { label: 'Sent', tone: 'emerald' }
  }
}

export function scoreBadge(score: number): Badge {
  if (score >= 90) return { label: `${score}`, tone: 'emerald' }
  if (score >= 80) return { label: `${score}`, tone: 'indigo' }
  return { label: `${score}`, tone: 'amber' }
}

export function reviewBadge(): Badge {
  return { label: 'Pending', tone: 'indigo' }
}
