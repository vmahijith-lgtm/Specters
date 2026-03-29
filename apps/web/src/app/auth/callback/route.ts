import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch {}
          },
        },
      }
    )
    const { data } = await supabase.auth.exchangeCodeForSession(code)
    if (data.user) {
      // Upsert profile on first login via callback
      const derivedName = data.user.user_metadata?.full_name || (data.user.email ? data.user.email.split('@')[0] : 'User')
      await supabase.from('profiles').upsert(
        { id: data.user.id, full_name: derivedName },
        { onConflict: 'id', ignoreDuplicates: true }
      )
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
