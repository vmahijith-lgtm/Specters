import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: signals } = await supabase.from('signals').select('*').order('signal_score', { ascending: false }).limit(3)
  const { data: userJobs } = await supabase.from('user_jobs').select('*, jobs(*)').eq('user_id', user.id).limit(5)

  const statusCounts = (userJobs || []).reduce((acc: any, uj: any) => {
    acc[uj.status] = (acc[uj.status] || 0) + 1
    return acc
  }, {})

  let displayName = ''
  if (profile?.full_name) {
    displayName = profile.full_name.includes('@') 
      ? profile.full_name.split('@')[0] 
      : profile.full_name.split(' ')[0]
  } else if (user.email) {
    displayName = user.email.split('@')[0]
  }

  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-10">
        <h1 className="text-4xl font-semibold mb-2 text-brand-text tracking-tight">
          Good morning{displayName ? `, ${displayName}` : ''} <span className="opacity-80">👋</span>
        </h1>
        <p className="text-brand-text-muted text-lg">Here's your hiring intelligence briefing.</p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6 mb-12">
        {[
          { label: 'Saved',        value: statusCounts['saved'] || 0,        accent: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/20' },
          { label: 'Applied',      value: statusCounts['applied'] || 0,      accent: 'from-brand-secondary to-brand-secondary-dim', shadow: 'shadow-brand-secondary/20' },
          { label: 'Interviewing', value: statusCounts['interviewing'] || 0, accent: 'from-amber-400 to-amber-600', shadow: 'shadow-amber-500/20' },
          { label: 'Offers',       value: statusCounts['offer'] || 0,        accent: 'from-emerald-400 to-emerald-600', shadow: 'shadow-emerald-500/20' },
        ].map(({ label, value, accent, shadow }) => (
          <div key={label} className="solid-card rounded-3xl p-6 relative overflow-hidden group transition-all duration-300 hover:scale-[1.02] hover:bg-brand-surface-highest">
            <div className={`absolute -inset-0 bg-gradient-to-br ${accent} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300`} />
            <div className={`w-12 h-12 rounded-2xl mb-4 bg-gradient-to-br ${accent} flex items-center justify-center text-white/90 shadow-lg ${shadow}`}>
               <span className="font-bold text-xl">{value}</span>
            </div>
            <p className="text-3xl font-bold text-brand-text mb-1">{value}</p>
            <p className="text-sm font-medium text-brand-text-muted uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      {/* Setup nudge */}
      {!profile?.base_resume && (
        <div className="relative overflow-hidden border border-amber-500/30 bg-amber-500/5 rounded-3xl p-8 mb-12 backdrop-blur-md shadow-[0_0_30px_rgba(245,158,11,0.05)]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-600 opacity-50" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xl font-bold text-amber-500 mb-2 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Accelerate your pipeline
              </p>
              <p className="text-brand-text-muted max-w-xl text-base leading-relaxed">
                Connect your resume and OpenAI API key to automatically tailor applications and unlock AI-driven job matches.
              </p>
            </div>
            <a href="/settings" className="btn-primary px-6 py-3 shrink-0 flex items-center gap-2 shadow-amber-500/20">
              Complete setup →
            </a>
          </div>
        </div>
      )}

      {/* Top signals */}
      {signals && signals.length > 0 && (
        <section className="mb-12">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-brand-text">Active Hiring Signals</h2>
              <p className="text-brand-text-muted text-sm mt-1">Companies showing high-growth indicators 48h before posting.</p>
            </div>
            <a href="/radar" className="text-sm font-medium text-brand-primary hover:text-brand-primary-dim transition-colors mb-1">View Radar →</a>
          </div>
          <div className="space-y-4">
            {signals.map((s: any) => (
              <div key={s.id} className="glass-card rounded-3xl p-5 flex items-center justify-between group hover:bg-brand-surface-highest transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-center text-lg font-bold text-brand-text shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                    {s.company.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-lg text-brand-text">{s.company}</p>
                    <p className="text-sm text-brand-primary font-medium mt-0.5 tracking-wide">{s.signal_type.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 backdrop-blur-sm text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-widest">
                    Score {s.signal_score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
