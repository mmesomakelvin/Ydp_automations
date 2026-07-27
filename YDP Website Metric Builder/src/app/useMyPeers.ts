import { useEffect, useState } from 'react'
import { isSupabaseConfigured } from '@/lib/supabase'
import { fetchMyPeers, type PeerMentee } from '@/lib/matches'

/**
 * Loads the logged-in mentee's peer group (other mentees under the same mentor).
 * Returns an empty list for mentors, or before the credential resolves. Errors
 * are swallowed to null-effect: the peer list is a bonus, not core to the page.
 */
export function useMyPeers(email: string | null, id: string | null): PeerMentee[] {
  const [peers, setPeers] = useState<PeerMentee[]>([])

  useEffect(() => {
    if (!isSupabaseConfigured || email === null || id === null) return

    let cancelled = false
    fetchMyPeers(email, id)
      .then((list) => {
        if (!cancelled) setPeers(list)
      })
      .catch(() => {
        if (!cancelled) setPeers([])
      })

    return () => {
      cancelled = true
    }
  }, [email, id])

  return peers
}
