import { useEffect, useState } from 'react'
import { isSupabaseConfigured } from '@/lib/supabase'
import {
  fetchMyMatches,
  InvalidPasswordError,
  toParticipantView,
  type ParticipantView,
} from '@/lib/matches'

export interface MyMatchesState {
  view: ParticipantView | null
  loading: boolean
  error: Error | null
  /** True when the participant password was rejected. */
  unauthorized: boolean
  /** True when the password was accepted but no match exists for the email. */
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
 * Loads only the logged-in participant's own match, using their email and the
 * shared participant password. A rejected password sets `unauthorized`; a valid
 * password with no matching row sets `notFound` (a different, gentler message).
 */
export function useMyMatches(
  email: string | null,
  password: string | null,
): MyMatchesState {
  const ready = isSupabaseConfigured && email !== null && password !== null
  const [view, setView] = useState<ParticipantView | null>(null)
  const [loading, setLoading] = useState(ready)
  const [error, setError] = useState<Error | null>(null)
  const [unauthorized, setUnauthorized] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured || email === null || password === null) return

    let cancelled = false
    setLoading(true)
    setUnauthorized(false)
    setNotFound(false)
    setError(null)

    fetchMyMatches(password, email)
      .then((rows) => {
        if (cancelled) return
        const model = toParticipantView(rows, email)
        setView(model)
        setNotFound(model === null)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        if (e instanceof InvalidPasswordError) {
          setUnauthorized(true)
          setView(null)
        } else {
          setError(toError(e))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [email, password])

  return {
    view,
    loading,
    error,
    unauthorized,
    notFound,
    configured: isSupabaseConfigured,
  }
}
