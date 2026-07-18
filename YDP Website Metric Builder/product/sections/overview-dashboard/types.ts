// Types for the Overview Dashboard section

export type MatchStatus = 'Auto-Matched' | 'Manually Matched'
export type ActiveStatus = 'Pending Review' | 'Active' | 'Completed' | 'Paused'
export type RiskStatus = 'Not Started' | 'On Track' | 'At Risk' | 'Off Track'
export type EmailStatus = 'Sent' | 'Failed' | 'Not Sent'

/** A single mentee-to-mentor pairing surfaced on the dashboard. */
export interface Match {
  matchId: string
  menteeId: string
  menteeName: string
  mentorId: string
  mentorName: string
  track: string
  pairScore: number
  matchStatus: MatchStatus
  activeStatus: ActiveStatus
  riskStatus: RiskStatus
  emailStatus: EmailStatus
  missedSessions: number
  lastCheckInDate: string | null
  notes: string
}

/** Program-wide headline metrics. */
export interface DashboardSummary {
  totalMentees: number
  totalMentors: number
  totalMatches: number
  averagePairScore: number
  atRiskCount: number
  pendingReviewCount: number
  emailIssueCount: number
  lowScoreCount: number
}

/** Match distribution for a single track. */
export interface TrackStat {
  name: string
  matchCount: number
  menteeCount: number
  mentorCount: number
}

/** A bucket of matches grouped by pair-score range. */
export interface ScoreBand {
  band: string
  count: number
}

/** The four attention lists shown in the health panel. */
export interface AttentionMatches {
  atRisk: Match[]
  pendingReview: Match[]
  emailIssues: Match[]
  lowScore: Match[]
}

/** The categories a coordinator can drill into. */
export type DrillDownCategory =
  | 'totalMentees'
  | 'totalMentors'
  | 'totalMatches'
  | 'averagePairScore'
  | 'atRisk'
  | 'pendingReview'
  | 'emailIssues'
  | 'lowScore'
  | { track: string }

export interface OverviewDashboardProps {
  /** Cohort label shown in the header (e.g. "Cohort 2"). */
  cohortLabel: string
  /** Pair-score threshold below which a match is considered low-score. */
  lowScoreThreshold: number
  /** Active filters currently applied to the dashboard (empty when unfiltered). */
  filtersApplied: string[]
  /** Headline program metrics. */
  summary: DashboardSummary
  /** Match distribution per track, used for the bar panel. */
  tracks: TrackStat[]
  /** Match quality breakdown by score band. */
  scoreBands: ScoreBand[]
  /** Lists of matches that need attention. */
  attention: AttentionMatches
  /** Fired when a KPI tile, track bar, or health card is clicked to drill down. */
  onDrillDown?: (category: DrillDownCategory) => void
  /** Fired when an individual match row is clicked. */
  onOpenMatch?: (matchId: string) => void
  /** Fired to navigate elsewhere in the app (e.g. to a lookup section). */
  onNavigate?: (href: string) => void
}
