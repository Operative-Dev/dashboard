'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { LayoutDashboard, FileText, AlertTriangle } from 'lucide-react'
import { companies, type Company } from '@/lib/companies'

const navItems = [
  { href: '/', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: '/posts', label: 'Posts', icon: <FileText className="w-4 h-4" /> },
  { href: '/needs-attention', label: 'Needs Attention', icon: <AlertTriangle className="w-4 h-4" /> },
]

export function Sidebar() {
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

  const handleCompanyChange = (companySlug: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()))
    if (companySlug === 'all') {
      current.delete('company')
    } else {
      current.set('company', companySlug)
    }
    const search = current.toString()
    const query = search ? `?${search}` : ''
    router.push(`${pathname}${query}`)
  }

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

      {/* Company Switcher */}
      <div className="p-4 border-b border-zinc-800">
        <div className="space-y-1">
          <button
            onClick={() => handleCompanyChange('all')}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium transition-colors cursor-pointer rounded-md ${
              currentCompany === 'all'
                ? 'text-zinc-50 bg-zinc-800/50 border-l-2 border-emerald-500'
                : 'text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-zinc-500 rounded-full"></div>
              <span>All Companies</span>
            </div>
          </button>
          
          {companies.map((company) => (
            <button
              key={company.slug}
              onClick={() => handleCompanyChange(company.slug)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium transition-colors cursor-pointer rounded-md ${
                currentCompany === company.slug
                  ? 'text-zinc-50 bg-zinc-800/50'
                  : 'text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/50'
              }`}
              style={{
                borderLeft: currentCompany === company.slug ? `2px solid ${company.color}` : '2px solid transparent'
              }}
            >
              <div className="flex items-center space-x-2">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: company.color }}
                ></div>
                <span>{company.name}</span>
              </div>
              <div className={`text-xs px-2 py-0.5 rounded-full ${
                company.status === 'active' 
                  ? 'bg-emerald-900/50 text-emerald-400' 
                  : company.status === 'onboarding'
                  ? 'bg-blue-900/50 text-blue-400'
                  : 'bg-zinc-800 text-zinc-500'
              }`}>
                {company.status}
              </div>
            </button>
          ))}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (pathname.startsWith(item.href) && item.href !== '/')

          // Preserve company parameter when navigating
          const currentParams = new URLSearchParams(Array.from(searchParams.entries()))
          const query = currentParams.toString()
          const href = query ? `${item.href}?${query}` : item.href

          return (
            <Link
              key={item.href}
              href={href}
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
