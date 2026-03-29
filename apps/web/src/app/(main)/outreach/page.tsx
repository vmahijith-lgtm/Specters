'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { api } from '@/lib/api'

const LINKEDIN_PATTERNS = [
  { label: 'Direct intent',  query: '"I\'m hiring" OR "looking for a" OR "open role"' },
  { label: 'Call to action', query: '"DM me" OR "send your resume" OR "drop your portfolio"' },
  { label: 'Team growth',    query: '"growing the team" OR "excited to announce" OR "just opened a req"' },
]

export default function OutreachPage() {
  const [jobId, setJobId]         = useState('')
  const [managerName, setManagerName] = useState('')
  const [achievement, setAchievement] = useState('')
  const [draft, setDraft]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [jobs, setJobs]           = useState<any[]>([])
  const [user, setUser]           = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    api.getJobs({ limit: 50 }).then(r => setJobs(r.jobs))
  }, [])

  async function generateDraft() {
    if (!user || !jobId) return
    setLoading(true)
    try {
      const r = await api.draftOutreach(jobId, user.id, managerName, achievement)
      setDraft(r.draft)
    } catch (e: any) {
      alert(e.message)
    }
    setLoading(false)
  }

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <header className="mb-10">
        <h1 className="text-4xl font-semibold mb-2 text-brand-text tracking-tight flex items-center gap-3">
          Outreach <span className="opacity-80">✉️</span>
        </h1>
        <p className="text-brand-text-muted text-lg">
          Draft a direct message to the hiring manager. 10x more effective than Easy Apply.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LinkedIn search patterns */}
        <div className="glass-card rounded-3xl p-8 border border-brand-border shadow-[0_10px_40px_rgba(0,0,0,0.5)] order-2 lg:order-1">
          <h2 className="font-bold text-xl text-brand-text mb-6">Find Hiring Managers on LinkedIn</h2>
          <div className="space-y-4">
            {LINKEDIN_PATTERNS.map(p => (
              <div key={p.label} className="bg-brand-surface border border-brand-border p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-4 group hover:border-brand-primary/50 transition-colors shadow-inner">
                <span className="text-sm font-bold text-brand-text uppercase tracking-wider w-32 shrink-0">{p.label}</span>
                <code className="text-xs bg-black/40 border border-[#1a0033] rounded-lg px-3 py-2 flex-1 font-mono text-brand-primary/90 break-all">
                  {p.query}
                </code>
                <a
                  href={`https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(p.query)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs font-bold px-4 py-2 bg-brand-surface-high border border-brand-border hover:bg-brand-surface-highest hover:text-brand-primary rounded-xl transition-all whitespace-nowrap shrink-0">
                  Search ↗
                </a>
              </div>
            ))}
          </div>
          
           <div className="mt-8 pt-6 border-t border-brand-border text-sm text-brand-text-muted">
             <span className="text-amber-400 mr-2">💡</span>
             Use these semantic search vectors to surface high-affinity social signals directly on LinkedIn.
           </div>
        </div>

        {/* DM generator */}
        <div className="glass-card rounded-3xl p-8 border border-brand-border shadow-[0_10px_40px_rgba(0,0,0,0.5)] order-1 lg:order-2">
          <h2 className="font-bold text-xl text-brand-text mb-6">Generate Personalized DM</h2>
          <div className="space-y-5">
            <div>
              <label className="text-sm font-bold text-brand-text block mb-2 uppercase tracking-wide">Target Role</label>
              <select value={jobId} onChange={e => setJobId(e.target.value)}
                className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3.5 text-brand-text focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all appearance-none cursor-pointer shadow-inner">
                <option value="">Select an active signal...</option>
                {jobs.map((j: any) => (
                  <option key={j.id} value={j.id}>{j.title} — {j.company}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-sm font-bold text-brand-text block mb-2 uppercase tracking-wide">Hiring Manager First Name</label>
              <input value={managerName} onChange={e => setManagerName(e.target.value)}
                placeholder="e.g. Sarah"
                className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3.5 text-brand-text placeholder-brand-text-muted/50 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all shadow-inner" />
            </div>
            
            <div>
              <label className="text-sm font-bold text-brand-text block mb-2 uppercase tracking-wide">Core Achievement (1 Sentence)</label>
              <input value={achievement} onChange={e => setAchievement(e.target.value)}
                placeholder="e.g. Scaled infrastructure to 1M daily active users"
                className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3.5 text-brand-text placeholder-brand-text-muted/50 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all shadow-inner" />
            </div>
            
            <button onClick={generateDraft} disabled={loading || !jobId}
              className="btn-primary w-full px-6 py-4 text-base flex items-center justify-center gap-2 mt-4">
              {loading ? (
                <><span className="w-5 h-5 rounded-full border-2 border-[#1a0033] border-t-transparent animate-spin" /> Synthesizing...</>
              ) : (
                'Generate Outreach Draft ⚡'
              )}
            </button>
          </div>

          {draft && (
            <div className="mt-8 p-6 bg-brand-surface border border-brand-border rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary" />
              <div className="flex justify-between items-center mb-4">
                <p className="text-xs font-bold text-brand-primary uppercase tracking-widest">Target Generated</p>
                <button onClick={() => navigator.clipboard.writeText(draft)}
                  className="text-xs font-bold text-brand-text bg-brand-surface-high hover:bg-brand-surface-highest border border-brand-border px-3 py-1.5 rounded-lg transition-colors">
                  Copy Text
                </button>
              </div>
              <p className="text-base text-brand-text whitespace-pre-wrap leading-relaxed">
                {draft}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
