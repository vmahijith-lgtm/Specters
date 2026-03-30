'use client'
import { useEffect, useState } from 'react'
import { createClient, getCachedUser } from '@/lib/supabase'
import { api } from '@/lib/api'

const COLUMNS = ['saved', 'applied', 'interviewing', 'offer', 'rejected']
const COL_STYLE: Record<string, string> = {
  saved: 'bg-blue-500/5   border-blue-500/20   text-blue-400',
  applied: 'bg-brand-primary/5 border-brand-primary/20 text-brand-primary',
  interviewing: 'bg-amber-500/5  border-amber-500/20  text-amber-400',
  offer: 'bg-emerald-500/5  border-emerald-500/20  text-emerald-400',
  rejected: 'bg-rose-500/5   border-rose-500/20   text-rose-400',
}

export default function PipelinePage() {
  const [pipeline, setPipeline] = useState<any>({})
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    getCachedUser().then((res: any) => {
      setUser(res.data?.user)
      if (res.data?.user) {
        api.getPipeline(res.data.user.id).then(setPipeline)
      }
    })
  }, [])

  async function moveCard(jobId: string, newStatus: string) {
    if (!user) return
    await api.updateStatus(user.id, jobId, newStatus)
    const updated = await api.getPipeline(user.id)
    setPipeline(updated)
  }

  return (
    <div className="animate-in fade-in duration-500 h-[calc(100vh-4rem)] flex flex-col">
      <header className="mb-8 shrink-0">
        <h1 className="text-4xl font-semibold mb-2 text-brand-text tracking-tight flex items-center gap-3">
          Pipeline <span className="opacity-80">🔀</span>
        </h1>
        <p className="text-brand-text-muted text-lg">Track every application from saved to offer.</p>
      </header>

      <div className="flex gap-6 overflow-x-auto pb-8 flex-1 items-start">
        {COLUMNS.map(status => (
          <div key={status} className={`rounded-3xl border p-5 w-80 flex-shrink-0 flex flex-col max-h-full ${COL_STYLE[status]} backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.5)]`}>
            <div className="flex items-center justify-between mb-5 px-1 shrink-0">
              <h3 className="text-sm font-bold uppercase tracking-widest">{status}</h3>
              <span className="text-xs font-bold py-1 px-2.5 rounded-full bg-black/40 border border-current opacity-80 backdrop-blur-md">
                {(pipeline[status] || []).length}
              </span>
            </div>

            <div className="space-y-4 overflow-y-auto pr-2 pb-4 flex-1">
              {(pipeline[status] || []).map((uj: any) => (
                <div key={uj.id} className="solid-card rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(0,0,0,0.6)] group shadow-md border-brand-border/50 bg-[#16161d]">
                  <p className="text-lg font-bold text-brand-text leading-tight mb-1">{uj.jobs?.title}</p>
                  <p className="text-sm text-brand-text-muted font-medium mb-3">{uj.jobs?.company}</p>

                  {uj.response_probability != null && (
                    <div className="inline-flex items-center gap-1.5 text-xs bg-brand-primary/10 text-brand-primary border border-brand-primary/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider backdrop-blur-md mb-2">
                      Match: {uj.response_probability}%
                    </div>
                  )}

                  {uj.tailored_resume_url ? (
                    <a href={uj.tailored_resume_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-medium text-brand-secondary hover:text-brand-primary block mb-3 transition-colors">
                      Download tailored LaTeX (.tex) ↓
                    </a>
                  ) : uj.tailored_resume_text && (
                    <button onClick={() => {
                      const blob = new Blob([uj.tailored_resume_text], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `Tailored_Resume_${uj.jobs?.company || 'Job'}.tex`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                      className="text-xs font-medium text-brand-secondary hover:text-brand-primary block mb-3 transition-colors text-left">
                      Download tailored LaTeX (.tex) ↓
                    </button>
                  )}

                  <div className="pt-4 mt-2 border-t border-brand-border/50 flex flex-wrap gap-2">
                    {COLUMNS.filter(s => s !== status).map(s => (
                      <button key={s} onClick={() => moveCard(uj.job_id, s)}
                        className="text-[11px] font-bold uppercase tracking-wider border border-brand-border/50 bg-brand-surface text-brand-text-muted hover:text-brand-text hover:bg-brand-surface-high hover:border-brand-border px-3 py-1.5 rounded-xl transition-colors">
                        → {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {(pipeline[status] || []).length === 0 && (
                <div className="text-center p-8 border-2 border-dashed border-current/20 rounded-2xl opacity-50">
                  <p className="text-sm font-bold uppercase tracking-widest">Empty</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
