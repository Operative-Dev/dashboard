'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, AlertTriangle, Menu, X } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: '/posts', label: 'Posts', icon: <FileText className="w-4 h-4" /> },
  { href: '/needs-attention', label: 'Needs Attention', icon: <AlertTriangle className="w-4 h-4" /> },
]

export function Sidebar() {
  const pathname = usePathname()
  const [postCount, setPostCount] = useState<number | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetch('/api/overview')
      .then(r => r.json())
      .then(d => setPostCount(d.stats?.postsThisWeek ?? null))
      .catch(() => {})
  }, [])

  // Close on route change
  useEffect(() => { setOpen(false) }, [pathname])

  const nav = (
    <>
      <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          <h1 className="text-lg font-bold text-zinc-50" style={{ fontFamily: 'var(--font-display)' }}>
            AGENT CTRL
          </h1>
        </div>
        <button onClick={() => setOpen(false)} className="md:hidden text-zinc-400 hover:text-zinc-50 cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (pathname.startsWith(item.href) && item.href !== '/')
          return (
            <Link
              key={item.href}
              href={item.href}
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

  return (
    <>
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
          <div className="absolute left-0 top-0 bottom-0 w-60 bg-zinc-950 border-r border-zinc-800 flex flex-col">
            {nav}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex w-60 bg-zinc-950 border-r border-zinc-800 h-full flex-col shrink-0">
        {nav}
      </div>
    </>
  )
}
