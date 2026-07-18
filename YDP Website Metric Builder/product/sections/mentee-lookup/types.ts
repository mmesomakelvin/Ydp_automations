// Types for the Mentee Lookup section

export type ActiveStatus = 'Pending Review' | 'Active' | 'Completed' | 'Paused'
export type RiskStatus = 'Not Started' | 'On Track' | 'At Risk' | 'Off Track'
export type EmailStatus = 'Sent' | 'Failed' | 'Not Sent'

/** One mentor a mentee is matched with. */
export interface MentorMatch {
  matchId: string
  mentorId: string
  mentorName: string
  mentorEmail: string
  track: string
  pairScore: number
  /** 1-based rank among this mentee's matches (1 = best pair score). */
  rank: number
  activeStatus: ActiveStatus
  riskStatus: RiskStatus
  emailStatus: EmailStatus
}

/** A mentee and every mentor they've been matched with. */
export interface MenteeWithMatches {
  menteeId: string
  menteeName: string
  menteeEmail: string
  track: string
  /** Mentor matches, ordered by pair score (highest first). */
  matches: MentorMatch[]
}

export interface MenteeLookupProps {
  /** All mentees available to search. */
  mentees: MenteeWithMatches[]
  /** Optional mentee to preselect on first render. */
  initialMenteeId?: string
  /** Fired when the mentee opts to contact a matched mentor. */
  onContactMentor?: (mentorId: string, matchId: string) => void
  /** Fired when a mentee is selected from search results. */
  onSelectMentee?: (menteeId: string) => void
}
