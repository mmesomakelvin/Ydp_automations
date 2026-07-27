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
  mergeMentorRoster,
  type MentorRosterRow,
} from '@/lib/matches'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useMatches } from './useMatches'
import { useMentorRoster } from './useMentorRoster'
import { useMyMatches } from './useMyMatches'
import { useMyPeers } from './useMyPeers'
import { PasswordGate, type LoginSubmit } from './PasswordGate'
import { ParticipantMatch } from './ParticipantMatch'

const AUTH_KEY = 'ydp-hub-auth'

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

/**
 * Who is signed in. Staff see the whole cohort; a participant (mentor/mentee)
 * is scoped by their own email to just their match.
 */
type Auth =
  | { mode: 'staff'; password: string }
  | { mode: 'participant'; email: string; id: string }

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

function loadAuth(): Auth | null {
  try {
    const raw = sessionStorage.getItem(AUTH_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Auth
    if (parsed?.mode === 'staff' || parsed?.mode === 'participant') return parsed
    return null
  } catch {
    return null
  }
}

function authFromSubmit(creds: LoginSubmit): Auth {
  return creds.mode === 'participant'
    ? { mode: 'participant', email: creds.email ?? '', id: creds.id ?? '' }
    : { mode: 'staff', password: creds.password ?? '' }
}

/**
 * The live YDP Mentorship Hub app. Routes between two experiences behind one
 * login: program staff get the full cohort dashboard; a mentor/mentee gets only
 * their own match. Until Supabase is configured it shows the staff view on
 * bundled sample data so the design stays previewable.
 */
export default function LiveApp() {
  const [auth, setAuth] = useState<Auth | null>(loadAuth)

  const handleAuth = (creds: LoginSubmit) => {
    const next = authFromSubmit(creds)
    sessionStorage.setItem(AUTH_KEY, JSON.stringify(next))
    setAuth(next)
  }

  const signOut = () => {
    sessionStorage.removeItem(AUTH_KEY)
    setAuth(null)
  }

  // Not configured → sample data, staff view, no gate.
  if (!isSupabaseConfigured) {
    return <StaffApp password={null} />
  }

  if (auth === null) {
    return (
      <div style={productType}>
        <PasswordGate onSubmit={handleAuth} />
      </div>
    )
  }

  if (auth.mode === 'participant') {
    return (
      <ParticipantApp
        email={auth.email}
        id={auth.id}
        onReauth={handleAuth}
        onSignOut={signOut}
      />
    )
  }

  return (
    <StaffApp password={auth.password} onReauth={handleAuth} onSignOut={signOut} />
  )
}

/** The full cohort experience for program staff (and the sample-data preview). */
function StaffApp({
  password,
  onReauth,
  onSignOut,
}: {
  password: string | null
  onReauth?: (creds: LoginSubmit) => void
  onSignOut?: () => void
}) {
  const [active, setActive] = useState<SectionKey>('dashboard')
  const { rows, loading, error, unauthorized, configured } = useMatches(password)
  const mentorRoster = useMentorRoster(password)

  // Wrong staff password → re-prompt with the staff tab preselected.
  if (configured && unauthorized && onReauth) {
    return (
      <div style={productType}>
        <PasswordGate onSubmit={onReauth} initialMode="staff" incorrect />
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
        onLogout={() => onSignOut?.()}
      >
        {!configured && <SampleDataNotice />}
        {configured && loading && !rows ? (
          <LoadingState />
        ) : configured && !rows ? (
          // Live mode must never fall through to sample data — showing fake
          // names to someone whose real load failed reads as success.
          <LoadFailed message={error?.message ?? 'No matches returned.'} />
        ) : (
          <SectionView
            active={active}
            live={live}
            rows={rows}
            roster={mentorRoster}
            goTo={setActive}
          />
        )}
      </AppShell>
    </div>
  )
}

/** A single participant's own-match experience, scoped by their email + ID. */
function ParticipantApp({
  email,
  id,
  onReauth,
  onSignOut,
}: {
  email: string
  id: string
  onReauth: (creds: LoginSubmit) => void
  onSignOut: () => void
}) {
  const { view, loading, error, notFound } = useMyMatches(email, id)
  const peers = useMyPeers(email, id)

  // Email + ID didn't match any row → re-prompt on the participant tab with an
  // explanation (wrong details, or not matched yet).
  if (notFound) {
    return (
      <div style={productType}>
        <PasswordGate onSubmit={onReauth} initialMode="participant" notFound />
      </div>
    )
  }

  if (error) {
    return (
      <div style={productType}>
        <LoadFailed message={error.message} />
      </div>
    )
  }

  if (loading || !view) {
    return (
      <div style={productType}>
        <LoadingState />
      </div>
    )
  }

  return (
    <div style={productType}>
      <ParticipantMatch view={view} peers={peers} onSignOut={onSignOut} />
    </div>
  )
}

function SectionView({
  active,
  live,
  rows,
  roster,
  goTo,
}: {
  active: SectionKey
  live: boolean
  rows: ReturnType<typeof useMatches>['rows']
  roster: MentorRosterRow[]
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
    if (live && rows) return mergeMentorRoster(toMentorLookupData(rows), roster)
    return mentorSample.mentors as MentorWithMatches[]
  }, [live, rows, roster])

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
    <div className="flex h-screen items-center justify-center py-24 text-slate-400 dark:text-slate-500">
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
