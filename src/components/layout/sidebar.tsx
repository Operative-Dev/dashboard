'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  FileText, 
  Users, 
  Home, 
  Activity,
  Bot,
  Settings,
  ChevronRight
} from 'lucide-react';

const navigation = [
  { name: 'Overview', href: '/', icon: Home },
  { name: 'Posts', href: '/posts', icon: FileText },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, disabled: true },
  { name: 'Agents', href: '/agents', icon: Bot, disabled: true },
];

const agents = [
  { name: 'Hopper', status: 'online', emoji: '🦞' },
  { name: 'Eleven', status: 'idle', emoji: '🎬' },
  { name: 'Will', status: 'online', emoji: '🎨' },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'online': return 'bg-emerald-500';
    case 'idle': return 'bg-amber-500';
    case 'error': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 h-screen bg-dashboard-bg border-r border-dashboard-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-dashboard-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-dashboard-text-primary font-display">
              Agent Control
            </h1>
            <p className="text-xs text-dashboard-text-muted font-mono">Mission Control</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.disabled ? '#' : item.href}
              className={`
                nav-item
                ${isActive ? 'active' : ''}
                ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              onClick={item.disabled ? (e) => e.preventDefault() : undefined}
            >
              <Icon className="w-5 h-5 mr-3" />
              <span className="flex-1">{item.name}</span>
              {item.disabled && <span className="text-xs text-gray-500">Soon</span>}
              {isActive && <ChevronRight className="w-4 h-4" />}
            </Link>
          );
        })}
      </nav>

      {/* Agents Status */}
      <div className="px-4 py-4 border-t border-dashboard-border">
        <h3 className="text-xs font-mono uppercase tracking-wider text-dashboard-text-muted mb-4">
          Active Agents
        </h3>
        <div className="space-y-3">
          {agents.map((agent) => (
            <div key={agent.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
              <span className="text-lg">{agent.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dashboard-text-primary truncate">
                  {agent.name}
                </p>
                <p className="text-xs text-dashboard-text-muted capitalize">
                  {agent.status}
                </p>
              </div>
              <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-dashboard-border">
        <button className="w-full flex items-center gap-3 p-2 text-dashboard-text-secondary hover:text-dashboard-text-primary hover:bg-white/5 rounded-lg transition-colors">
          <Settings className="w-4 h-4" />
          <span className="text-sm">Settings</span>
        </button>
      </div>
    </div>
  );
}