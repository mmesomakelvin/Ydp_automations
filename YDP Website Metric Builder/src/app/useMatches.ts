import { useEffect, useState } from 'react'
import { isSupabaseConfigured } from '@/lib/supabase'
import { fetchAllMatches, InvalidPasswordError, type MatchRow } from '@/lib/matches'

export interface MatchesState {
  rows: MatchRow[] | null
  loading: boolean
  error: Error | null
  /** True when the password was rejected, so the caller can re-prompt. */
  unauthorized: boolean
  /** True when Supabase credentials are present (i.e. live data). */
  configured: boolean
}

/**
 * Loads all match rows from Supabase using the site password. When Supabase
 * isn't configured, returns `configured: false` so callers can fall back to
 * bundled sample data.
 */
export function useMatches(password: string | null): MatchesState {
  const [rows, setRows] = useState<MatchRow[] | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured && password !== null)
  const [error, setError] = useState<Error | null>(null)
  const [unauthorized, setUnauthorized] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured || password === null) return

    let cancelled = false
    setLoading(true)
    setUnauthorized(false)
    setError(null)

    fetchAllMatches(password)
      .then((data) => {
        if (!cancelled) setRows(data)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        if (e instanceof InvalidPasswordError) {
          setUnauthorized(true)
          setRows(null)
        } else {
          setError(e instanceof Error ? e : new Error(String(e)))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [password])

  return { rows, loading, error, unauthorized, configured: isSupabaseConfigured }
}
