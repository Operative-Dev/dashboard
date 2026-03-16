'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Users, TrendingUp, Calendar, ExternalLink, Activity } from 'lucide-react'
import { getClients, getChannelsByClient, getPostsByAccount, getAccountsByChannel } from '@/lib/db'
import { formatNumber, getPlatformColor } from '@/lib/utils'

export default function ClientsPage() {
  const clients = getClients()

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-gradient mb-2">
          Clients
        </h1>
        <p className="text-gray-400 font-mono">
          Manage and monitor all client accounts
        </p>
      </div>

      {/* Client Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {clients.map((client: any, index) => {
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
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className="glass-card p-6 rounded-xl group hover:bg-white/8 transition-all duration-300"
            >
              {/* Client Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold font-display text-white mb-2">
                    {client.name}
                  </h3>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <Activity className="w-3 h-3 mr-1" />
                    {client.status}
                  </span>
                </div>
                <Link
                  href={`/clients/${client.id}`}
                  className="text-purple-400 hover:text-purple-300 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <ExternalLink className="w-5 h-5" />
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold font-display text-white mb-1">
                    {channels.length}
                  </div>
                  <div className="text-xs text-gray-400 font-mono">
                    Channels
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold font-display text-white mb-1">
                    {totalPosts}
                  </div>
                  <div className="text-xs text-gray-400 font-mono">
                    Total Posts
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold font-display text-white mb-1">
                    {formatNumber(totalImpressions)}
                  </div>
                  <div className="text-xs text-gray-400 font-mono">
                    Impressions
                  </div>
                </div>
              </div>

              {/* Platforms */}
              <div className="space-y-2">
                <div className="text-sm text-gray-400 font-mono mb-2">Platforms</div>
                <div className="flex flex-wrap gap-2">
                  {channels.map((channel: any) => {
                    const accounts = getAccountsByChannel(channel.id)
                    return (
                      <div
                        key={channel.id}
                        className={`px-3 py-2 rounded-lg text-xs font-medium ${getPlatformColor(channel.platform)} flex items-center space-x-2`}
                      >
                        <span>{channel.platform}</span>
                        <span className="text-white/60">({accounts.length})</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Recent Activity Indicator */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-mono">
                    Created {new Date(client.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-emerald-400 font-mono">Active</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="glass-card p-6 rounded-xl"
      >
        <h3 className="text-lg font-semibold font-display text-white mb-4">
          Portfolio Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold font-display text-white mb-1">
              {clients.length}
            </div>
            <div className="text-sm text-gray-400 font-mono">
              Total Clients
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold font-display text-white mb-1">
              {clients.reduce((acc: number, client: any) => {
                return acc + getChannelsByClient(client.id).length
              }, 0)}
            </div>
            <div className="text-sm text-gray-400 font-mono">
              Total Channels
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold font-display text-white mb-1">
              {clients.filter((client: any) => client.status === 'active').length}
            </div>
            <div className="text-sm text-gray-400 font-mono">
              Active Clients
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold font-display text-white mb-1">
              100%
            </div>
            <div className="text-sm text-gray-400 font-mono">
              Success Rate
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}