import { useMemo, useState, type CSSProperties } from 'react'
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Table2,
  Loader2,
  Database,
} from 'lucide-react'
import { AppShell } from '@/shell/components/AppShell'
import type { NavigationItem } from '@/shell/components/MainNav'
import { OverviewDashboard } from '@/sections/overview-dashboard/components/OverviewDashboard'
import { MenteeLookup } from '@/sections/mentee-lookup/components/MenteeLookup'
import { MentorLookup } from '@/sections/mentor-lookup/components/MentorLookup'
import {
  toDashboardData,
  toMenteeLookupData,
  toMentorLookupData,
} from '@/lib/matches'
import { useMatches } from './useMatches'
import { PasswordGate } from './PasswordGate'

const PASSWORD_KEY = 'ydp-hub-password'

import dashboardSample from '@/../product/sections/overview-dashboard/data.json'
import menteeSample from '@/../product/sections/mentee-lookup/data.json'
import mentorSample from '@/../product/sections/mentor-lookup/data.json'

import type {
  DashboardSummary,
  TrackStat,
  ScoreBand,
  AttentionMatches,
} from '@/../product/sections/overview-dashboard/types'
import type { MenteeWithMatches } from '@/../product/sections/mentee-lookup/types'
import type { MentorWithMatches } from '@/../product/sections/mentor-lookup/types'

type SectionKey = 'dashboard' | 'mentee-lookup' | 'mentor-lookup' | 'directory'

