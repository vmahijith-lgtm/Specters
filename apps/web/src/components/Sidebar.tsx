'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const NAV = [
  { href: '/dashboard',        label: 'Dashboard',  icon: '◉' },
  { href: '/radar',            label: 'Radar',       icon: '📡' },
  { href: '/jobs',             label: 'Jobs',        icon: '💼' },
  { href: '/resume',           label: 'Resume lab',  icon: '📄' },
  { href: '/outreach',         label: 'Outreach',    icon: '✉️'  },
  { href: '/pipeline',         label: 'Pipeline',    icon: '🔀' },
  { href: '/settings',         label: 'Settings',    icon: '⚙️'  },
]

export default function Sidebar() {
  const pathname  = usePathname()
  const router    = useRouter()
  const supabase  = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-64 border-r border-brand-border bg-brand-surface fixed inset-y-0 flex flex-col z-20">
      <div className="p-6 flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-brand-primary to-brand-primary-dim shadow-[0_0_15px_rgba(204,151,255,0.4)]">
          <span className="text-[#1a0033] font-bold text-sm">H</span>
        </div>
        <span className="font-semibold text-lg text-brand-text tracking-tight">HireSignal</span>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-3 rounded-2xl text-sm transition-all duration-300
                          ${active
                            ? 'bg-brand-surface-highest text-brand-primary shadow-[inset_0_1px_0_0_rgba(204,151,255,0.15)] border border-brand-border'
                            : 'text-brand-text-muted hover:bg-brand-surface-high hover:text-brand-text'}`}>
              <span className={`text-base ${active ? 'opacity-100 drop-shadow-[0_0_8px_rgba(204,151,255,0.6)]' : 'opacity-60'}`}>{icon}</span>
              <span className={active ? 'font-medium' : ''}>{label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-brand-border">
        <button onClick={signOut}
          className="text-sm text-brand-text-muted hover:text-brand-text hover:bg-brand-surface-high w-full text-left px-3 py-3 rounded-xl transition">
          Sign out
        </button>
      </div>
    </aside>
  )
}
