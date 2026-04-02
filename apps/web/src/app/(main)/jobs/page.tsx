'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { getCachedUser } from '@/lib/supabase'

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [tailoring, setTailoring] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [search, setSearch] = useState('')
  const router = useRouter()

  useEffect(() => {
    async function init() {
      try {
        const { data } = await getCachedUser()
        const u = data?.user
        setUser(u)
        const r = await api.getJobs({ limit: 30, user_id: u?.id })
        const loadedJobs = r.jobs || []
        setJobs(loadedJobs)

        // Auto-scan if the user is logged in but no cached jobs exist yet
        if (u && loadedJobs.length === 0) {
          setScanning(true)
          try {
            await api.scanJobs(u.id)
            const r2 = await api.getJobs({ limit: 30, user_id: u.id })
            setJobs(r2.jobs || [])
          } catch (e) {
            console.error('[jobs] auto-scan failed:', e)
          } finally {
            setScanning(false)
          }
        }
      } catch (e) {
        console.error('[jobs] init failed:', e)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const filtered = jobs.filter(j =>
    !search || j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.company.toLowerCase().includes(search.toLowerCase())
  )

  async function handleTailor(jobId: string) {
    if (!user) { router.push('/login'); return }
    setTailoring(jobId)
    try {
      const r = await api.tailorResume(jobId, user.id, true)
      if (r.doc_url) window.open(r.doc_url, '_blank')
      else router.push('/pipeline')
    } catch (e: any) {
      alert(e.message || 'Tailoring failed. Check your settings.')
    }
    setTailoring(null)
  }

  async function handleScanJobs() {
    if (!user) { router.push('/login'); return }
    setScanning(true)
    try {
      await api.scanJobs(user.id)
      const r = await api.getJobs({ limit: 30 })
      setJobs(r.jobs)
    } catch (e: any) {
      alert(e.message || 'Job scan failed.')
    }
    setScanning(false)
  }

  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-semibold mb-2 text-brand-text tracking-tight flex items-center gap-3">
            Signal Matches <span className="opacity-80">💼</span>
          </h1>
          <div className="flex items-center gap-4">
            <p className="text-brand-text-muted text-lg">Fresh high-intent listings posted in the last 24 hours.</p>
            <button
              onClick={handleScanJobs}
              disabled={scanning}
              className="text-xs px-3 py-1.5 rounded-lg border border-brand-primary/50 text-brand-primary hover:bg-brand-primary/10 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {scanning ? 'Scraping...' : '↻ Force Scan'}
            </button>
          </div>
        </div>
        <div className="relative w-full md:w-80 group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-brand-text-muted group-focus-within:text-brand-primary transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search role or company..."
            className="w-full bg-brand-surface-low border border-brand-border rounded-2xl py-3 pl-12 pr-4 text-brand-text placeholder-brand-text-muted focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/50 transition-all shadow-inner"
          />
        </div>
      </header>

      {loading ? (
        <div className="flex items-center gap-3 text-brand-primary animate-pulse mt-8">
          <div className="w-5 h-5 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
          <span className="font-medium tracking-wide text-sm uppercase">Syncing latest listings...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-3xl p-10 text-center max-w-lg mx-auto mt-12">
          <p className="text-brand-text-muted text-lg">No matches found.</p>
          <p className="text-sm mt-2 text-brand-text-muted/60">Try adjusting your search or scan the network for fresh matches.</p>

          <button
            onClick={handleScanJobs}
            disabled={scanning}
            className="mt-6 btn-primary px-6 py-2.5 text-sm font-medium flex items-center gap-2 mx-auto disabled:opacity-60"
          >
            {scanning ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                Scraping LinkedIn...
              </>
            ) : (
              '⚡ Scan Jobs Now'
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((job: any) => (
            <div key={job.id} className="glass-card rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:bg-brand-surface-highest transition-all duration-300 hover:shadow-[0_10px_30px_rgba(204,151,255,0.05)] border border-brand-border">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <a href={job.url} target="_blank" rel="noopener noreferrer"
                    className="text-xl font-bold text-brand-text hover:text-brand-primary transition-colors tracking-tight">
                    {job.title}
                  </a>
                  {job.remote && <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider backdrop-blur-md">Remote</span>}
                </div>

                <p className="text-base text-brand-text-muted font-medium flex items-center gap-2">
                  <span className="text-brand-text">{job.company}</span>
                  <span className="opacity-50">•</span>
                  <span>{job.location || 'Global/Remote'}</span>
                </p>

                {job.signal_id && (
                  <div className="mt-3 inline-flex items-center gap-1.5 text-xs bg-brand-primary/10 text-brand-primary border border-brand-primary/20 px-3 py-1.5 rounded-full font-bold uppercase tracking-widest backdrop-blur-md">
                    <span className="text-amber-400">⚡</span> Pre-signal detected
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <a href={job.url} target="_blank" rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-brand-text bg-brand-surface-low border border-brand-border hover:bg-brand-surface transition-colors shadow-sm">
                  View Job
                </a>
                <button onClick={() => handleTailor(job.id)}
                  disabled={tailoring === job.id}
                  className="btn-primary px-6 py-2.5 rounded-xl text-sm flex items-center gap-2">
                  {tailoring === job.id ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-[#1a0033] border-t-transparent animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Tailor Resume ✨'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}