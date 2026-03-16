'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ExternalLink, Image, Calendar, User, TrendingUp } from 'lucide-react'
import { formatDateTime, formatNumber, getStatusColor, getPlatformColor } from '@/lib/utils'

interface Post {
  id: string
  content: string
  media_url?: string
  status: string
  created_at: string
  published_at?: string
  agent_id: string
  handle: string
  account_name: string
  platform: string
  client_name: string
  impressions?: number
  likes?: number
  comments?: number
  engagement_rate?: number
}

interface DataTableProps {
  posts: Post[]
  showAll?: boolean
  delay?: number
}

export function DataTable({ posts, showAll = false, delay = 0 }: DataTableProps) {
  const displayPosts = showAll ? posts : posts.slice(0, 10)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="glass-card rounded-xl overflow-hidden"
    >
      <div className="p-6 border-b border-white/10">
        <h3 className="text-lg font-semibold font-display text-white mb-1">Recent Posts</h3>
        <p className="text-sm text-gray-400 font-mono">Latest activity from all agents</p>
      </div>

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-6 py-4 text-left">Content</th>
              <th className="px-6 py-4 text-left">Account</th>
              <th className="px-6 py-4 text-left">Status</th>
              <th className="px-6 py-4 text-left">Agent</th>
              <th className="px-6 py-4 text-left">Metrics</th>
              <th className="px-6 py-4 text-left">Date</th>
              <th className="px-6 py-4 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {displayPosts.map((post, index) => (
              <motion.tr
                key={post.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + index * 0.1, duration: 0.3 }}
                className="hover:bg-white/5 transition-colors duration-200 group"
              >
                <td className="px-6 py-4">
                  <div className="flex items-start space-x-3">
                    {post.media_url && (
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Image className="w-4 h-4 text-purple-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white truncate max-w-md">
                        {post.content}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPlatformColor(post.platform)}`}>
                          {post.platform}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          {post.client_name}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-white font-mono">
                      {post.handle}
                    </p>
                    <p className="text-xs text-gray-400">
                      {post.account_name}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-mono ${getStatusColor(post.status)}`}>
                    {post.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300 font-mono">
                      {post.agent_id}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {post.status === 'posted' && post.impressions ? (
                    <div className="space-y-1">
                      <div className="flex items-center space-x-4 text-xs">
                        <span className="text-gray-400">
                          <TrendingUp className="w-3 h-3 inline mr-1" />
                          {formatNumber(post.impressions)}
                        </span>
                        <span className="text-pink-400">
                          ♥ {formatNumber(post.likes || 0)}
                        </span>
                      </div>
                      {post.engagement_rate && (
                        <div className="text-xs text-emerald-400 font-mono">
                          {post.engagement_rate.toFixed(1)}% engagement
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-xs text-gray-400 space-y-1">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span className="font-mono">
                        {formatDateTime(post.created_at)}
                      </span>
                    </div>
                    {post.published_at && (
                      <div className="text-emerald-400 font-mono">
                        Published {formatDateTime(post.published_at)}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/posts/${post.id}`}
                    className="inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {!showAll && posts.length > 10 && (
        <div className="p-4 border-t border-white/10 text-center">
          <Link
            href="/posts"
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors font-medium"
          >
            View all {posts.length} posts →
          </Link>
        </div>
      )}
    </motion.div>
  )
}

// Skeleton loading state
export function DataTableSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="glass-card rounded-xl overflow-hidden"
    >
      <div className="p-6 border-b border-white/10">
        <div className="w-40 h-6 skeleton rounded mb-2" />
        <div className="w-56 h-4 skeleton rounded" />
      </div>

      <div className="p-6 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <div className="w-10 h-10 skeleton rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="w-3/4 h-4 skeleton rounded" />
              <div className="w-1/2 h-3 skeleton rounded" />
            </div>
            <div className="w-16 h-6 skeleton rounded" />
            <div className="w-20 h-4 skeleton rounded" />
          </div>
        ))}
      </div>
    </motion.div>
  )
}