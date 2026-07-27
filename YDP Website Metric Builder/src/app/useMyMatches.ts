import { useEffect, useState } from 'react'
import { isSupabaseConfigured } from '@/lib/supabase'
import {
  fetchMyMatches,
  toParticipantView,
  type ParticipantView,
} from '@/lib/matches'

export interface MyMatchesState {
  view: ParticipantView | null
  loading: boolean
  error: Error | null
  /** True when the email + ID didn't match any row (wrong details, or not matched yet). */
  notFound: boolean
  configured: boolean
}

function toError(e: unknown): Error {
  if (e instanceof Error) return e
  if (e && typeof e === 'object' && 'message' in e) {
    const { message, hint } = e as { message?: unknown; hint?: unknown }
    return new Error(
      [message, hint].filter((v) => typeof v === 'string' && v).join(' — ') ||
        'Unknown error',
    )
  }
  return new Error(String(e))
}

/**
 * Loads only the logged-in participant's own match, using their email and their
 * mentee/mentor ID. There is no password: the email+ID pair is the credential,
 * checked in the database. When they don't match any row, `notFound` is set.
 */
export function useMyMatches(
  email: string | null,
  id: string | null,
): MyMatchesState {
  const ready = isSupabaseConfigured && email !== null && id !== null
  const [view, setView] = useState<ParticipantView | null>(null)
  const [loading, setLoading] = useState(ready)
  const [error, setError] = useState<Error | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured || email === null || id === null) return

    let cancelled = false
    setLoading(true)
    setNotFound(false)
    setError(null)

    fetchMyMatches(email, id)
      .then((rows) => {
        if (cancelled) return
        const model = toParticipantView(rows, email)
        setView(model)
        setNotFound(model === null)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(toError(e))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [email, id])

  return {
    view,
    loading,
    error,
    notFound,
    configured: isSupabaseConfigured,
  }
}
