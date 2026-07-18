import { supabase } from './supabase'
import type {
  DashboardSummary,
  TrackStat,
  ScoreBand,
  AttentionMatches,
  Match as DashboardMatch,
  ActiveStatus,
  RiskStatus,
  EmailStatus,
} from '@/../product/sections/overview-dashboard/types'
import type {
  MenteeWithMatches,
  MentorMatch,
} from '@/../product/sections/mentee-lookup/types'
import type {
  MentorWithMatches,
  MenteeMatch,
} from '@/../product/sections/mentor-lookup/types'

/** A raw row from the Supabase `matches` table. */
export interface MatchRow {
  match_id: string
  mentee_id: string
  mentee_name: string
  mentee_email: string | null
  mentor_id: string
  mentor_name: string
  mentor_email: string | null
  track: string | null
  match_status: string | null
  active_status: string | null
  start_date: string | null
  last_check_in_date: string | null
  missed_sessions_count: number | null
  feedback_completion_count: number | null
  mentor_rating_average: number | null
  risk_status: string | null
  notes: string | null
  pair_score: number | null
  mentee_match_email_status: string | null
  mentee_match_email_sent_at: string | null
  mentor_match_email_status: string | null
  mentor_match_email_sent_at: string | null
  match_email_last_error: string | null
}

export const LOW_SCORE_THRESHOLD = 80

/** Fetch every match row. Throws if Supabase isn't configured. */
export async function fetchAllMatches(): Promise<MatchRow[]> {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.',
    )
  }
  const { data, error } = await supabase.from('matches').select('*')
  if (error) throw error
  return (data ?? []) as MatchRow[]
}

// --- Normalizers -----------------------------------------------------------

/** Pair score from the dedicated column, falling back to the Notes text. */
export function pairScoreOf(row: MatchRow): number {
  if (typeof row.pair_score === 'number') return row.pair_score
  const m = row.notes?.match(/pair score:\s*(\d+)/i)
  return m ? Number(m[1]) : 0
}

function activeStatusOf(row: MatchRow): ActiveStatus {
  switch ((row.active_status ?? '').toLowerCase()) {
    case 'active':
      return 'Active'
    case 'completed':
      return 'Completed'
    case 'paused':
      return 'Paused'
    default:
      return 'Pending Review'
  }
}

function riskStatusOf(row: MatchRow): RiskStatus {
  switch ((row.risk_status ?? '').toLowerCase()) {
    case 'on track':
      return 'On Track'
    case 'at risk':
      return 'At Risk'
    case 'off track':
      return 'Off Track'
    default:
      return 'Not Started'
  }
}

function emailStatusOf(status: string | null, sentAt: string | null): EmailStatus {
  const s = (status ?? '').toLowerCase()
  if (s.includes('fail') || s.includes('bounce') || s.includes('error')) return 'Failed'
  if (s.includes('sent') || sentAt) return 'Sent'
  return 'Not Sent'
}

/** Worst of the mentee/mentor email states for a row. */
function rowEmailStatus(row: MatchRow): EmailStatus {
  const mentee = emailStatusOf(
    row.mentee_match_email_status,
    row.mentee_match_email_sent_at,
  )
  const mentor = emailStatusOf(
    row.mentor_match_email_status,
    row.mentor_match_email_sent_at,
  )
  if (mentee === 'Failed' || mentor === 'Failed') return 'Failed'
  if (mentee === 'Not Sent' || mentor === 'Not Sent') return 'Not Sent'
  return 'Sent'
}

// --- Dashboard mapping ------------------------------------------------------

function toDashboardMatch(row: MatchRow): DashboardMatch {
  return {
    matchId: row.match_id,
    menteeId: row.mentee_id,
    menteeName: row.mentee_name,
    mentorId: row.mentor_id,
    mentorName: row.mentor_name,
    track: row.track ?? '—',
    pairScore: pairScoreOf(row),
    matchStatus:
      (row.match_status ?? '').toLowerCase().includes('manual')
        ? 'Manually Matched'
        : 'Auto-Matched',
    activeStatus: activeStatusOf(row),
    riskStatus: riskStatusOf(row),
    emailStatus: rowEmailStatus(row),
    missedSessions: row.missed_sessions_count ?? 0,
    lastCheckInDate: row.last_check_in_date,
    notes: row.notes ?? '',
  }
}

export interface DashboardData {
  cohortLabel: string
  lowScoreThreshold: number
  filtersApplied: string[]
  summary: DashboardSummary
  tracks: TrackStat[]
  scoreBands: ScoreBand[]
  attention: AttentionMatches
}

