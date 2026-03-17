'use client';

import { useState, useEffect, Fragment, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboard-layout';
import StatusBadge from '@/components/ui/status-badge';
import PlatformBadge from '@/components/ui/platform-badge';
import { getCompanyBySlug } from '@/lib/companies';
import { Search, ExternalLink, Clock, Eye, Heart, MessageCircle, Share2 } from 'lucide-react';

interface Post {
  id: string;
  content: string;
  handle: string;
  account_name: string;
  platform: string;
  client_name: string;
  status: 'posted' | 'scheduled' | 'failed' | 'draft';
  agent_id: string;
  created_at: string;
  published_at: string | null;
  tiktok_url: string | null;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  engagement_rate: number;
}

function PostsContent() {
  const searchParams = useSearchParams();
  const currentCompany = searchParams.get('company') || 'all';
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedPost, setExpandedPost] = useState<string | null>(null);

  const company = currentCompany !== 'all' ? getCompanyBySlug(currentCompany) : null;
  const hasNoPostBridgeData = company && company.postbridgeAccountIds.length === 0;

  useEffect(() => {
    const url = currentCompany === 'all' ? '/api/posts?limit=100' : `/api/posts?limit=100&company=${currentCompany}`;
    fetch(url)
      .then(r => r.json())
      .then(data => { setPosts(data.posts || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [currentCompany]);

  const filtered = posts.filter(p => {
    const matchSearch = !searchTerm ||
      p.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.handle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const formatDate = (d: string) => {
    const date = new Date(d);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const truncate = (s: string, n = 90) => s.length <= n ? s : s.substring(0, n) + '...';

  if (loading) {
    return <DashboardLayout title="Posts"><div className="p-4 md:p-8 text-zinc-500 font-mono text-sm">Loading...</div></DashboardLayout>;
  }

  // Show empty state for companies without PostBridge data
  if (hasNoPostBridgeData) {
    return (
      <DashboardLayout title={`Posts - ${company?.name}`}>
        <div className="p-4 md:p-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-md p-8 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${company?.color}20`, border: `1px solid ${company?.color}` }}
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: company?.color }}
                ></div>
              </div>
              <h3 className="text-lg font-semibold text-zinc-50" style={{ fontFamily: 'var(--font-display)' }}>
                No posts yet for {company?.name}
              </h3>
              <p className="text-zinc-400 max-w-md">
                This company's accounts are not connected to PostBridge yet. Once connected, posts will appear here.
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
    );
  }

  const pageTitle = currentCompany === 'all' ? 'Posts' : `Posts - ${company?.name}`;

  return (
    <DashboardLayout title={pageTitle}>
      <div className="p-4 md:p-8 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search posts or handles..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-50 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 cursor-text"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-50 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="posted">Posted</option>
            <option value="scheduled">Scheduled</option>
            <option value="failed">Failed</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        <div className="text-xs text-zinc-500 font-mono">{filtered.length} posts</div>

        {/* Posts Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-md overflow-x-auto">
          <table className="data-table min-w-[700px]">
            <thead>
              <tr>
                <th>Content</th>
                <th>Account</th>
                <th>Status</th>
                <th>Views</th>
                <th>Engagement</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(post => (
                <Fragment key={post.id}>
                  <tr
                    onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                    className="cursor-pointer"
                  >
                    <td className="max-w-md">
                      <p className="text-zinc-50 leading-relaxed">{truncate(post.content)}</p>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <PlatformBadge platform={post.platform} showIcon={true} />
                        <span className="text-zinc-400 font-mono text-sm">{post.handle}</span>
                      </div>
                    </td>
                    <td><StatusBadge status={post.status} /></td>
                    <td>
                      <span className="text-zinc-50 font-mono text-sm">
                        {post.impressions > 0 ? post.impressions.toLocaleString() : '—'}
                      </span>
                    </td>
                    <td>
                      {post.impressions > 0 ? (
                        <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{post.likes}</span>
                          <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{post.comments}</span>
                          <span className="flex items-center gap-1"><Share2 className="w-3 h-3" />{post.shares}</span>
                        </div>
                      ) : <span className="text-zinc-600 text-sm">—</span>}
                    </td>
                    <td>
                      <span className="text-zinc-400 text-sm font-mono">{formatDate(post.created_at)}</span>
                    </td>
                    <td>
                      {post.tiktok_url && (
                        <a
                          href={post.tiktok_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="p-2 hover:bg-zinc-800/50 rounded-md transition-colors inline-flex cursor-pointer"
                          title="View on TikTok"
                        >
                          <ExternalLink className="w-4 h-4 text-zinc-500 hover:text-emerald-400" />
                        </a>
                      )}
                    </td>
                  </tr>

                  {expandedPost === post.id && (
                    <tr>
                      <td colSpan={7} className="bg-zinc-800/20 border-t border-zinc-800">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-2">Full Caption</h4>
                            <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                          </div>
                          <div className="flex gap-8 text-sm">
                            <div>
                              <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">Account</span>
                              <p className="text-zinc-50 font-mono">{post.handle} ({post.account_name})</p>
                            </div>
                            <div>
                              <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">Posted</span>
                              <p className="text-zinc-50 font-mono">{formatDate(post.created_at)}</p>
                            </div>
                            {post.impressions > 0 && (
                              <div>
                                <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">Views</span>
                                <p className="text-zinc-50 font-mono">{post.impressions.toLocaleString()}</p>
                              </div>
                            )}
                            {post.tiktok_url && (
                              <div>
                                <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">Link</span>
                                <a href={post.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline block cursor-pointer">
                                  View on TikTok
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
