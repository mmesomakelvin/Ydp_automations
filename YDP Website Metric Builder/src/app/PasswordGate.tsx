import { useState, type FormEvent } from 'react'
import { Loader2, LockKeyhole, Mail } from 'lucide-react'

export type LoginMode = 'participant' | 'staff'

export interface LoginSubmit {
  mode: LoginMode
  password: string
  /** Present only for participant logins. */
  email?: string
}

interface PasswordGateProps {
  onSubmit: (creds: LoginSubmit) => void
  /** Which tab to open on. */
  initialMode?: LoginMode
  /** Set after a rejected password, so we can explain rather than just clear. */
  incorrect?: boolean
  /** Participant only: password was right but no match exists for that email. */
  notFound?: boolean
  checking?: boolean
}

/**
 * Password screen shown before any match data is requested. Two doors:
 * participants (mentor/mentee) sign in with their email + a shared participant
 * password and see only their own match; program staff sign in with the staff
 * password and see the full cohort. The passwords are verified in the database,
 * not here — this only collects them.
 */
export function PasswordGate({
  onSubmit,
  initialMode = 'participant',
  incorrect,
  notFound,
  checking,
}: PasswordGateProps) {
  const [mode, setMode] = useState<LoginMode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const isParticipant = mode === 'participant'

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmedPassword = password.trim()
    const trimmedEmail = email.trim()
    if (!trimmedPassword) return
    if (isParticipant && !trimmedEmail) return
    onSubmit(
      isParticipant
        ? { mode, password: trimmedPassword, email: trimmedEmail }
        : { mode, password: trimmedPassword },
    )
  }

  const tab = (value: LoginMode, label: string) => {
    const activeTab = mode === value
    return (
      <button
        type="button"
        onClick={() => setMode(value)}
        aria-pressed={activeTab}
        className={
          'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ' +
          (activeTab
            ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200')
        }
      >
        {label}
      </button>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex dark:rounded-xl dark:bg-white dark:px-3 dark:py-2.5">
            <img
              src="/ydp-logo.png"
              alt="Young Data Professionals"
              className="h-8 w-auto"
            />
          </span>
          <h1 className="mt-5 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Mentorship Hub
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isParticipant
              ? 'Enter your email and access password to see your match.'
              : 'Program staff sign-in for the full cohort view.'}
          </p>
        </div>

        {/* Who's signing in */}
        <div className="mt-6 flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
          {tab('participant', 'Mentor / Mentee')}
          {tab('staff', 'Program staff')}
        </div>

        <form onSubmit={handleSubmit} className="mt-4">
          {isParticipant && (
            <div className="relative mb-3">
              <label htmlFor="login-email" className="sr-only">
                Your email
              </label>
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="login-email"
                type="email"
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="The email you registered with"
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
          )}

          <label htmlFor="site-password" className="sr-only">
            Access password
          </label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="site-password"
              type="password"
              autoFocus={!isParticipant}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Access password"
              aria-invalid={incorrect || undefined}
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          {incorrect && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
              That password didn't work. Check it and try again.
            </p>
          )}

          {notFound && !incorrect && (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              No match found for that email yet. Double-check the address you
              registered with, or contact YDP.
            </p>
          )}

          <button
            type="submit"
            disabled={
              checking ||
              password.trim().length === 0 ||
              (isParticipant && email.trim().length === 0)
            }
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            {checking && <Loader2 className="h-4 w-4 animate-spin" />}
            {checking
              ? 'Checking…'
              : isParticipant
                ? 'View my match'
                : 'Open cohort view'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
          Cohort 2 · Young Data Professionals
        </p>
      </div>
    </div>
  )
}
