'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { api } from '@/lib/api'
import type { HiringManager } from '@hiresignal/shared'

const LINKEDIN_PATTERNS = [
  { label: 'Direct intent', query: '"I\'m hiring" OR "looking for a" OR "open role"' },
  { label: 'Call to action', query: '"DM me" OR "send your resume" OR "drop your portfolio"' },
  { label: 'Team growth', query: '"growing the team" OR "excited to announce" OR "just opened a req"' },
]

export default function OutreachPage() {
  const [jobId, setJobId] = useState('')
  const [managerName, setManagerName] = useState('')
  const [achievement, setAchievement] = useState('')
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [jobs, setJobs] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)

  const [managers, setManagers] = useState<HiringManager[]>([])
  const [managersLoading, setManagersLoading] = useState(false)
  const [managersError, setManagersError] = useState('')
  const [selectedManagerId, setSelectedManagerId] = useState('')

  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then((res: any) => setUser(res.data?.user))
    api.getJobs({ limit: 50 }).then(r => setJobs(r.jobs))
  }, [])

  // Auto-load existing managers whenever the selected job changes
  useEffect(() => {
    if (!jobId) return
    api.getHiringManagers(jobId)
      .then(r => setManagers(r.managers))
      .catch(() => {/* silently ignore – user can trigger discovery manually */ })
  }, [jobId])

  function handleJobChange(newJobId: string) {
    setJobId(newJobId)
    setManagers([])
    setManagersError('')
    setSelectedManagerId('')
  }

  async function findManagers() {
    if (!user || !jobId) return
    setManagersLoading(true)
    setManagersError('')
    try {
      const r = await api.discoverHiringManagers(jobId, user.id)
      setManagers(r.managers)
    } catch (e: any) {
      setManagersError(e.message)
    }
    setManagersLoading(false)
  }

  function selectManager(manager: HiringManager) {
    setSelectedManagerId(manager.id)
    // Pre-fill with first name only (most DMs use first name).
    // Uses the first space-separated token; works for the majority of Western names.
    const firstName = manager.name?.split(' ')[0] ?? ''
    setManagerName(firstName)
  }

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
              <select value={jobId} onChange={e => handleJobChange(e.target.value)}
                className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3.5 text-brand-text focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all appearance-none cursor-pointer shadow-inner">
                <option value="">Select an active signal...</option>
                {jobs.map((j: any) => (
                  <option key={j.id} value={j.id}>{j.title} — {j.company}</option>
                ))}
              </select>
            </div>

            {/* Hiring manager discovery panel */}
            {jobId && (
              <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-brand-text uppercase tracking-wide">Hiring Managers</span>
                  <button
                    onClick={findManagers}
                    disabled={managersLoading}
                    className="text-xs font-bold px-4 py-2 bg-brand-surface-high border border-brand-border hover:bg-brand-surface-highest hover:text-brand-primary rounded-xl transition-all flex items-center gap-2 disabled:opacity-50">
                    {managersLoading
                      ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" /> Discovering...</>
                      : '🔍 Find Hiring Managers'}
                  </button>
                </div>

                {managersError && (
                  <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">{managersError}</p>
                )}

                {managers.length > 0 ? (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {managers.map(m => (
                      <div
                        key={m.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${selectedManagerId === m.id
                            ? 'border-brand-primary bg-brand-primary/10'
                            : 'border-brand-border bg-black/20 hover:border-brand-primary/50'
                          }`}
                        onClick={() => selectManager(m)}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-brand-text truncate">
                            {m.name ?? <span className="italic text-brand-text-muted">Unknown name</span>}
                          </p>
                          <p className="text-xs text-brand-text-muted truncate">{m.title} · {m.company}</p>
                        </div>
                        {m.linkedin_url && (
                          <a
                            href={m.linkedin_url}
                            target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-xs font-bold px-2.5 py-1 border border-brand-border rounded-lg hover:text-brand-primary transition-colors shrink-0">
                            ↗
                          </a>
                        )}
                        {selectedManagerId === m.id && (
                          <span className="text-brand-primary text-xs font-bold shrink-0">✓ Selected</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  !managersLoading && (
                    <p className="text-xs text-brand-text-muted">
                      No managers discovered yet — click <strong>Find Hiring Managers</strong> to search LinkedIn.
                    </p>
                  )
                )}
              </div>
            )}

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

