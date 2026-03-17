'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboard-layout';
import MetricCard from '@/components/ui/metric-card';
import StatusBadge from '@/components/ui/status-badge';
import PlatformBadge from '@/components/ui/platform-badge';
import { companies, getCompanyBySlug } from '@/lib/companies';
import {
  BarChart,
  Users,
  FileText,
  TrendingUp,
  Activity,
  AlertTriangle,
  Clock,
  Eye,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface OverviewStats {
  postsToday: number;
  postsThisWeek: number;
  totalImpressions: number;
  avgEngagementRate: number;
  activeAccounts: number;
  successRate: number;
  lowEngagementPosts: number;
}

interface Post {
  id: string;
  content: string;
  handle: string;
  platform: string;
  client_name: string;
  status: 'posted' | 'scheduled' | 'failed' | 'draft';
  created_at: string;
  agent_id: string;
  tiktok_url: string | null;
}

interface ChartData {
  postsOverTime: Array<{ date: string; count: number }>;
  impressionsOverTime: Array<{ date: string; impressions: number }>;
}

interface CompanySummary {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'onboarding' | 'paused';
  platforms: string[];
  color: string;
  postCount: number;
  postsThisWeek: number;
  hasPostBridgeData: boolean;
}

interface AccountData {
  id: number;
  username: string;
  platform: string;
  companySlug: string;
  companyName: string;
  companyColor: string;
  postsLive: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  avgViews: number;
  recentActivity: number[];
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const h = 24;
  const w = 56;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (v / max) * (h - 2) - 1;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} className="opacity-60">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const currentCompany = searchParams.get('company') || 'all';
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [companySummaries, setCompanySummaries] = useState<CompanySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState(7);
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);
  const [companyAccounts, setCompanyAccounts] = useState<Record<string, AccountData[]>>({});
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null); // username filter
  const [accountPosts, setAccountPosts] = useState<Post[]>([]);

  const fetchData = async (fresh = false) => {
    try {
      const freshParam = fresh ? '&fresh=1' : '';
      const overviewUrl = currentCompany === 'all' 
        ? `/api/overview?days=${timePeriod}${fresh ? '&fresh=1' : ''}` 
        : `/api/overview?company=${currentCompany}&days=${timePeriod}${freshParam}`;
      const postsUrl = currentCompany === 'all' 
        ? `/api/posts?limit=20${freshParam}` 
        : `/api/posts?limit=20&company=${currentCompany}${freshParam}`;
      
      const [overviewRes, postsRes] = await Promise.all([fetch(overviewUrl), fetch(postsUrl)]);
      const [overviewData, postsData] = await Promise.all([overviewRes.json(), postsRes.json()]);
      
      setStats(overviewData.stats);
      setCharts(overviewData.charts);
      setCompanySummaries(overviewData.companySummaries || []);
      setFetchedAt(new Date().toISOString()); // Use actual fetch time, not cached time
      setPosts(postsData.posts ?? []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleCompanyExpand = useCallback(async (slug: string) => {
    if (expandedCompany === slug) {
      setExpandedCompany(null);
      setSelectedAccount(null);
      return;
    }
    setExpandedCompany(slug);
    setSelectedAccount(null);
    if (!companyAccounts[slug]) {
      try {
        const res = await fetch(`/api/accounts?company=${slug}`);
        const data = await res.json();
        setCompanyAccounts(prev => ({ ...prev, [slug]: data.accounts }));
      } catch (e) {
        console.error('Failed to fetch accounts:', e);
      }
    }
  }, [expandedCompany, companyAccounts]);

  const handleAccountClick = useCallback(async (username: string) => {
    if (selectedAccount === username) {
      setSelectedAccount(null);
      return;
    }
    setSelectedAccount(username);
    try {
      const res = await fetch(`/api/posts?limit=50&company=${expandedCompany}`);
      const data = await res.json();
      // Filter posts by account username (handle field)
      setAccountPosts((data.posts ?? []).filter((p: Post) => 
        p.handle?.toLowerCase() === username.toLowerCase() || p.handle?.toLowerCase() === `@${username.toLowerCase()}`
      ));
    } catch (e) {
      console.error('Failed to fetch account posts:', e);
    }
  }, [selectedAccount, expandedCompany]);

  // Load from cache on page load / filter change (no API call to PostBridge)
  useEffect(() => {
    fetchData(false);
  }, [currentCompany, timePeriod]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Trigger analytics sync first
    try { await fetch('/api/refresh', { method: 'POST' }); } catch {}
    // Wait for TikTok data to propagate
    await new Promise(r => setTimeout(r, 3000));
    await fetchData(true);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateContent = (content: string, maxLength = 80) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-8">
          <div className="animate-pulse space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton h-32 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="skeleton h-80 rounded-lg"></div>
              <div className="skeleton h-80 rounded-lg"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Overview">
      <div className="p-4 md:p-8 space-y-8">
        {/* Refresh bar */}
        <div className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800 rounded-md px-4 py-2">
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
            <div className={`w-1.5 h-1.5 rounded-full ${refreshing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
            {fetchedAt ? (
              <>
                <span>Live data</span>
                <span className="text-zinc-600">·</span>
                <span>synced {new Date(fetchedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </>
            ) : 'Loading...'}
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-zinc-400 border border-zinc-700 rounded-md hover:text-zinc-50 hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            <svg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? 'Syncing from TikTok...' : 'Sync Now'}
          </button>
        </div>

        {/* Metrics Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <MetricCard
              title="Posts Today"
              value={stats.postsToday}
              subtitle={`${stats.postsThisWeek} this week`}
              icon={FileText}
              changeType="positive"
            />
            <MetricCard
              title="Total Views"
              value={formatNumber(stats.totalImpressions)}
              subtitle={currentCompany === 'all' ? 'Across all platforms' : `For ${getCompanyBySlug(currentCompany)?.name}`}
              icon={Eye}
              changeType="positive"
            />
            <MetricCard
              title="Total Live"
              value={stats.totalLive || 0}
              subtitle={`${stats.totalQueued || 0} queued in TikTok inbox`}
              icon={TrendingUp}
              changeType="positive"
            />
            <MetricCard
              title="Active Accounts"
              value={stats.activeAccounts}
              subtitle="Posting regularly"
              icon={Users}
              changeType="positive"
            />
          </div>
        )}

        {/* Company Summaries (only when viewing all companies) */}
        {currentCompany === 'all' && companySummaries.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-md p-6">
            <h3 className="text-lg font-semibold text-zinc-50 mb-6" style={{ fontFamily: 'var(--font-display)' }}>
              Company Overview
            </h3>
            <div className="space-y-4">
              {companySummaries.map((company) => {
                const isExpanded = expandedCompany === company.slug;
                const accounts = companyAccounts[company.slug] || [];
                return (
                  <div key={company.id}>
                    <div 
                      className="bg-zinc-800/50 border border-zinc-700 p-4 rounded-md hover:bg-zinc-800 transition-colors cursor-pointer"
                      style={{ borderLeftColor: company.color, borderLeftWidth: '3px' }}
                      onClick={() => company.hasPostBridgeData && toggleCompanyExpand(company.slug)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {company.hasPostBridgeData ? (
                            isExpanded ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />
                          ) : <div className="w-4" />}
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: company.color }}
                          />
                          <h4 className="font-semibold text-zinc-50" style={{ fontFamily: 'var(--font-display)' }}>
                            {company.name}
                          </h4>
                          <div className={`text-xs px-2 py-0.5 rounded-full ${
                            company.status === 'active' 
                              ? 'bg-emerald-900/50 text-emerald-400' 
                              : company.status === 'onboarding'
                              ? 'bg-blue-900/50 text-blue-400'
                              : 'bg-zinc-800 text-zinc-500'
                          }`}>
                            {company.status}
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-zinc-400">
                            <span className="text-zinc-50 font-mono">{company.postCount}</span> posts
                          </div>
                          <div className="text-zinc-400">
                            <span className="text-zinc-50 font-mono">{company.postsThisWeek}</span> this week
                          </div>
                          <div className="flex space-x-1">
                            {company.platforms.map((platform) => (
                              <PlatformBadge key={platform} platform={platform} size="sm" showIcon={false} />
                            ))}
                          </div>
                          {!company.hasPostBridgeData && (
                            <div className="text-xs text-amber-400 bg-amber-900/20 px-2 py-1 rounded">
                              No PostBridge data yet
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded account cards */}
                    {isExpanded && (
                      <div className="mt-3 ml-6">
                        {accounts.length === 0 ? (
                          <div className="text-sm text-zinc-500 py-4">Loading accounts...</div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                            {accounts.map((acc) => {
                              const isSelected = selectedAccount === acc.username.toLowerCase();
                              return (
                                <div key={acc.id}>
                                  <div
                                    className={`bg-zinc-800/70 border p-4 rounded-md hover:bg-zinc-800 transition-colors cursor-pointer ${
                                      isSelected ? 'border-zinc-500 bg-zinc-800' : 'border-zinc-700/50'
                                    }`}
                                    onClick={(e) => { e.stopPropagation(); handleAccountClick(acc.username.toLowerCase()); }}
                                  >
                                    <div className="flex items-center justify-between mb-3">
                                      <span className="text-zinc-50 font-semibold text-sm" style={{ fontFamily: 'var(--font-display)' }}>
                                        @{acc.username}
                                      </span>
                                      <MiniSparkline data={acc.recentActivity} color={company.color} />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                      <div>
                                        <div className="text-zinc-500">Posts</div>
                                        <div className="text-zinc-50 font-mono">{acc.postsLive}</div>
                                      </div>
                                      <div>
                                        <div className="text-zinc-500">Views</div>
                                        <div className="text-zinc-50 font-mono">{formatNumber(acc.totalViews)}</div>
                                      </div>
                                      <div>
                                        <div className="text-zinc-500">Avg Views</div>
                                        <div className="text-zinc-50 font-mono">{formatNumber(acc.avgViews)}</div>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                                      <div>
                                        <div className="text-zinc-500">Likes</div>
                                        <div className="text-zinc-50 font-mono">{formatNumber(acc.totalLikes)}</div>
                                      </div>
                                      <div>
                                        <div className="text-zinc-500">Comments</div>
                                        <div className="text-zinc-50 font-mono">{formatNumber(acc.totalComments)}</div>
                                      </div>
                                      <div>
                                        <div className="text-zinc-500">Shares</div>
                                        <div className="text-zinc-50 font-mono">{formatNumber(acc.totalShares)}</div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Account posts inline */}
                                  {isSelected && accountPosts.length > 0 && (
                                    <div className="mt-2 bg-zinc-900/50 border border-zinc-800 rounded-md p-3 space-y-1">
                                      <div className="text-xs text-zinc-500 mb-2 font-mono">Posts by @{acc.username}</div>
                                      {accountPosts.slice(0, 10).map((post) => (
                                        <div key={post.id} className="flex items-center gap-3 py-2 border-b border-zinc-800/50 last:border-0">
                                          <StatusBadge status={post.status} />
                                          <p className="text-zinc-300 text-xs truncate flex-1">{truncateContent(post.content, 60)}</p>
                                          <span className="text-xs text-zinc-600 font-mono">{formatDate(post.created_at)}</span>
                                        </div>
                                      ))}
                                      {accountPosts.length > 10 && (
                                        <div className="text-xs text-zinc-600 pt-1">+{accountPosts.length - 10} more</div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Time period toggle */}
        <div className="flex items-center gap-1">
          {[7, 14, 30].map(d => (
            <button
              key={d}
              onClick={() => setTimePeriod(d)}
              className={`px-3 py-1.5 text-xs font-mono rounded-md cursor-pointer transition-colors ${
                timePeriod === d
                  ? 'bg-zinc-800 text-zinc-50 border border-zinc-700'
                  : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Posts Over Time */}
          {charts?.postsOverTime && (
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-md">
              <h3 className="text-lg font-semibold text-zinc-50 mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                Posts Activity ({timePeriod}d)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.postsOverTime}>
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#71717a', fontSize: 12 }}
                      axisLine={{ stroke: '#27272a' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: '#71717a', fontSize: 12 }}
                      axisLine={{ stroke: '#27272a' }}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#18181b',
                        border: '1px solid #27272a',
                        borderRadius: '6px',
                        color: '#fafafa'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Impressions Over Time */}
          {charts?.impressionsOverTime && (
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-md">
              <h3 className="text-lg font-semibold text-zinc-50 mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                Views ({timePeriod}d)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.impressionsOverTime}>
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#71717a', fontSize: 12 }}
                      axisLine={{ stroke: '#27272a' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: '#71717a', fontSize: 12 }}
                      axisLine={{ stroke: '#27272a' }}
                      tickLine={false}
                      tickFormatter={formatNumber}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#18181b',
                        border: '1px solid #27272a',
                        borderRadius: '6px',
                        color: '#fafafa'
                      }}
                      formatter={(value) => [formatNumber(Number(value)), 'Views']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="impressions" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Recent Posts Feed */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-md p-6">
          <h3 className="text-lg font-semibold text-zinc-50 mb-6" style={{ fontFamily: 'var(--font-display)' }}>
            Recent Posts
          </h3>
          <div className="space-y-1">
            {posts.map((post) => (
              <div 
                key={post.id} 
                className="flex items-center gap-4 p-4 hover:bg-zinc-800/50 transition-colors cursor-pointer rounded border-b border-zinc-800 last:border-b-0"
              >
                <div className="flex items-center gap-2 w-16">
                  <PlatformBadge platform={post.platform} size="sm" showIcon={true} />
                </div>
                <div className="flex items-center gap-2 w-32">
                  <span className="text-sm text-zinc-400 font-mono truncate">
                    {post.handle}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-zinc-50 text-sm truncate">
                    {truncateContent(post.content)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={post.status} />
                  <span className="text-xs text-zinc-500 font-mono w-20 text-right">
                    {formatDate(post.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="p-8">
          <div className="animate-pulse space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton h-32 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="skeleton h-80 rounded-lg"></div>
              <div className="skeleton h-80 rounded-lg"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    }>
      <DashboardContent />
    </Suspense>
  )
}