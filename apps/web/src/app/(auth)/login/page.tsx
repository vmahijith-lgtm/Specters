'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const supabase = createClient()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name }
        }
      })
      if (error) {
        setErrorMsg(error.message)
      } else {
        // If email confirmations are enabled in Supabase, data.session will be null
        if (!data.session) {
          setErrorMsg('Registration successful! Please check your email to confirm your account before logging in.')
          setIsSignUp(false)
          setLoading(false)
          return
        }

        if (data.user) {
          const { error: profileError } = await supabase.from('profiles').upsert(
            { id: data.user.id, full_name: name },
            { onConflict: 'id', ignoreDuplicates: false }
          )
          if (profileError) {
            console.error("Profile Error:", profileError)
          }
        }
        router.push('/dashboard')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        setErrorMsg(error.message)
      } else {
        router.push('/dashboard')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[var(--color-brand-bg)]">
      {/* Background glowing orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-[var(--color-brand-primary)] rounded-full mix-blend-screen opacity-10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-[var(--color-brand-secondary)] rounded-full mix-blend-screen opacity-10 blur-[120px]" />

      <div className="glass-card rounded-[2rem] p-10 w-full max-w-md shadow-2xl relative z-10 ambient-glow">
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-brand-primary)] to-[var(--color-brand-primary-dim)] flex items-center justify-center shadow-[0_0_20px_rgba(204,151,255,0.4)]">
            <span className="text-[#1a0033] font-bold text-lg font-display tracking-tight">S</span>
          </div>
          <span className="font-semibold text-2xl font-display text-[var(--color-brand-text)] tracking-tight">Specters</span>
        </div>

        <h1 className="text-3xl font-display font-medium mb-2 text-center text-[var(--color-brand-text)] tracking-tight">
          {isSignUp ? 'Initiate Session' : 'Authenticate'}
        </h1>
        <p className="text-[var(--color-brand-text-muted)] text-center text-sm mb-8 leading-relaxed">
          {isSignUp
            ? 'Access predictive job intelligence. Create your profile.'
            : 'Access the command center. Find your next role.'}
        </p>

        {errorMsg && (
          <div className="mb-6 p-4 bg-[var(--color-brand-surface-highest)] text-red-400 text-sm rounded-xl border border-red-500/20 backdrop-blur-md">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Callsign / Full Name"
                required
                className="w-full bg-[var(--color-brand-surface-lowest)] border border-[var(--color-brand-border)] rounded-xl px-5 py-3.5 text-sm text-[var(--color-brand-text)] placeholder-[var(--color-brand-text-muted)] focus:outline-none focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)]/50 transition-all font-body shadow-inner"
              />
            </div>
          )}
          <div>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Comm-link (Email)"
              required
              className="w-full bg-[var(--color-brand-surface-lowest)] border border-[var(--color-brand-border)] rounded-xl px-5 py-3.5 text-sm text-[var(--color-brand-text)] placeholder-[var(--color-brand-text-muted)] focus:outline-none focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)]/50 transition-all font-body shadow-inner"
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Passcode"
              required
              minLength={6}
              className="w-full bg-[var(--color-brand-surface-lowest)] border border-[var(--color-brand-border)] rounded-xl px-5 py-3.5 text-sm text-[var(--color-brand-text)] placeholder-[var(--color-brand-text-muted)] focus:outline-none focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)]/50 transition-all font-body shadow-inner"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 text-sm flex justify-center items-center"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-[#1a0033]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Establishing Uplink...
                </span>
              ) : isSignUp ? 'Initialize' : 'Enter Network'}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-[var(--color-brand-border)]">
          <p className="text-center text-sm text-[var(--color-brand-text-muted)]">
            {isSignUp ? 'Already have access? ' : 'Need clearance? '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setErrorMsg('')
              }}
              className="text-[var(--color-brand-primary)] font-medium hover:text-[var(--color-brand-primary-dim)] transition-colors"
            >
              {isSignUp ? 'Sign in' : 'Create profile'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
