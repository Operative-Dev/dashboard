'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, AlertTriangle } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: '/posts', label: 'Posts', icon: <FileText className="w-4 h-4" /> },
  { href: '/needs-attention', label: 'Needs Attention', icon: <AlertTriangle className="w-4 h-4" /> },
]

export function Sidebar() {
  const pathname = usePathname()
  const [postCount, setPostCount] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/overview')
      .then(r => r.json())
      .then(d => setPostCount(d.stats?.postsThisWeek ?? null))
      .catch(() => {})
  }, [])

  return (
    <div className="w-60 bg-zinc-950 border-r border-zinc-800 h-full flex flex-col shrink-0">
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          <h1 className="text-lg font-bold text-zinc-50" style={{ fontFamily: 'var(--font-display)' }}>
            AGENT CTRL
          </h1>
        </div>
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
    </div>
  )
}
