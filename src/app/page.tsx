'use client';

import { useState, useEffect } from 'react';
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
  Eye
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface OverviewStats {
  postsToday: number;
  postsThisWeek: number;
  totalImpressions: number;
  avgEngagementRate: number;
  activeClients: number;
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

export default function Dashboard() {
  const searchParams = useSearchParams();
  const currentCompany = searchParams.get('company') || 'all';
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [companySummaries, setCompanySummaries] = useState<CompanySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Build API URLs with company parameter
        const overviewUrl = currentCompany === 'all' ? '/api/overview' : `/api/overview?company=${currentCompany}`;
        const postsUrl = currentCompany === 'all' ? '/api/posts?limit=20' : `/api/posts?limit=20&company=${currentCompany}`;
        
        // Fetch overview stats
        const overviewRes = await fetch(overviewUrl);
        const overviewData = await overviewRes.json();
        setStats(overviewData.stats);
        setCharts(overviewData.charts);
        setCompanySummaries(overviewData.companySummaries || []);

        // Fetch recent posts
        const postsRes = await fetch(postsUrl);
        const postsData = await postsRes.json();
        setPosts(postsData.posts);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [currentCompany]);

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
    );
  }

  return (
    <DashboardLayout title="Overview">
      <div className="p-8 space-y-8">
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
              title="Success Rate"
              value={`${stats.successRate}%`}
              subtitle="Posts published successfully"
              icon={TrendingUp}
              changeType={stats.successRate >= 95 ? 'positive' : 'negative'}
            />
            <MetricCard
              title="Active Accounts"
              value={stats.activeClients}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {companySummaries.map((company) => (
                <div 
                  key={company.id} 
                  className="bg-zinc-800/50 border border-zinc-700 p-4 rounded-md hover:bg-zinc-800 transition-colors cursor-pointer"
                  style={{ borderLeftColor: company.color, borderLeftWidth: '3px' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: company.color }}
                      ></div>
                      <h4 className="font-semibold text-zinc-50" style={{ fontFamily: 'var(--font-display)' }}>
                        {company.name}
                      </h4>
                    </div>
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
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Total Posts:</span>
                      <span className="text-zinc-50 font-mono">{company.postCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">This Week:</span>
                      <span className="text-zinc-50 font-mono">{company.postsThisWeek}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Platforms:</span>
                      <div className="flex space-x-1">
                        {company.platforms.map((platform) => (
                          <PlatformBadge key={platform} platform={platform} size="sm" showIcon={false} />
                        ))}
                      </div>
                    </div>
                    {!company.hasPostBridgeData && (
                      <div className="text-xs text-amber-400 bg-amber-900/20 px-2 py-1 rounded">
                        No PostBridge data yet
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Posts Over Time */}
          {charts?.postsOverTime && (
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-md">
              <h3 className="text-lg font-semibold text-zinc-50 mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                Posts Activity (7 days)
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
                Views (7 days)
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
                      formatter={[formatNumber, 'Views']}
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