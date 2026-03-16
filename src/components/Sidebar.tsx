'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Activity, 
  AlertTriangle,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  badge?: number
}

const navItems: NavItem[] = [
  {
    href: '/',
    label: 'Overview',
    icon: <LayoutDashboard className="w-4 h-4" />
  },
  {
    href: '/clients',
    label: 'Clients',
    icon: <Users className="w-4 h-4" />
  },
  {
    href: '/posts',
    label: 'Posts',
    icon: <FileText className="w-4 h-4" />
  },
  {
    href: '/agent-logs',
    label: 'Agent Logs',
    icon: <Activity className="w-4 h-4" />
  },
  {
    href: '/analytics',
    label: 'Analytics',
    icon: <BarChart3 className="w-4 h-4" />
  },
  {
    href: '/needs-attention',
    label: 'Needs Attention',
    icon: <AlertTriangle className="w-4 h-4" />,
    badge: 7
  }
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-60 bg-zinc-950 border-r border-zinc-800 h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          <h1 className="text-lg font-bold text-zinc-50" style={{ fontFamily: 'var(--font-display)' }}>
            AGENT CTRL
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (pathname.startsWith(item.href) && item.href !== '/')
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium transition-colors cursor-pointer rounded-md',
                isActive 
                  ? 'text-zinc-50 bg-zinc-800/50 border-l-2 border-emerald-500' 
                  : 'text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/50'
              )}
            >
              <div className="flex items-center flex-1">
                <span className="mr-3">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="ml-auto bg-zinc-900 text-red-400 text-xs px-2 py-1 rounded border border-zinc-800 font-mono">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Status */}
      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center space-x-2 text-xs">
          <div className="status-dot active"></div>
          <span className="text-zinc-400 font-mono">
            3 agents active
          </span>
        </div>
        <div className="flex items-center space-x-2 text-xs mt-1">
          <div className="status-dot scheduled"></div>
          <span className="text-zinc-400 font-mono">
            12 posts scheduled
          </span>
        </div>
      </div>
    </div>
  )
}