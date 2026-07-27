import {
  Mail,
  PartyPopper,
  LogOut,
  ArrowRight,
  Sparkles,
  Linkedin,
} from 'lucide-react'
import type { ParticipantView, CounterpartCard } from '@/lib/matches'

function firstNameOf(name: string): string {
  const first = name.trim().split(/\s+/)[0]
  return first || 'there'
}

/** Ensure a LinkedIn value is a clickable absolute URL. */
function linkedinHref(raw: string): string {
  const v = raw.trim()
  return /^https?:\/\//i.test(v) ? v : `https://${v}`
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0]!.toUpperCase()
  return (parts[0][0]! + parts[parts.length - 1][0]!).toUpperCase()
}

/**
 * A participant's personal "your match" page. A mentee sees their mentor; a
 * mentor sees their mentee(s). Shows only name, email, and track — never
 * internal scores or status. No cohort-wide data is reachable from here.
 */
export function ParticipantMatch({
  view,
  onSignOut,
}: {
  view: ParticipantView
  onSignOut: () => void
}) {
  const roleLabel = view.myRole === 'mentee' ? 'mentee' : 'mentor'
  const counterpartWord = view.myRole === 'mentee' ? 'mentor' : 'mentee'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <span className="inline-flex dark:rounded-lg dark:bg-white dark:px-2 dark:py-1.5">
          <img
            src="/ydp-logo.png"
            alt="Young Data Professionals"
            className="h-6 w-auto"
          />
        </span>
        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-200/60 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </header>

      <main className="mx-auto w-full max-w-lg px-4 pb-16 pt-4 sm:px-6">
        {/* Celebration header */}
        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
            <PartyPopper className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Hi {firstNameOf(view.myName)}, you're matched!
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Welcome to YDP Mentorship Cohort 2. Here{' '}
            {view.counterparts.length > 1 ? 'are' : 'is'} the{' '}
            {counterpartWord}
            {view.counterparts.length > 1 ? 's' : ''} you've been paired with.
          </p>
        </div>

        {/* Counterpart section */}
        <h2 className="mt-8 mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {view.counterpartHeading}
        </h2>

        <div className="space-y-3">
          {view.counterparts.map((c) => (
            <CounterpartCardView key={c.matchId} card={c} />
          ))}
        </div>

        {/* Next steps */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Next steps
          </h3>
          <ol className="mt-3 space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
            <li className="flex gap-2.5">
              <Step n={1} />
              <span>
                Say hello — use the email button above to reach your{' '}
                {counterpartWord}
                {view.counterparts.length > 1 ? 's' : ''} and introduce yourself.
              </span>
            </li>
            <li className="flex gap-2.5">
              <Step n={2} />
              <span>
                Agree on a first call and how often you'll meet during the cohort.
              </span>
            </li>
            <li className="flex gap-2.5">
              <Step n={3} />
              <span>
                Watch your inbox for YDP onboarding details and program updates.
              </span>
            </li>
          </ol>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
          Signed in as a {roleLabel} · Cohort 2 · Young Data Professionals
        </p>
      </main>
    </div>
  )
}

function CounterpartCardView({ card }: { card: CounterpartCard }) {
  const roleLabel = card.role === 'mentor' ? 'Mentor' : 'Mentee'
  const hasEmail = card.email.trim().length > 0
  const hasScore = typeof card.score === 'number'
  const hasReason = card.reason.trim().length > 0
  const hasLinkedin = card.linkedin.trim().length > 0

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-base font-semibold text-white">
          {initialsOf(card.name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                {roleLabel}
              </p>
              <p className="mt-0.5 truncate text-lg font-semibold text-slate-900 dark:text-white">
                {card.name}
              </p>
            </div>
            {hasScore && (
              <span
                className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                title="How strong this match is, out of 100"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {card.score}% match
              </span>
            )}
          </div>
          <span className="mt-1.5 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {card.track}
          </span>
        </div>
      </div>

      {hasReason && (
        <div className="mt-4 rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/50">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Why you were matched
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
            {card.reason}
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {hasEmail && (
          <a
            href={`mailto:${card.email}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            <Mail className="h-4 w-4" />
            Email {firstNameOf(card.name)}
            <ArrowRight className="h-4 w-4" />
          </a>
        )}
        {hasLinkedin && (
          <a
            href={linkedinHref(card.linkedin)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Linkedin className="h-4 w-4" />
            LinkedIn
          </a>
        )}
      </div>
    </div>
  )
}

function Step({ n }: { n: number }) {
  return (
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
      {n}
    </span>
  )
}
