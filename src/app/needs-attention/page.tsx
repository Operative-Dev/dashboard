import { AlertTriangle, TrendingDown, XCircle, Clock } from 'lucide-react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import StatusBadge from '@/components/ui/status-badge'
import PlatformBadge from '@/components/ui/platform-badge'
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateContent = (content: string, maxLength = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <DashboardLayout title="Needs Attention">
      <div className="p-8 space-y-8">
        {/* Alert Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 border-l-4 border-l-red-500 p-6 rounded-md">
            <div className="flex items-center justify-between mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
              <span className="text-xs font-mono text-red-400 px-2 py-1 bg-zinc-900 rounded border border-red-500/20">
                Critical
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-zinc-50 mb-1">
              {failedPosts.length}
            </div>
            <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider">
              Failed Posts
            </div>
            <div className="text-xs text-red-400 mt-2">
              Requires immediate action
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 border-l-4 border-l-amber-500 p-6 rounded-md">
            <div className="flex items-center justify-between mb-4">
              <TrendingDown className="w-8 h-8 text-amber-500" />
              <span className="text-xs font-mono text-amber-400 px-2 py-1 bg-zinc-900 rounded border border-amber-500/20">
                Warning
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-zinc-50 mb-1">
              {lowEngagementPosts.length}
            </div>
            <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider">
              Low Engagement
            </div>
            <div className="text-xs text-amber-400 mt-2">
              &lt; 1% engagement rate
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 border-l-4 border-l-blue-500 p-6 rounded-md">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 text-blue-500" />
              <span className="text-xs font-mono text-blue-400 px-2 py-1 bg-zinc-900 rounded border border-blue-500/20">
                Info
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-zinc-50 mb-1">
              {staleScheduledPosts.length}
            </div>
            <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider">
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
                <XCircle className="w-5 h-5 text-red-500" />
                <h2 className="text-xl font-semibold text-zinc-50" style={{ fontFamily: 'var(--font-display)' }}>
                  Failed Posts ({failedPosts.length})
                </h2>
                <span className="text-xs font-mono text-red-400 px-2 py-1 bg-zinc-900 rounded border border-red-500/20">
                  Critical
                </span>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-md overflow-hidden">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Content</th>
                      <th>Platform</th>
                      <th>Client</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {failedPosts.map((post: any) => (
                      <tr key={post.id}>
                        <td className="max-w-md">
                          <p className="text-zinc-50 leading-relaxed">
                            {truncateContent(post.content)}
                          </p>
                          <p className="text-sm text-zinc-400 mt-1 font-mono">
                            {post.handle}
                          </p>
                        </td>
                        <td>
                          <PlatformBadge platform={post.platform} showIcon={true} />
                        </td>
                        <td>
                          <span className="text-zinc-50 font-medium">
                            {post.client_name}
                          </span>
                        </td>
                        <td>
                          <StatusBadge status={post.status} />
                        </td>
                        <td>
                          <span className="text-zinc-400 text-sm font-mono">
                            {formatDate(post.created_at)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Low Engagement */}
          {lowEngagementPosts.length > 0 && (
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <TrendingDown className="w-5 h-5 text-amber-500" />
                <h2 className="text-xl font-semibold text-zinc-50" style={{ fontFamily: 'var(--font-display)' }}>
                  Low Engagement ({lowEngagementPosts.length})
                </h2>
                <span className="text-xs font-mono text-amber-400 px-2 py-1 bg-zinc-900 rounded border border-amber-500/20">
                  Warning
                </span>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-md overflow-hidden">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Content</th>
                      <th>Platform</th>
                      <th>Engagement</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowEngagementPosts.slice(0, 10).map((post: any) => (
                      <tr key={post.id}>
                        <td className="max-w-md">
                          <p className="text-zinc-50 leading-relaxed">
                            {truncateContent(post.content)}
                          </p>
                          <p className="text-sm text-zinc-400 mt-1 font-mono">
                            {post.handle}
                          </p>
                        </td>
                        <td>
                          <PlatformBadge platform={post.platform} showIcon={true} />
                        </td>
                        <td>
                          <span className="text-amber-400 font-mono">
                            {post.engagement_rate}%
                          </span>
                        </td>
                        <td>
                          <StatusBadge status={post.status} />
                        </td>
                        <td>
                          <span className="text-zinc-400 text-sm font-mono">
                            {formatDate(post.created_at)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {lowEngagementPosts.length > 10 && (
                <div className="mt-4 text-center">
                  <span className="text-sm text-zinc-400 font-mono">
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
                <Clock className="w-5 h-5 text-blue-500" />
                <h2 className="text-xl font-semibold text-zinc-50" style={{ fontFamily: 'var(--font-display)' }}>
                  Stale Scheduled Posts ({staleScheduledPosts.length})
                </h2>
                <span className="text-xs font-mono text-blue-400 px-2 py-1 bg-zinc-900 rounded border border-blue-500/20">
                  Info
                </span>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-md overflow-hidden">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Content</th>
                      <th>Platform</th>
                      <th>Client</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staleScheduledPosts.map((post: any) => (
                      <tr key={post.id}>
                        <td className="max-w-md">
                          <p className="text-zinc-50 leading-relaxed">
                            {truncateContent(post.content)}
                          </p>
                          <p className="text-sm text-zinc-400 mt-1 font-mono">
                            {post.handle}
                          </p>
                        </td>
                        <td>
                          <PlatformBadge platform={post.platform} showIcon={true} />
                        </td>
                        <td>
                          <span className="text-zinc-50 font-medium">
                            {post.client_name}
                          </span>
                        </td>
                        <td>
                          <StatusBadge status={post.status} />
                        </td>
                        <td>
                          <span className="text-zinc-400 text-sm font-mono">
                            {formatDate(post.created_at)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty State */}
          {needsAttentionPosts.length === 0 && (
            <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-md text-center">
              <AlertTriangle className="w-16 h-16 text-emerald-500 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold text-zinc-50 mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                All Clear
              </h3>
              <p className="text-zinc-400 font-mono mb-4">
                No posts require attention at the moment.
              </p>
              <div className="text-sm text-emerald-500">
                Everything is running smoothly.
              </div>
            </div>
          )}
        </div>

        {/* Action Center */}
        {needsAttentionPosts.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-md">
            <h3 className="text-lg font-semibold text-zinc-50 mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="p-4 bg-zinc-900 border border-red-500/20 rounded hover:border-red-500/40 hover:bg-zinc-800/50 transition-colors text-left cursor-pointer">
                <div className="flex items-center space-x-3 mb-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-zinc-50 font-medium">Retry Failed</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Retry all failed posts with updated settings
                </p>
              </button>

              <button className="p-4 bg-zinc-900 border border-amber-500/20 rounded hover:border-amber-500/40 hover:bg-zinc-800/50 transition-colors text-left cursor-pointer">
                <div className="flex items-center space-x-3 mb-2">
                  <TrendingDown className="w-5 h-5 text-amber-500" />
                  <span className="text-zinc-50 font-medium">Boost Low Performers</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Apply engagement boosting strategies
                </p>
              </button>

              <button className="p-4 bg-zinc-900 border border-blue-500/20 rounded hover:border-blue-500/40 hover:bg-zinc-800/50 transition-colors text-left cursor-pointer">
                <div className="flex items-center space-x-3 mb-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span className="text-zinc-50 font-medium">Reschedule Stale</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Update scheduling for stale posts
                </p>
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}