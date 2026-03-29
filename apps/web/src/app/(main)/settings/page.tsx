'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

function SettingsContent() {
  const [profile, setProfile] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [googleStatus, setGoogleStatus] = useState<'connected' | 'error' | null>(null)
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const g = searchParams.get('google')
    if (g === 'connected') setGoogleStatus('connected')
    if (g === 'error') setGoogleStatus('error')
  }, [searchParams])

  useEffect(() => {
    supabase.auth.getUser().then((res: any) => {
      if (res.data?.user) {
        supabase.from('profiles').select('*').eq('id', res.data.user.id).single()
          .then(({ data: p }: any) => setProfile(p))
      }
    })
  }, [])

  function update(key: string, value: any) {
    setProfile((prev: any) => ({ ...prev, [key]: value }))
  }

  async function save() {
    if (!profile) return
    setSaving(true)

    const targetRolesRaw = profile.target_roles_raw ?? (profile.target_roles || []).join(', ')
    const targetLocationsRaw = profile.target_locations_raw ?? (profile.target_locations || []).join(', ')
    const watchlistRaw = profile.watchlist_raw ?? (profile.watchlist || []).join(', ')

    await supabase.from('profiles').update({
      full_name: profile.full_name,
      target_roles: targetRolesRaw.split(',').map((s: string) => s.trim()).filter(Boolean),
      target_locations: targetLocationsRaw.split(',').map((s: string) => s.trim()).filter(Boolean),
      watchlist: watchlistRaw.split(/[,\n]+/).map((s: string) => s.trim()).filter(Boolean),
      llm_provider: profile.llm_provider,
      llm_api_key: profile.llm_api_key,
      email_digest: profile.email_digest,
    }).eq('id', profile.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!profile) return (
    <div className="flex items-center gap-3 text-brand-primary animate-pulse mt-8">
      <div className="w-5 h-5 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
      <span className="font-medium tracking-wide text-sm uppercase">Loading preferences...</span>
    </div>
  )

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <header className="mb-10">
        <h1 className="text-4xl font-semibold mb-2 text-brand-text tracking-tight flex items-center gap-3">
          Settings <span className="opacity-80">⚙️</span>
        </h1>
        <p className="text-brand-text-muted text-lg">Configure your job search preferences and API keys.</p>
      </header>

      {/* Google OAuth status banner */}
      {googleStatus === 'connected' && (
        <div className="mb-6 p-4 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 text-sm font-medium flex items-center gap-2">
          ✓ Google Drive connected successfully!
        </div>
      )}
      {googleStatus === 'error' && (
        <div className="mb-6 p-4 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 text-sm font-medium flex items-center gap-2">
          ✗ Google Drive connection failed. Please check your Google Cloud Console OAuth settings and try again.
        </div>
      )}

      <div className="max-w-2xl">
        <div className="glass-card rounded-3xl p-8 space-y-8 border border-brand-border shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
          {/* Name */}
          <Field label="Full Name">
            <input value={profile.full_name || ''} onChange={e => update('full_name', e.target.value)}
              className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-brand-text placeholder-brand-text-muted/50 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all shadow-inner" placeholder="Your name" />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Target roles */}
            <Field label="Target Roles" hint="Comma-separated (e.g. Engineer, PM)">
              <input value={profile.target_roles_raw ?? (profile.target_roles || []).join(', ')}
                onChange={e => update('target_roles_raw', e.target.value)}
                className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-brand-text placeholder-brand-text-muted/50 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all shadow-inner" placeholder="Software Engineer" />
            </Field>

            {/* Target locations */}
            <Field label="Target Locations" hint="Comma-separated (e.g. London, Remote)">
              <input value={profile.target_locations_raw ?? (profile.target_locations || []).join(', ')}
                onChange={e => update('target_locations_raw', e.target.value)}
                className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-brand-text placeholder-brand-text-muted/50 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all shadow-inner" placeholder="London, Remote" />
            </Field>
          </div>

          {/* Watchlist */}
          <Field label="Company Watchlist" hint="Comma-separated (e.g. OpenAI, Anthropic, Stripe)">
            <textarea value={profile.watchlist_raw ?? (profile.watchlist || []).join(', ')}
              onChange={e => update('watchlist_raw', e.target.value)}
              className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-brand-text placeholder-brand-text-muted/50 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all min-h-[100px] resize-y shadow-inner" placeholder="OpenAI, Anthropic, Stripe" />
          </Field>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-brand-border to-transparent my-8" />

          {/* LLM Content */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-brand-text">AI Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Provider">
                <select value={profile.llm_provider || 'openai'} onChange={e => update('llm_provider', e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-brand-text focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all appearance-none cursor-pointer shadow-inner">
                  <option value="openai">OpenAI (GPT-4o mini)</option>
                  <option value="anthropic">Anthropic (Claude Haiku)</option>
                  <option value="gemini">Google Gemini Flash</option>
                </select>
              </Field>

              <Field label="API Key" hint="Encrypted at rest">
                <input type="password" value={profile.llm_api_key || ''}
                  onChange={e => update('llm_api_key', e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-brand-text placeholder-brand-text-muted/50 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all shadow-inner" placeholder="sk-..." />
              </Field>
            </div>

            {/* Google Drive */}
            <Field label="Google Drive Integration" hint="Required to auto-create tailored resume Google Docs">
              {profile.google_tokens ? (
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-2.5 rounded-xl font-medium">
                  <span className="text-lg">✓</span> Connected to Google Drive
                </div>
              ) : (
                <a href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google/login?user_id=${profile.id}`}
                  className="inline-block bg-brand-surface-high border border-brand-border text-brand-text px-6 py-3 rounded-xl hover:bg-brand-surface-highest transition-colors font-medium">
                  Connect Google Drive
                </a>
              )}
            </Field>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-brand-border to-transparent my-8" />

          {/* Email digest */}
          <Field label="Notifications">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input type="checkbox" checked={profile.email_digest}
                  onChange={e => update('email_digest', e.target.checked)}
                  className="peer appearance-none w-6 h-6 border-2 border-brand-border rounded-lg bg-brand-surface checked:bg-brand-primary checked:border-brand-primary transition-all cursor-pointer" />
                <svg className="absolute w-4 h-4 text-[#1a0033] opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-brand-text group-hover:text-brand-primary transition-colors select-none font-medium">Send me a daily briefing at 7am UTC</span>
            </label>
          </Field>

          <div className="pt-6">
            <button onClick={save} disabled={saving}
              className={`btn-primary w-full md:w-auto px-8 py-3.5 text-base flex items-center justify-center gap-2 ${saved ? '!bg-emerald-500 !shadow-emerald-500/20' : ''}`}>
              {saving ? (
                <><span className="w-5 h-5 rounded-full border-2 border-[#1a0033] border-t-transparent animate-spin" /> Saving...</>
              ) : saved ? (
                '✓ Settings Saved!'
              ) : (
                'Save All Preferences'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-bold text-brand-text mb-1.5 uppercase tracking-wide">{label}</label>
      {hint && <p className="text-xs text-brand-text-muted mb-3 font-medium">{hint}</p>}
      {children}
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center gap-3 text-brand-primary animate-pulse mt-8">
        <div className="w-5 h-5 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
        <span className="font-medium tracking-wide text-sm uppercase">Loading...</span>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  )
}
