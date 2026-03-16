import Link from 'next/link'
import { ArrowLeft, Calendar, User, TrendingUp, Heart, MessageCircle, Share, ExternalLink } from 'lucide-react'
import { getPostById, getAgentLogs } from '@/lib/db'
import { formatDateTime, formatNumber, getStatusColor, getPlatformColor } from '@/lib/utils'

interface PageProps {
  params: { id: string }
}

export default function PostDetailPage({ params }: PageProps) {
  const post = getPostById(params.id)
  const logs = getAgentLogs(params.id)

  if (!post) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-white mb-2">Post not found</h1>
          <p className="text-gray-400 mb-6">The post you're looking for doesn't exist.</p>
          <Link
            href="/posts"
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            ← Back to Posts
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Link
          href="/posts"
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold font-display text-gradient mb-2">
            Post Details
          </h1>
          <p className="text-gray-400 font-mono">
            {post.handle} • {post.client_name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Post Content */}
          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded text-sm font-medium ${getPlatformColor(post.platform)}`}>
                  {post.platform}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-mono ${getStatusColor(post.status)}`}>
                  {post.status}
                </span>
              </div>
              <div className="text-xs text-gray-400 font-mono">
                ID: {post.id}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Content</h3>
              <p className="text-white leading-relaxed">
                {post.content}
              </p>
            </div>

            {post.media_url && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Media</h3>
                <div className="w-full h-48 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-white/10 flex items-center justify-center">
                  <div className="text-center">
                    <ExternalLink className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm font-mono">Media Preview</p>
                    <a 
                      href={post.media_url} 
                      className="text-purple-400 hover:text-purple-300 text-xs"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {post.media_url}
                    </a>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-400 font-mono mb-1">Account</div>
                <div className="text-white font-medium">{post.account_name}</div>
                <div className="text-gray-400 text-xs font-mono">{post.handle}</div>
              </div>
              <div>
                <div className="text-gray-400 font-mono mb-1">Agent</div>
                <div className="text-white font-medium flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>{post.agent_id}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Agent Activity Log */}
          <div className="glass-card p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Agent Activity Log</h3>
            <div className="space-y-3">
              {logs.map((log: any) => (
                <div key={log.id} className="flex items-start space-x-3 p-3 glass rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    log.status === 'success' ? 'bg-emerald-400' : 
                    log.status === 'error' ? 'bg-red-400' : 'bg-amber-400'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium text-sm">{log.action.replace('_', ' ')}</span>
                      <span className="text-gray-400 text-xs font-mono">
                        {formatDateTime(log.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">{log.log}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs">
                      <span className="text-gray-500 font-mono">Agent: {log.agent_id}</span>
                      <span className={`px-2 py-1 rounded text-xs font-mono ${
                        log.status === 'success' ? 'bg-emerald-500/20 text-emerald-300' :
                        log.status === 'error' ? 'bg-red-500/20 text-red-300' :
                        'bg-amber-500/20 text-amber-300'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <div className="glass-card p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Timeline</h3>
            <div className="space-y-4">
              <div>
                <div className="text-gray-400 text-xs font-mono mb-1">Created</div>
                <div className="text-white text-sm flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDateTime(post.created_at)}</span>
                </div>
              </div>
              {post.published_at && (
                <div>
                  <div className="text-gray-400 text-xs font-mono mb-1">Published</div>
                  <div className="text-emerald-400 text-sm flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDateTime(post.published_at)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Performance Metrics */}
          {post.status === 'posted' && (post.impressions || post.likes || post.comments) && (
            <div className="glass-card p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-4">Performance</h3>
              <div className="space-y-4">
                {post.impressions && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-gray-400">Impressions</span>
                    </div>
                    <span className="text-white font-bold">{formatNumber(post.impressions)}</span>
                  </div>
                )}
                {post.likes && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Heart className="w-4 h-4 text-pink-400" />
                      <span className="text-sm text-gray-400">Likes</span>
                    </div>
                    <span className="text-white font-bold">{formatNumber(post.likes)}</span>
                  </div>
                )}
                {post.comments && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-gray-400">Comments</span>
                    </div>
                    <span className="text-white font-bold">{formatNumber(post.comments)}</span>
                  </div>
                )}
                {post.shares && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Share className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-gray-400">Shares</span>
                    </div>
                    <span className="text-white font-bold">{formatNumber(post.shares)}</span>
                  </div>
                )}
                {post.engagement_rate && (
                  <div className="pt-4 border-t border-white/10">
                    <div className="text-center">
                      <div className="text-2xl font-bold font-display text-gradient mb-1">
                        {post.engagement_rate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-400 font-mono">
                        Engagement Rate
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}