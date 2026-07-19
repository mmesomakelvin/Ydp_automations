import { useState, type FormEvent } from 'react'
import { Loader2, LockKeyhole } from 'lucide-react'

interface PasswordGateProps {
  onSubmit: (password: string) => void
  /** Set after a rejected attempt, so we can explain rather than just clear. */
  incorrect?: boolean
  checking?: boolean
}

/**
 * Password screen shown before any match data is requested. The password is
 * verified by the database, not here — this only collects it.
 */
export function PasswordGate({ onSubmit, incorrect, checking }: PasswordGateProps) {
  const [value, setValue] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (trimmed) onSubmit(trimmed)
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
            Enter the access password from your Cohort 2 email.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6">
          <label htmlFor="site-password" className="sr-only">
            Access password
          </label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="site-password"
              type="password"
              autoFocus
              autoComplete="current-password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Access password"
              aria-invalid={incorrect || undefined}
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          {incorrect && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
              That password didn't work. Check the email again.
            </p>
          )}

          <button
            type="submit"
            disabled={checking || value.trim().length === 0}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            {checking && <Loader2 className="h-4 w-4 animate-spin" />}
            {checking ? 'Checking…' : 'View my match'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
          Cohort 2 · Matches sent Tuesday, Jul 21
        </p>
      </div>
    </div>
  )
}
