import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Ensure profile exists in database on every entry (auto-sync)
  const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single()
  if (!profile) {
    const derivedName = user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : 'User')
    await supabase.from('profiles').insert([
      { id: user.id, full_name: derivedName }
    ])
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 max-w-5xl">{children}</main>
    </div>
  )
}
