'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AlertTriangle, TrendingDown, XCircle, Clock } from 'lucide-react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import StatusBadge from '@/components/ui/status-badge'
import PlatformBadge from '@/components/ui/platform-badge'
import { getCompanyBySlug } from '@/lib/companies'

function NeedsAttentionContent() {
  const searchParams = useSearchParams()
  const currentCompany = searchParams.get('company') || 'all'
  const [failedPosts, setFailedPosts] = useState<any[]>([])
  const [lowEngagementPosts, setLowEngagementPosts] = useState<any[]>([])
  const [staleScheduledPosts, setStaleScheduledPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const company = currentCompany !== 'all' ? getCompanyBySlug(currentCompany) : null
  const hasNoPostBridgeData = company && company.postbridgeAccountIds.length === 0

  useEffect(() => {
    const url = currentCompany === 'all' ? '/api/needs-attention' : `/api/needs-attention?company=${currentCompany}`
    fetch(url)
      .then(r => r.json())
      .then(data => {
        setFailedPosts(data.failedPosts || [])
        setLowEngagementPosts(data.lowEngagementPosts || [])
        setStaleScheduledPosts(data.staleScheduledPosts || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [currentCompany])

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  const truncateContent = (content: string, maxLength = 100) =>
    content.length <= maxLength ? content : content.substring(0, maxLength) + '...'

  const total = failedPosts.length + lowEngagementPosts.length + staleScheduledPosts.length
  const pageTitle = currentCompany === 'all' ? 'Needs Attention' : `Needs Attention - ${company?.name}`

  if (loading) {
    return <DashboardLayout title={pageTitle}><div className="p-4 md:p-8"><div className="text-zinc-500 font-mono text-sm">Loading...</div></div></DashboardLayout>
  }

  // Show empty state for companies without PostBridge data
  if (hasNoPostBridgeData) {
    return (
      <DashboardLayout title={pageTitle}>
        <div className="p-4 md:p-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-md p-8 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${company?.color}20`, border: `1px solid ${company?.color}` }}
              >
                <AlertTriangle className="w-6 h-6" style={{ color: company?.color }} />
              </div>
              <h3 className="text-lg font-semibold text-zinc-50" style={{ fontFamily: 'var(--font-display)' }}>
                No data available for {company?.name}
              </h3>
              <p className="text-zinc-400 max-w-md">
                This company's accounts are not connected to PostBridge yet. Once connected, attention alerts will appear here.
              </p>
              <div className={`text-xs px-3 py-1 rounded-full ${
                company?.status === 'onboarding'
                  ? 'bg-blue-900/50 text-blue-400 border border-blue-700'
                  : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
              }`}>
                Status: {company?.status}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title={pageTitle}>
      <div className="p-4 md:p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 border-l-4 border-l-red-500 p-6 rounded-md">
            <div className="flex items-center justify-between mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
              <span className="text-xs font-mono text-red-400 px-2 py-1 bg-zinc-900 rounded border border-red-500/20">Critical</span>
            </div>
            <div className="text-2xl font-bold font-mono text-zinc-50 mb-1">{failedPosts.length}</div>
            <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Failed Posts</div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 border-l-4 border-l-amber-500 p-6 rounded-md">
            <div className="flex items-center justify-between mb-4">
              <TrendingDown className="w-8 h-8 text-amber-500" />
              <span className="text-xs font-mono text-amber-400 px-2 py-1 bg-zinc-900 rounded border border-amber-500/20">Warning</span>
            </div>
            <div className="text-2xl font-bold font-mono text-zinc-50 mb-1">{lowEngagementPosts.length}</div>
            <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Low Engagement</div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 border-l-4 border-l-blue-500 p-6 rounded-md">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 text-blue-500" />
              <span className="text-xs font-mono text-blue-400 px-2 py-1 bg-zinc-900 rounded border border-blue-500/20">Info</span>
            </div>
            <div className="text-2xl font-bold font-mono text-zinc-50 mb-1">{staleScheduledPosts.length}</div>
            <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Stale Scheduled</div>
          </div>
        </div>

        {failedPosts.length > 0 && (
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <XCircle className="w-5 h-5 text-red-500" />
              <h2 className="text-xl font-semibold text-zinc-50" style={{ fontFamily: 'var(--font-display)' }}>Failed Posts ({failedPosts.length})</h2>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-md overflow-hidden">
              <table className="data-table">
                <thead><tr><th>Content</th><th>Platform</th><th>Client</th><th>Status</th><th>Created</th></tr></thead>
                <tbody>
                  {failedPosts.map((post: any) => (
                    <tr key={post.id}>
                      <td className="max-w-md"><p className="text-zinc-50">{truncateContent(post.content)}</p><p className="text-sm text-zinc-400 mt-1 font-mono">{post.handle}</p></td>
                      <td><PlatformBadge platform={post.platform} showIcon={true} /></td>
                      <td><span className="text-zinc-50">{post.client_name}</span></td>
                      <td><StatusBadge status={post.status} /></td>
                      <td><span className="text-zinc-400 text-sm font-mono">{formatDate(post.created_at)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {total === 0 && (
          <div className="bg-zinc-900 border border-zinc-800 p-12 rounded-md text-center">
            <AlertTriangle className="w-16 h-16 text-emerald-500 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-zinc-50 mb-2" style={{ fontFamily: 'var(--font-display)' }}>All Clear</h3>
            <p className="text-zinc-400 font-mono">No posts require attention.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
