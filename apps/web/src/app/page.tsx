'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import Link from 'next/link'

export default function LandingPage() {
  const [signals, setSignals] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)

  const fallbackSignals = [
    { id: 1, company: 'Anthropic', signal_score: 96, signal_type: 'Massive Series D Funding Round Detected' },
    { id: 2, company: 'Linear', signal_score: 88, signal_type: 'Unusual GitHub Activity Spike (Hiring Surge Likely)' },
    { id: 3, company: 'Supabase', signal_score: 75, signal_type: 'Aggressive Corporate Headcount Growth' },
  ]

  useEffect(() => {
    setMounted(true)
    // Fetch live signals, fallback to examples if db is empty for landing page aesthetics
    api.getSignals(70)
      .then(res => {
        if (res.signals && res.signals.length > 0) {
          setSignals(res.signals.slice(0, 3))
        } else {
          setSignals(fallbackSignals)
        }
      })
      .catch((e) => {
        console.error(e)
        setSignals(fallbackSignals)
      })
  }, [])

  return (
    <div className="relative min-h-screen bg-brand-bg text-brand-text font-body overflow-hidden selection:bg-brand-primary selection:text-brand-surface">
      {/* Background Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-brand-primary/20 blur-[120px] pointer-events-none mix-blend-screen opacity-50 animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-brand-primary-dim/20 blur-[150px] pointer-events-none mix-blend-screen opacity-40"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 flex flex-col min-h-screen justify-center items-center">

        {/* Navigation / Header */}
        <nav className="absolute top-0 w-full flex justify-between items-center py-6 px-8 z-50 transition-all duration-[800ms] " style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
          <div className="text-2xl font-bold tracking-tighter text-brand-primary font-display">
            Specters<span className="text-brand-text">.</span>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="px-6 py-2.5 rounded-full bg-brand-surface-highest/60 backdrop-blur-xl text-sm font-medium border border-brand-border shadow-md hover:bg-brand-surface-highest transition-all duration-300">
              Sign In
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="flex-1 w-full flex flex-col lg:flex-row items-center justify-center gap-16 mt-20">

          {/* Text Content */}
          <div className={`flex-1 flex flex-col items-start gap-8 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`} style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <h1 className="text-6xl lg:text-7xl xl:text-8xl font-black leading-[1.05] tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-brand-text to-brand-text-muted font-display">
              Intercept the<br />
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-brand-primary to-brand-primary-dim">Hidden Job Market.</span>
            </h1>

            <p className="text-lg text-brand-text-muted max-w-xl leading-relaxed font-body">
              An elite command center for ambitious job seekers. We scan for pre-posting hiring signals, instantly tailor your resume via AI, and put you directly in front of hiring managers—landing you the role before the competition even knows it exists.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full">
              <Link href="/dashboard" className="group relative px-8 py-4 btn-primary text-lg overflow-hidden transition-all duration-300 hover:scale-105">
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Launch Command Center
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              </Link>
            </div>
          </div>

          {/* Cards Display / Integration preview */}
          <div className={`flex-1 w-full max-w-lg relative transition-all duration-1000 delay-200 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`} style={{ transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-surface-high to-brand-surface-low rounded-[2rem] transform rotate-3 scale-105 border border-brand-border opacity-50"></div>

            <div className="relative glass-card rounded-[2rem] p-8 flex flex-col gap-6">
              <div className="flex justify-between items-center pb-4 border-b border-brand-border">
                <h3 className="font-bold text-xl tracking-tight text-brand-text font-display">Live Market Signals</h3>
                <span className="text-xs uppercase tracking-widest text-brand-text-muted font-medium font-body relative flex items-center gap-2">
                  System Active
                  <span className="w-2 h-2 rounded-full bg-brand-primary animate-ping"></span>
                </span>
              </div>

              <div className="flex flex-col gap-4 font-body">
                {signals.length === 0 ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse flex flex-col gap-3 p-4 rounded-2xl bg-brand-surface-highest/60 border border-brand-border">
                      <div className="w-1/2 h-4 bg-brand-text-muted/20 rounded"></div>
                      <div className="w-full h-3 bg-brand-text-muted/10 rounded"></div>
                    </div>
                  ))
                ) : (
                  signals.map((sig, i) => (
                    <div key={sig.id || i} className="group flex flex-col gap-2 p-5 rounded-2xl bg-brand-surface-highest/60 border border-brand-border hover:bg-brand-surface-highest hover:border-brand-primary/30 hover:shadow-[0_0_15px_rgba(204,151,255,0.1)] transition-all duration-300">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-lg text-brand-text leading-tight">{sig.company}</h4>
                        <div className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-xs font-bold px-2.5 py-1 rounded-lg">
                          {sig.signal_score}% Match
                        </div>
                      </div>
                      <p className="text-sm text-brand-text-muted line-clamp-2 capitalize">
                        {sig.signal_type ? sig.signal_type.replace(/_/g, ' ') : 'Opportunity detected in active hiring network.'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
