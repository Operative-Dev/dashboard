'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Activity, 
  AlertTriangle,
  Zap,
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
    <div className="w-64 glass border-r border-white/10 h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-display text-gradient">
              Agent Control
            </h1>
            <p className="text-xs text-gray-400 font-mono">Mission Control</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (pathname.startsWith(item.href) && item.href !== '/')
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'nav-item',
                isActive && 'active'
              )}
            >
              <div className="flex items-center flex-1">
                <span className="mr-3">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="ml-auto bg-red-500/20 text-red-300 text-xs px-2 py-1 rounded-full font-mono border border-red-500/30">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Status */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center space-x-2 text-xs">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          <span className="text-gray-400 font-mono">
            3 agents active
          </span>
        </div>
        <div className="flex items-center space-x-2 text-xs mt-1">
          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
          <span className="text-gray-400 font-mono">
            12 posts scheduled
          </span>
        </div>
      </div>
    </div>
  )
}