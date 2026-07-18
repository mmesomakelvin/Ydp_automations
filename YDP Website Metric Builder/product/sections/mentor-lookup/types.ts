// Types for the Mentor Lookup section

export type ActiveStatus = 'Pending Review' | 'Active' | 'Completed' | 'Paused'
export type RiskStatus = 'Not Started' | 'On Track' | 'At Risk' | 'Off Track'
export type EmailStatus = 'Sent' | 'Failed' | 'Not Sent'

/** One mentee a mentor is matched with. */
export interface MenteeMatch {
  matchId: string
  menteeId: string
  menteeName: string
  menteeEmail: string
  track: string
  pairScore: number
  /** 1-based rank among this mentor's matches (1 = best pair score). */
  rank: number
  activeStatus: ActiveStatus
  riskStatus: RiskStatus
  emailStatus: EmailStatus
}

/** A mentor and every mentee matched to them, plus a load summary. */
export interface MentorWithMatches {
  mentorId: string
  mentorName: string
  mentorEmail: string
  track: string
  /** Number of mentees matched to this mentor. */
  menteeCount: number
  /** Average pair score across this mentor's matches (0 when none). */
  averagePairScore: number
  /** Mentee matches, ordered by pair score (highest first). */
  matches: MenteeMatch[]
}

export interface MentorLookupProps {
  /** All mentors available to search. */
  mentors: MentorWithMatches[]
  /** Optional mentor to preselect on first render. */
  initialMentorId?: string
  /** Fired when the mentor opts to contact a matched mentee. */
  onContactMentee?: (menteeId: string, matchId: string) => void
  /** Fired when a mentor is selected from search results. */
  onSelectMentor?: (mentorId: string) => void
}
