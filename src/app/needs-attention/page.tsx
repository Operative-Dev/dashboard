import { AlertTriangle, TrendingDown, XCircle, Clock } from 'lucide-react'
import { DataTable } from '@/components/DataTable'
import { getPosts } from '@/lib/db'

export default function NeedsAttentionPage() {
  const allPosts = getPosts(200) as any[]
  
  // Filter posts that need attention
  const failedPosts = allPosts.filter(post => post.status === 'failed')
  const lowEngagementPosts = allPosts.filter(post => 
    post.status === 'posted' && 
    post.engagement_rate !== null && 
    post.engagement_rate < 1.0
  )
  const staleScheduledPosts = allPosts.filter(post => 
    post.status === 'scheduled' && 
    new Date(post.created_at) < new Date(Date.now() - 24 * 60 * 60 * 1000) // older than 24h
  )

  const needsAttentionPosts = [
    ...failedPosts,
    ...lowEngagementPosts.slice(0, 10), // Limit low engagement to prevent flooding
    ...staleScheduledPosts
  ]

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-gradient mb-2">
          Needs Attention
        </h1>
        <p className="text-gray-400 font-mono">
          Posts and issues requiring manual review
        </p>
      </div>

      {/* Alert Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6 rounded-xl border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
            <span className="text-xs font-mono text-red-400 px-2 py-1 bg-red-500/20 rounded-full">
              Critical
            </span>
          </div>
          <div className="text-2xl font-bold font-display text-white mb-1">
            {failedPosts.length}
          </div>
          <div className="text-sm text-gray-400 font-mono">
            Failed Posts
          </div>
          <div className="text-xs text-red-400 mt-2">
            Requires immediate action
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl border-l-4 border-amber-500">
          <div className="flex items-center justify-between mb-4">
            <TrendingDown className="w-8 h-8 text-amber-400" />
            <span className="text-xs font-mono text-amber-400 px-2 py-1 bg-amber-500/20 rounded-full">
              Warning
            </span>
          </div>
          <div className="text-2xl font-bold font-display text-white mb-1">
            {lowEngagementPosts.length}
          </div>
          <div className="text-sm text-gray-400 font-mono">
            Low Engagement
          </div>
          <div className="text-xs text-amber-400 mt-2">
            &lt; 1% engagement rate
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-blue-400" />
            <span className="text-xs font-mono text-blue-400 px-2 py-1 bg-blue-500/20 rounded-full">
              Info
            </span>
          </div>
          <div className="text-2xl font-bold font-display text-white mb-1">
            {staleScheduledPosts.length}
          </div>
          <div className="text-sm text-gray-400 font-mono">
            Stale Scheduled
          </div>
          <div className="text-xs text-blue-400 mt-2">
            Scheduled &gt; 24h ago
          </div>
        </div>
      </div>

      {/* Issue Categories */}
      <div className="space-y-8">
        {/* Failed Posts */}
        {failedPosts.length > 0 && (
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <XCircle className="w-5 h-5 text-red-400" />
              <h2 className="text-xl font-semibold font-display text-white">
                Failed Posts ({failedPosts.length})
              </h2>
              <span className="text-xs font-mono text-red-400 px-2 py-1 bg-red-500/20 rounded-full border border-red-500/30">
                Critical
              </span>
            </div>
            <DataTable posts={failedPosts} showAll={true} />
          </div>
        )}

        {/* Low Engagement */}
        {lowEngagementPosts.length > 0 && (
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <TrendingDown className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-semibold font-display text-white">
                Low Engagement ({lowEngagementPosts.length})
              </h2>
              <span className="text-xs font-mono text-amber-400 px-2 py-1 bg-amber-500/20 rounded-full border border-amber-500/30">
                Warning
              </span>
            </div>
            <DataTable posts={lowEngagementPosts.slice(0, 10)} showAll={false} />
            {lowEngagementPosts.length > 10 && (
              <div className="mt-4 text-center">
                <span className="text-sm text-gray-400 font-mono">
                  Showing top 10 of {lowEngagementPosts.length} low-engagement posts
                </span>
              </div>
            )}
          </div>
        )}

        {/* Stale Scheduled */}
        {staleScheduledPosts.length > 0 && (
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <Clock className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold font-display text-white">
                Stale Scheduled Posts ({staleScheduledPosts.length})
              </h2>
              <span className="text-xs font-mono text-blue-400 px-2 py-1 bg-blue-500/20 rounded-full border border-blue-500/30">
                Info
              </span>
            </div>
            <DataTable posts={staleScheduledPosts} showAll={true} />
          </div>
        )}

        {/* Empty State */}
        {needsAttentionPosts.length === 0 && (
          <div className="glass-card p-12 rounded-xl text-center">
            <AlertTriangle className="w-16 h-16 text-emerald-400 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold font-display text-white mb-2">
              All Clear! 🎉
            </h3>
            <p className="text-gray-400 font-mono mb-4">
              No posts require attention at the moment.
            </p>
            <div className="text-sm text-emerald-400">
              Everything is running smoothly.
            </div>
          </div>
        )}
      </div>

      {/* Action Center */}
      {needsAttentionPosts.length > 0 && (
        <div className="glass-card p-6 rounded-xl border border-purple-500/30">
          <h3 className="text-lg font-semibold font-display text-white mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 glass rounded-lg border border-red-500/30 hover:border-red-500/50 transition-colors text-left group">
              <div className="flex items-center space-x-3 mb-2">
                <XCircle className="w-5 h-5 text-red-400" />
                <span className="text-white font-medium">Retry Failed</span>
              </div>
              <p className="text-xs text-gray-400">
                Retry all failed posts with updated settings
              </p>
            </button>

            <button className="p-4 glass rounded-lg border border-amber-500/30 hover:border-amber-500/50 transition-colors text-left group">
              <div className="flex items-center space-x-3 mb-2">
                <TrendingDown className="w-5 h-5 text-amber-400" />
                <span className="text-white font-medium">Boost Low Performers</span>
              </div>
              <p className="text-xs text-gray-400">
                Apply engagement boosting strategies
              </p>
            </button>

            <button className="p-4 glass rounded-lg border border-blue-500/30 hover:border-blue-500/50 transition-colors text-left group">
              <div className="flex items-center space-x-3 mb-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <span className="text-white font-medium">Reschedule Stale</span>
              </div>
              <p className="text-xs text-gray-400">
                Update scheduling for stale posts
              </p>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}