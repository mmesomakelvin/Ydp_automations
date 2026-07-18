import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** True when both Supabase env vars are present. */
export const isSupabaseConfigured = Boolean(url && anonKey)

/**
 * Shared Supabase client, or null when the app isn't configured yet.
 * Callers should check `isSupabaseConfigured` (or handle null) so the app
 * degrades gracefully to sample data before credentials are set.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string)
  : null
