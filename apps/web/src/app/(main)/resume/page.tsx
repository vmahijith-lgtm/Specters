'use client'
import { useState, useEffect } from 'react'
import { createClient, getCachedUser } from '@/lib/supabase'
import { api } from '@/lib/api'

export default function ResumePage() {
  const [resumeText, setResumeText] = useState('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [tailoredResumes, setTailoredResumes] = useState<any[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    getCachedUser().then((res: any) => {
      setUser(res.data?.user)
      if (res.data?.user) {
        supabase.from('profiles').select('base_resume').eq('id', res.data.user.id).single()
          .then(({ data: p }: any) => { if (p?.base_resume) setResumeText(p.base_resume) })

        supabase.from('user_jobs')
          .select('id, tailored_resume_text, jobs(title, company)')
          .eq('user_id', res.data.user.id)
          .not('tailored_resume_text', 'is', null)
          .then(({ data }: any) => {
            if (data) setTailoredResumes(data)
          })
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function saveResume() {
    if (!user || !resumeText.trim()) return
    setLoading(true)
    await api.uploadResume(user.id, resumeText)
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const selectedData = tailoredResumes.find(r => r.id === selectedResumeId)

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <header className="mb-10">
        <h1 className="text-4xl font-semibold mb-2 text-brand-text tracking-tight flex items-center gap-3">
          Resume Lab <span className="opacity-80">📄</span>
        </h1>
        <p className="text-brand-text-muted text-lg">
          Manage your base resume and retrieve AI-tailored LaTeX.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2">
          <div className="glass-card rounded-3xl p-8 border border-brand-border shadow-[0_10px_40px_rgba(0,0,0,0.5)] h-full">
            <label className="block text-sm font-bold text-brand-text mb-4 uppercase tracking-wide">Your Base Resume (Plain Text)</label>
            <textarea
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
              rows={15}
              placeholder="Paste the full text of your resume here. Include all experience, skills, and education."
              className="w-full bg-brand-surface-low border border-brand-border rounded-2xl p-5 text-sm font-mono text-brand-text placeholder-brand-text-muted/50 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all resize-y shadow-inner leading-relaxed styling-scrollbar"
            />
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-brand-text-muted font-medium bg-brand-surface px-3 py-1.5 rounded-lg border border-brand-border">
                {resumeText.length.toLocaleString()} characters
              </p>
              <button onClick={saveResume} disabled={loading || !resumeText.trim()}
                className={`btn-primary px-8 py-3.5 text-base flex items-center justify-center gap-2 ${saved ? '!bg-emerald-500 !shadow-emerald-500/20' : ''}`}>
                {loading ? (
                  <><span className="w-5 h-5 rounded-full border-2 border-[#1a0033] border-t-transparent animate-spin" /> Saving...</>
                ) : saved ? (
                  '✓ Resume Saved'
                ) : (
                  'Save Resume Matrix'
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="relative overflow-hidden border border-brand-primary/30 bg-brand-primary/5 rounded-3xl p-8 backdrop-blur-md shadow-[0_0_30px_rgba(204,151,255,0.05)] h-full">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary to-brand-primary-dim opacity-50" />
            <h3 className="font-bold text-xl text-brand-primary mb-4 flex items-center gap-2">
              <span className="text-2xl">✨</span> How Tailoring Works
            </h3>
            <ol className="text-brand-text-muted space-y-4 list-decimal list-outside ml-4 font-medium leading-relaxed">
              <li className="pl-2">You save your comprehensive base resume here.</li>
              <li className="pl-2">On the <span className="text-brand-text">Jobs</span> page, click "Tailor resume" on any listing.</li>
              <li className="pl-2">AI automatically rewrites your resume strictly into perfect LaTeX syntax making you ATS ready.</li>
              <li className="pl-2">Copy the generated output below and compile it instantly in Overleaf.</li>
            </ol>
            <div className="mt-8 pt-6 border-t border-brand-primary/20">
              <p className="text-xs text-brand-primary font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-primary animate-ping" />
                Raw LaTeX Generation Active
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-8 border border-brand-border shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3 text-brand-text">
          Generated Tailored Resumes <span className="opacity-80">⚛️</span>
        </h2>

        {tailoredResumes.length === 0 ? (
          <div className="text-center p-10 border-2 border-dashed border-brand-border/50 rounded-2xl">
            <p className="text-brand-text-muted font-medium">You haven't tailored any resumes yet. Start tailoring from the Jobs page!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 space-y-3 max-h-[600px] overflow-y-auto pr-2 styling-scrollbar">
              {tailoredResumes.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedResumeId(r.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedResumeId === r.id
                      ? 'bg-brand-primary/10 border-brand-primary text-brand-primary shadow-[0_0_15px_rgba(204,151,255,0.15)]'
                      : 'bg-brand-surface-low border-brand-border text-brand-text-muted hover:border-brand-primary/50'
                    }`}
                >
                  <p className="font-bold truncate text-sm mb-1">{r.jobs?.company || 'Unknown Company'}</p>
                  <p className="text-xs opacity-70 truncate">{r.jobs?.title || 'Unknown Role'}</p>
                </button>
              ))}
            </div>

            <div className="lg:col-span-3">
              {selectedData ? (
                <div className="bg-brand-surface-low border border-brand-border rounded-2xl overflow-hidden flex flex-col h-[600px]">
                  <div className="flex items-center justify-between p-4 bg-brand-surface border-b border-brand-border shrink-0">
                    <div className="font-mono text-xs text-brand-text-muted">
                      LaTeX Source — {selectedData.jobs?.company}
                    </div>
                    <button
                      onClick={() => handleCopy(selectedData.tailored_resume_text)}
                      className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-dim text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2"
                    >
                      {copied ? '✓ Copied!' : 'Copy LaTeX'}
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={selectedData.tailored_resume_text}
                    className="flex-1 w-full bg-transparent p-5 text-xs font-mono text-brand-text/90 focus:outline-none resize-none styling-scrollbar whitespace-pre"
                  />
                </div>
              ) : (
                <div className="h-[600px] border-2 border-dashed border-brand-border/30 rounded-2xl flex items-center justify-center bg-brand-surface-low/30">
                  <p className="text-brand-text-muted font-medium">Select a company from the list to view its custom LaTeX source.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
