import { useEffect, useState } from 'react'
import { isSupabaseConfigured } from '@/lib/supabase'
import { fetchAllMatches, type MatchRow } from '@/lib/matches'

export interface MatchesState {
  rows: MatchRow[] | null
  loading: boolean
  error: Error | null
  /** True when Supabase credentials are present (i.e. live data). */
  configured: boolean
}

/**
 * Loads all match rows from Supabase. When Supabase isn't configured, returns
 * `configured: false` so callers can fall back to bundled sample data.
 */
export function useMatches(): MatchesState {
  const [rows, setRows] = useState<MatchRow[] | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) return

    let cancelled = false
    setLoading(true)
    fetchAllMatches()
      .then((data) => {
        if (!cancelled) setRows(data)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { rows, loading, error, configured: isSupabaseConfigured }
}
