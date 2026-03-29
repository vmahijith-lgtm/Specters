import { createServerClient } from '@supabase/ssr'
console.log(createServerClient('http://localhost', 'anon', { cookies: { getAll: () => [], setAll: () => {} } }).auth)
