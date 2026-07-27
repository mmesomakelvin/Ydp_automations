import { useEffect, useState } from 'react'
import { isSupabaseConfigured } from '@/lib/supabase'
import { fetchMentorRoster, type MentorRosterRow } from '@/lib/matches'

/**
 * Loads the full mentor roster for staff (every mentor, matched or not), so the
 * Mentor Lookup can show and red-flag mentors with zero mentees. Errors are
 * swallowed to an empty list — the roster only augments the matched view.
 */
export function useMentorRoster(password: string | null): MentorRosterRow[] {
  const [roster, setRoster] = useState<MentorRosterRow[]>([])

  useEffect(() => {
    if (!isSupabaseConfigured || password === null) return

    let cancelled = false
    fetchMentorRoster(password)
      .then((list) => {
        if (!cancelled) setRoster(list)
      })
      .catch(() => {
        if (!cancelled) setRoster([])
      })

    return () => {
      cancelled = true
    }
  }, [password])

  return roster
}
