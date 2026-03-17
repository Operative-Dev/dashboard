'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { LayoutDashboard, FileText, AlertTriangle, Menu, X } from 'lucide-react'
import { companies } from '@/lib/companies'

const navItems = [
  { href: '/', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: '/posts', label: 'Posts', icon: <FileText className="w-4 h-4" /> },
  { href: '/needs-attention', label: 'Needs Attention', icon: <AlertTriangle className="w-4 h-4" /> },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentCompany = searchParams.get('company') || 'all'
  const [postCount, setPostCount] = useState<number | null>(null)

  useEffect(() => {
    const url = currentCompany === 'all' ? '/api/overview' : `/api/overview?company=${currentCompany}`
    fetch(url)
      .then(r => r.json())
      .then(d => setPostCount(d.stats?.postsThisWeek ?? null))
      .catch(() => {})
  }, [currentCompany])

  const handleCompanyChange = (slug: string) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()))
    if (slug === 'all') params.delete('company')
    else params.set('company', slug)
    const q = params.toString()
    router.push(`${pathname}${q ? `?${q}` : ''}`)
    onNavigate?.()
  }

  const buildHref = (base: string) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()))
    const q = params.toString()
    return q ? `${base}?${q}` : base
  }

  return (
    <>
      {/* Company Switcher */}
      <div className="p-4 border-b border-zinc-800">
        <div className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-2 px-3">Company</div>
        <select
          value={currentCompany}
          onChange={(e) => handleCompanyChange(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 text-zinc-50 text-sm font-medium rounded-md px-3 py-2 cursor-pointer focus:outline-none focus:ring-1 focus:ring-zinc-600"
        >
          <option value="all">All Companies</option>
          {companies.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/')
          return (
            <Link
              key={item.href}
              href={buildHref(item.href)}
              onClick={() => onNavigate?.()}
              className={`flex items-center px-3 py-2 text-sm font-medium transition-colors cursor-pointer rounded-md ${
                isActive
                  ? 'text-zinc-50 bg-zinc-800/50 border-l-2 border-emerald-500'
                  : 'text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/50'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Status */}
      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center space-x-2 text-xs">
          <div className="status-dot active"></div>
          <span className="text-zinc-400 font-mono">
            {postCount !== null ? `${postCount} posts this week` : '...'}
          </span>
        </div>
      </div>
    </>
  )
}

export function Sidebar() {
  const [open, setOpen] = useState(false)

  return (
    <Suspense fallback={null}>
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-zinc-950 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          <h1 className="text-base font-bold text-zinc-50" style={{ fontFamily: 'var(--font-display)' }}>AGENT CTRL</h1>
        </div>
        <button onClick={() => setOpen(true)} className="text-zinc-400 hover:text-zinc-50 cursor-pointer">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <h1 className="text-lg font-bold text-zinc-50" style={{ fontFamily: 'var(--font-display)' }}>AGENT CTRL</h1>
              </div>
              <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-50 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex w-60 bg-zinc-950 border-r border-zinc-800 h-full flex-col shrink-0">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <h1 className="text-lg font-bold text-zinc-50" style={{ fontFamily: 'var(--font-display)' }}>AGENT CTRL</h1>
          </div>
        </div>
        <SidebarContent />
      </div>
    </Suspense>
  )
}
