'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { createClient } from '@/lib/supabase'

const TYPE_LABELS: Record<string, string> = {
  funding_round: '💰 Funding Round',
  headcount_growth: '📈 Team Growth',
  github_spike: '⚡ GitHub Spike',
  glassdoor_review: '⭐ Glassdoor Surge',
  exec_hire: '👔 Executive Hire',
  product_launch: '🚀 Product Launch',
}

export default function RadarPage() {
  const [signals, setSignals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [hasWatchlist, setHasWatchlist] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from('profiles').select('watchlist').eq('id', data.user.id).single()
          .then(({ data: p }) => {
            if (p && p.watchlist && p.watchlist.length > 0) {
              setHasWatchlist(true)
            }
          })
      }
    })

    api.getSignals(40).then(r => { setSignals(r.signals); setLoading(false) })
  }, [])

  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-10">
        <h1 className="text-4xl font-semibold mb-2 text-brand-text tracking-tight flex items-center gap-3">
          Hiring Radar <span className="text-3xl">📡</span>
        </h1>
        <p className="text-brand-text-muted text-lg max-w-2xl">
          Companies showing pre-posting signals. Get in before the job goes live. Active scanning intelligence enabled.
        </p>
      </header>

      {loading ? (
        <div className="flex items-center gap-3 text-brand-primary animate-pulse">
          <div className="w-5 h-5 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
          <span className="font-medium tracking-wide text-sm uppercase">Scanning signals network...</span>
        </div>
      ) : signals.length === 0 ? (
        <div className="glass-card rounded-3xl p-10 text-center max-w-lg mx-auto mt-20">
          <p className="text-brand-text-muted text-lg">No signals detected yet.</p>
          {hasWatchlist ? (
            <p className="text-sm mt-2 text-brand-text-muted/60">We're actively scanning the network for your tuned watchlist. Check back soon.</p>
          ) : (
            <p className="text-sm mt-2 text-brand-text-muted/60">Add companies to your watchlist in settings to calibrate the radar.</p>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {signals.map((s: any) => (
            <div key={s.id}
              className="glass-card rounded-3xl p-6 flex items-start justify-between group hover:bg-brand-surface-highest transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_10px_30px_rgba(204,151,255,0.05)] border border-brand-border">
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl bg-brand-surface flex items-center justify-center text-2xl font-bold text-brand-text shadow-inner border border-brand-border/50 group-hover:border-brand-primary/30 transition-colors">
                  {s.company.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="font-semibold text-xl text-brand-text tracking-tight">{s.company}</span>
                    <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider backdrop-blur-md border pl-2 pr-3 flex items-center gap-1.5
                      ${s.signal_score >= 80 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        s.signal_score >= 60 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-brand-primary/10 text-brand-primary border-brand-primary/20'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse opacity-80" />
                      Score {s.signal_score}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-brand-text/90 flex items-center gap-2">
                    {TYPE_LABELS[s.signal_type] || s.signal_type.replace(/_/g, ' ')}
                  </p>
                  {s.headline && <p className="text-sm text-brand-text-muted mt-2 leading-relaxed">{s.headline}</p>}
                </div>
              </div>

              <div className="flex flex-col items-end justify-between self-stretch">
                {s.source_url && (
                  <a href={s.source_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-medium text-brand-primary hover:text-brand-primary-dim bg-brand-primary/5 hover:bg-brand-primary/10 px-4 py-2 rounded-xl transition-colors whitespace-nowrap">
                    Source Link ↗
                  </a>
                )}
                {s.created_at && (
                  <span className="text-xs text-brand-text-muted/50 font-medium tracking-wider uppercase mt-4">
                    {new Date(s.created_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
