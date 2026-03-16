'use client'

import Link from 'next/link'
import { Users, TrendingUp, Calendar, ExternalLink, Activity } from 'lucide-react'
import { getClients, getChannelsByClient, getPostsByAccount, getAccountsByChannel } from '@/lib/db'
import DashboardLayout from '@/components/layout/dashboard-layout'
import PlatformBadge from '@/components/ui/platform-badge'

export default function ClientsPage() {
  const clients = getClients()

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <DashboardLayout title="Clients">
      <div className="p-8 space-y-8">
        {/* Client Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {clients.map((client: any) => {
            const channels = getChannelsByClient(client.id)
            
            // Get total posts for this client
            let totalPosts = 0
            let totalImpressions = 0
            
            channels.forEach((channel: any) => {
              const accounts = getAccountsByChannel(channel.id)
              accounts.forEach((account: any) => {
                const posts = getPostsByAccount(account.id, 1000)
                totalPosts += posts.length
                posts.forEach((post: any) => {
                  totalImpressions += post.impressions || 0
                })
              })
            })

            return (
              <div
                key={client.id}
                className="bg-zinc-900 border border-zinc-800 p-6 rounded-md group hover:bg-zinc-800/50 transition-colors"
              >
                {/* Client Header */}
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
                  <Link
                    href={`/clients/${client.id}`}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold font-mono text-zinc-50 mb-1">
                      {channels.length}
                    </div>
                    <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider">
                      Channels
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold font-mono text-zinc-50 mb-1">
                      {totalPosts}
                    </div>
                    <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider">
                      Posts
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold font-mono text-zinc-50 mb-1">
                      {formatNumber(totalImpressions)}
                    </div>
                    <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider">
                      Impressions
                    </div>
                  </div>
                </div>

                {/* Platforms */}
                <div className="space-y-2">
                  <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-2">Platforms</div>
                  <div className="flex flex-wrap gap-2">
                    {channels.map((channel: any) => {
                      const accounts = getAccountsByChannel(channel.id)
                      return (
                        <div
                          key={channel.id}
                          className="px-2 py-1 rounded text-xs font-mono bg-zinc-900 text-zinc-400 border border-zinc-800 flex items-center gap-2"
                        >
                          <PlatformBadge platform={channel.platform} showIcon={true} />
                          <span>({accounts.length})</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Recent Activity Indicator */}
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 font-mono">
                      Created {new Date(client.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="status-dot active"></div>
                      <span className="text-emerald-400 font-mono">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick Stats */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-md">
          <h3 className="text-lg font-semibold text-zinc-50 mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Portfolio Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-zinc-50 mb-1">
                {clients.length}
              </div>
              <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider">
                Total Clients
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-zinc-50 mb-1">
                {clients.reduce((acc: number, client: any) => {
                  return acc + getChannelsByClient(client.id).length
                }, 0)}
              </div>
              <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider">
                Total Channels
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-zinc-50 mb-1">
                {clients.filter((client: any) => client.status === 'active').length}
              </div>
              <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider">
                Active Clients
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-zinc-50 mb-1">
                100%
              </div>
              <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider">
                Success Rate
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}