export function toDashboardData(
  rows: MatchRow[],
  cohortLabel = 'Cohort 2',
): DashboardData {
  const matches = rows.map(toDashboardMatch)

  const menteeIds = new Set(rows.map((r) => r.mentee_id))
  const mentorIds = new Set(rows.map((r) => r.mentor_id))

  const atRisk = matches.filter(
    (m) => m.riskStatus === 'At Risk' || m.riskStatus === 'Off Track',
  )
  const pendingReview = matches.filter((m) => m.activeStatus === 'Pending Review')
  const emailIssues = matches.filter(
    (m) => m.emailStatus === 'Failed' || m.emailStatus === 'Not Sent',
  )
  const lowScore = matches.filter((m) => m.pairScore < LOW_SCORE_THRESHOLD)

  const avg =
    matches.length === 0
      ? 0
      : Math.round(
          matches.reduce((sum, m) => sum + m.pairScore, 0) / matches.length,
        )

  // Track distribution
  const trackMap = new Map<string, { matches: number; mentees: Set<string>; mentors: Set<string> }>()
  for (const r of rows) {
    const key = r.track ?? '—'
    const entry = trackMap.get(key) ?? { matches: 0, mentees: new Set(), mentors: new Set() }
    entry.matches += 1
    entry.mentees.add(r.mentee_id)
    entry.mentors.add(r.mentor_id)
    trackMap.set(key, entry)
  }
  const tracks: TrackStat[] = [...trackMap.entries()]
    .map(([name, e]) => ({
      name,
      matchCount: e.matches,
      menteeCount: e.mentees.size,
      mentorCount: e.mentors.size,
    }))
    .sort((a, b) => b.matchCount - a.matchCount)

  const scoreBands: ScoreBand[] = [
    { band: '90–100', count: matches.filter((m) => m.pairScore >= 90).length },
    { band: '80–89', count: matches.filter((m) => m.pairScore >= 80 && m.pairScore < 90).length },
    { band: 'Below 80', count: matches.filter((m) => m.pairScore < 80).length },
  ]

  return {
    cohortLabel,
    lowScoreThreshold: LOW_SCORE_THRESHOLD,
    filtersApplied: [],
    summary: {
      totalMentees: menteeIds.size,
      totalMentors: mentorIds.size,
      totalMatches: matches.length,
      averagePairScore: avg,
      atRiskCount: atRisk.length,
      pendingReviewCount: pendingReview.length,
      emailIssueCount: emailIssues.length,
      lowScoreCount: lowScore.length,
    },
    tracks,
    scoreBands,
    attention: { atRisk, pendingReview, emailIssues, lowScore },
  }
}

// --- Mentee Lookup mapping --------------------------------------------------

export function toMenteeLookupData(rows: MatchRow[]): MenteeWithMatches[] {
  const byMentee = new Map<string, MatchRow[]>()
  for (const r of rows) {
    const list = byMentee.get(r.mentee_id) ?? []
    list.push(r)
    byMentee.set(r.mentee_id, list)
  }

  return [...byMentee.values()]
    .map((group) => {
      const sorted = [...group].sort((a, b) => pairScoreOf(b) - pairScoreOf(a))
      const first = sorted[0]
      const matches: MentorMatch[] = sorted.map((r, i) => ({
        matchId: r.match_id,
        mentorId: r.mentor_id,
        mentorName: r.mentor_name,
        mentorEmail: r.mentor_email ?? '',
        track: r.track ?? '—',
        pairScore: pairScoreOf(r),
        rank: i + 1,
        activeStatus: activeStatusOf(r),
        riskStatus: riskStatusOf(r),
        emailStatus: emailStatusOf(
          r.mentee_match_email_status,
          r.mentee_match_email_sent_at,
        ),
      }))
      return {
        menteeId: first.mentee_id,
        menteeName: first.mentee_name,
        menteeEmail: first.mentee_email ?? '',
        track: first.track ?? '—',
        matches,
      }
    })
    .sort((a, b) => a.menteeName.localeCompare(b.menteeName))
}

// --- Mentor Lookup mapping --------------------------------------------------

export function toMentorLookupData(rows: MatchRow[]): MentorWithMatches[] {
  const byMentor = new Map<string, MatchRow[]>()
  for (const r of rows) {
    const list = byMentor.get(r.mentor_id) ?? []
    list.push(r)
    byMentor.set(r.mentor_id, list)
  }

  return [...byMentor.values()]
    .map((group) => {
      const sorted = [...group].sort((a, b) => pairScoreOf(b) - pairScoreOf(a))
      const first = sorted[0]
      const matches: MenteeMatch[] = sorted.map((r, i) => ({
        matchId: r.match_id,
        menteeId: r.mentee_id,
        menteeName: r.mentee_name,
        menteeEmail: r.mentee_email ?? '',
        track: r.track ?? '—',
        pairScore: pairScoreOf(r),
        rank: i + 1,
        activeStatus: activeStatusOf(r),
        riskStatus: riskStatusOf(r),
        emailStatus: emailStatusOf(
          r.mentor_match_email_status,
          r.mentor_match_email_sent_at,
        ),
      }))
      const avg =
        matches.length === 0
          ? 0
          : Math.round(
              matches.reduce((sum, m) => sum + m.pairScore, 0) / matches.length,
            )
      return {
        mentorId: first.mentor_id,
        mentorName: first.mentor_name,
        mentorEmail: first.mentor_email ?? '',
        track: first.track ?? '—',
        menteeCount: matches.length,
        averagePairScore: avg,
        matches,
      }
    })
    .sort((a, b) => a.mentorName.localeCompare(b.mentorName))
}