const SECTIONS: { key: SectionKey; label: string; icon: NavigationItem['icon'] }[] = [
  { key: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
  { key: 'mentee-lookup', label: 'Mentee Lookup', icon: GraduationCap },
  { key: 'mentor-lookup', label: 'Mentor Lookup', icon: Users },
  { key: 'directory', label: 'Match Directory', icon: Table2 },
]

function mailto(email: string) {
  if (email) window.location.href = `mailto:${email}`
}

/**
 * The product's typography tokens. Design OS itself runs on DM Sans, so the
 * Hub re-points Tailwind's font variables on its own root — redefining them
 * here cascades to every `font-sans` / `font-mono` utility inside.
 */
const productType = {
  '--font-sans': "'Inter', system-ui, sans-serif",
  '--font-display': "'Inter', system-ui, sans-serif",
  '--font-mono': "'JetBrains Mono', ui-monospace, monospace",
} as CSSProperties

/**
 * The live YDP Mentorship Hub app. Renders the shell with real navigation and
 * feeds each section from Supabase, falling back to bundled sample data until
 * credentials are configured.
 */
export default function LiveApp() {
  const [active, setActive] = useState<SectionKey>('dashboard')
  // Kept in sessionStorage so a refresh doesn't re-prompt, but a new tab does.
  const [password, setPassword] = useState<string | null>(() =>
    sessionStorage.getItem(PASSWORD_KEY),
  )
  const { rows, loading, error, unauthorized, configured } = useMatches(password)

  const unlock = (value: string) => {
    sessionStorage.setItem(PASSWORD_KEY, value)
    setPassword(value)
  }

  // Live data is gated; sample data isn't, so the design stays previewable.
  if (configured && (password === null || unauthorized)) {
    return (
      <div style={productType}>
        <PasswordGate
          onSubmit={unlock}
          incorrect={unauthorized}
          checking={loading}
        />
      </div>
    )
  }

  const live = configured && rows !== null

  const navigationItems: NavigationItem[] = SECTIONS.map((s) => ({
    label: s.label,
    href: s.key,
    icon: s.icon,
    isActive: s.key === active,
  }))

  const user = { name: 'Program Coordinator', role: 'YDP Cohort 2' }

  return (
    <div className="h-screen" style={productType}>
      <AppShell
        navigationItems={navigationItems}
        user={user}
        cohortLabel="C2"
        onNavigate={(href) => setActive(href as SectionKey)}
        onLogout={() => console.log('Logout')}
      >
        {!configured && <SampleDataNotice />}
        {configured && loading && !rows ? (
          <LoadingState />
        ) : configured && !rows ? (
          // Live mode must never fall through to sample data — showing fake
          // names to someone whose real load failed reads as success.
          <LoadFailed message={error?.message ?? 'No matches returned.'} />
        ) : (
          <SectionView active={active} live={live} rows={rows} goTo={setActive} />
        )}
      </AppShell>
    </div>
  )
}

function SectionView({
  active,
  live,
  rows,
  goTo,
}: {
  active: SectionKey
  live: boolean
  rows: ReturnType<typeof useMatches>['rows']
  goTo: (key: SectionKey) => void
}) {
  // Dashboard
  const dashboard = useMemo(() => {
    if (live && rows) return toDashboardData(rows)
    return {
      cohortLabel: dashboardSample.cohortLabel,
      lowScoreThreshold: dashboardSample.lowScoreThreshold,
      filtersApplied: dashboardSample.filtersApplied,
      summary: dashboardSample.summary as DashboardSummary,
      tracks: dashboardSample.tracks as TrackStat[],
      scoreBands: dashboardSample.scoreBands as ScoreBand[],
      attention: dashboardSample.attention as unknown as AttentionMatches,
    }
  }, [live, rows])

  const mentees = useMemo<MenteeWithMatches[]>(() => {
    if (live && rows) return toMenteeLookupData(rows)
    return menteeSample.mentees as MenteeWithMatches[]
  }, [live, rows])

  const mentors = useMemo<MentorWithMatches[]>(() => {
    if (live && rows) return toMentorLookupData(rows)
    return mentorSample.mentors as MentorWithMatches[]
  }, [live, rows])

  switch (active) {
    case 'dashboard':
      return (
        <OverviewDashboard
          {...dashboard}
          onDrillDown={() => goTo('directory')}
          onOpenMatch={(id) => console.log('Open match:', id)}
          onNavigate={() => {}}
        />
      )
    case 'mentee-lookup':
      return (
        <MenteeLookup
          mentees={mentees}
          onContactMentor={(_mentorId, matchId) => {
            const email = mentees
              .flatMap((m) => m.matches)
              .find((m) => m.matchId === matchId)?.mentorEmail
            mailto(email ?? '')
          }}
          onSelectMentee={(id) => console.log('Select mentee:', id)}
        />
      )
    case 'mentor-lookup':
      return (
        <MentorLookup
          mentors={mentors}
          onContactMentee={(_menteeId, matchId) => {
            const email = mentors
              .flatMap((m) => m.matches)
              .find((m) => m.matchId === matchId)?.menteeEmail
            mailto(email ?? '')
          }}
          onSelectMentor={(id) => console.log('Select mentor:', id)}
        />
      )
    case 'directory':
      return <DirectoryPlaceholder onBack={() => goTo('dashboard')} />
  }
}

function SampleDataNotice() {
  return (
    <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800 sm:px-6 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">
      <Database className="h-3.5 w-3.5 shrink-0" />
      Showing sample data. Add your Supabase keys to <span className="font-mono">.env.local</span> to go live.
    </div>
  )
}

function LoadFailed({ message }: { message: string }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-6 py-24 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300">
        <Database className="h-5 w-5" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
        Couldn't load matches
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{message}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
      >
        Try again
      </button>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex h-full items-center justify-center py-24 text-slate-400 dark:text-slate-500">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      Loading matches…
    </div>
  )
}

function DirectoryPlaceholder({ onBack }: { onBack: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-6 py-24 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
        <Table2 className="h-5 w-5" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
        Match Directory coming soon
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        The searchable, filterable table of every match is the next section to be
        designed.
      </p>
      <button
        type="button"
        onClick={onBack}
        className="mt-5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
      >
        Back to dashboard
      </button>
    </div>
  )
}
