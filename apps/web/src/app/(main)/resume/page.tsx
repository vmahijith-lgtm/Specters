'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { api } from '@/lib/api'

export default function ResumePage() {
  const [resumeText, setResumeText] = useState('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then((res: any) => {
      setUser(res.data?.user)
      if (res.data?.user) {
        supabase.from('profiles').select('base_resume').eq('id', res.data.user.id).single()
          .then(({ data: p }: any) => { if (p?.base_resume) setResumeText(p.base_resume) })
      }
    })
  }, [])

  async function saveResume() {
    if (!user || !resumeText.trim()) return
    setLoading(true)
    await api.uploadResume(user.id, resumeText)
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <header className="mb-10">
        <h1 className="text-4xl font-semibold mb-2 text-brand-text tracking-tight flex items-center gap-3">
          Resume Lab <span className="opacity-80">📄</span>
        </h1>
        <p className="text-brand-text-muted text-lg">
          Paste your base resume below. AI will tailor it for each job automatically.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="glass-card rounded-3xl p-8 border border-brand-border shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
            <label className="block text-sm font-bold text-brand-text mb-4 uppercase tracking-wide">Your Base Resume (Plain Text)</label>
            <textarea
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
              rows={22}
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
          <div className="relative overflow-hidden border border-brand-primary/30 bg-brand-primary/5 rounded-3xl p-8 backdrop-blur-md shadow-[0_0_30px_rgba(204,151,255,0.05)]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary to-brand-primary-dim opacity-50" />
            <h3 className="font-bold text-xl text-brand-primary mb-4 flex items-center gap-2">
              <span className="text-2xl">✨</span> How Tailoring Works
            </h3>
            <ol className="text-brand-text-muted space-y-4 list-decimal list-outside ml-4 font-medium leading-relaxed">
              <li className="pl-2">You save your comprehensive base resume here.</li>
              <li className="pl-2">On the <span className="text-brand-text">Jobs</span> page, click "Tailor resume" on any listing.</li>
              <li className="pl-2">AI automatically rewrites your resume using predictive modeling to match that job's exact language.</li>
              <li className="pl-2">A Google Doc is instantly generated.</li>
              <li className="pl-2">Your match probability score (0–100) is shown in the Pipeline.</li>
            </ol>

            <div className="mt-8 pt-6 border-t border-brand-primary/20">
              <p className="text-xs text-brand-primary font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-primary animate-ping" />
                System Active
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
