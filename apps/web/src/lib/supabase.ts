import { createBrowserClient } from '@supabase/ssr'

const globalForSupabase = globalThis as typeof globalThis & {
  __hs_supabase_client__?: ReturnType<typeof createBrowserClient>
}

export function createClient() {
  if (!globalForSupabase.__hs_supabase_client__) {
    globalForSupabase.__hs_supabase_client__ = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  return globalForSupabase.__hs_supabase_client__
}
