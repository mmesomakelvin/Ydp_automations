import { useState, type ReactNode } from 'react'
import { Menu, X, Sparkles } from 'lucide-react'
import { MainNav, type NavigationItem } from './MainNav'
import { UserMenu, type ShellUser } from './UserMenu'
import { CountdownBanner } from './CountdownBanner'

interface AppShellProps {
  children: ReactNode
  navigationItems: NavigationItem[]
  user?: ShellUser
  cohortLabel?: string
  /** ISO datetime matching is sent; drives the countdown banner. */
  matchingDate?: string
  onNavigate?: (href: string) => void
  onLogout?: () => void
}

function Brand({ cohortLabel }: { cohortLabel?: string }) {
  return (
    <div className="flex items-center gap-2.5 px-5 py-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm dark:bg-indigo-500">
        <Sparkles className="h-5 w-5" strokeWidth={2.2} />
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            YDP Mentorship Hub
          </span>
          {cohortLabel && (
            <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              {cohortLabel}
            </span>
          )}
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">Mentorship metrics</span>
      </div>
    </div>
  )
}

/**
 * Application shell for YDP Mentorship Hub.
 * Persistent left sidebar (brand, nav, user menu) on desktop;
 * collapses into a hamburger drawer on mobile.
 */
export function AppShell({
  children,
  navigationItems,
  user,
  cohortLabel = 'C2',
  matchingDate = '2026-07-21T23:59:59',
  onNavigate,
  onLogout,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleNavigate = (href: string) => {
    setMobileOpen(false)
    onNavigate?.(href)
  }

  const sidebarInner = (
    <div className="flex h-full flex-col">
      <Brand cohortLabel={cohortLabel} />
      <div className="mt-2 flex-1 overflow-y-auto pb-4">
        <MainNav items={navigationItems} onNavigate={handleNavigate} />
      </div>
      {user && (
        <div className="border-t border-slate-200 py-4 dark:border-slate-800">
          <UserMenu user={user} onLogout={onLogout} />
        </div>
      )}
    </div>
  )

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col dark:border-slate-800 dark:bg-slate-900">
        {sidebarInner}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarInner}
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Countdown to matching send-out (persists across all pages) */}
        <CountdownBanner targetDate={matchingDate} cohortLabel="Cohort 2" />

        {/* Mobile top bar */}
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="flex items-center gap-2 text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            YDP Mentorship Hub
            <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              {cohortLabel}
            </span>
          </span>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
