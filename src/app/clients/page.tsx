'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import PlatformBadge from '@/components/ui/platform-badge'

interface ClientData {
  id: string
  name: string
  status: string
  created_at: string
  channels: { id: string; platform: string; accountCount: number }[]
  totalPosts: number
  totalImpressions: number
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/clients')
      .then(r => r.json())
      .then(data => { setClients(data.clients || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  if (loading) {
    return (
      <DashboardLayout title="Clients">
        <div className="p-8"><div className="text-zinc-500 font-mono text-sm">Loading...</div></div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Clients">
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {clients.map((client) => (
            <div
              key={client.id}
              className="bg-zinc-900 border border-zinc-800 p-6 rounded-md group hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-zinc-50 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                    {client.name}
                  </h3>
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-mono bg-zinc-900 text-emerald-400 border border-zinc-800">
                    <div className="status-dot active mr-1"></div>
                    {client.status}
                  </span>
                </div>
                <Link href={`/clients/${client.id}`} className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer">
                  <ExternalLink className="w-5 h-5" />
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold font-mono text-zinc-50 mb-1">{client.channels.length}</div>
                  <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Channels</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold font-mono text-zinc-50 mb-1">{client.totalPosts}</div>
                  <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold font-mono text-zinc-50 mb-1">{formatNumber(client.totalImpressions)}</div>
                  <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Impressions</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-2">Platforms</div>
                <div className="flex flex-wrap gap-2">
                  {client.channels.map((channel) => (
                    <div key={channel.id} className="px-2 py-1 rounded text-xs font-mono bg-zinc-900 text-zinc-400 border border-zinc-800 flex items-center gap-2">
                      <PlatformBadge platform={channel.platform} showIcon={true} />
                      <span>({channel.accountCount})</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 font-mono">Created {new Date(client.created_at).toLocaleDateString()}</span>
                  <div className="flex items-center space-x-2">
                    <div className="status-dot active"></div>
                    <span className="text-emerald-400 font-mono">Active</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
