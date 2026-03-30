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

// Deduplicate concurrent user fetches to prevent Supabase lock stealing
let userPromise: Promise<any> | null = null;
let lastUserFetchTime = 0;

export function getCachedUser(): Promise<any> {
  const now = Date.now()
  if (userPromise && (now - lastUserFetchTime < 2000)) {
    return userPromise;
  }
  const client = createClient()
  userPromise = client.auth.getUser().catch((err: any) => {
    userPromise = null;
    throw err;
  });
  lastUserFetchTime = now;
  return userPromise as Promise<any>;
}
