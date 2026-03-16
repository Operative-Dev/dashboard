'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import MetricCard from '@/components/ui/metric-card';
import StatusBadge from '@/components/ui/status-badge';
import PlatformBadge from '@/components/ui/platform-badge';
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
  clientName: string;
  status: 'posted' | 'scheduled' | 'failed' | 'draft';
  createdAt: string;
  agentId: string;
}

interface ChartData {
  postsOverTime: Array<{ date: string; count: number }>;
  impressionsOverTime: Array<{ date: string; impressions: number }>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch overview stats
        const overviewRes = await fetch('/api/overview');
        const overviewData = await overviewRes.json();
        setStats(overviewData.stats);
        setCharts(overviewData.charts);

        // Fetch recent posts
        const postsRes = await fetch('/api/posts?limit=20');
        const postsData = await postsRes.json();
        setPosts(postsData.posts);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

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
    return new Date(dateString).toLocaleDateString('en-US', {
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
    <DashboardLayout 
      title="Mission Control" 
      subtitle="Real-time insights into your AI posting agents"
    >
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
              title="Total Impressions"
              value={formatNumber(stats.totalImpressions)}
              subtitle="Across all platforms"
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
              title="Active Clients"
              value={stats.activeClients}
              subtitle="Posting regularly"
              icon={Users}
              changeType="positive"
            />
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Posts Over Time */}
          {charts?.postsOverTime && (
            <div className="chart-container">
              <h3 className="text-lg font-semibold text-dashboard-text-primary mb-4 font-display">
                Posts Activity (7 days)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.postsOverTime}>
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#71717a', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: '#71717a', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#111111',
                        border: '1px solid #1a1a1a',
                        borderRadius: '8px',
                        color: '#ffffff'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#7c3aed" 
                      strokeWidth={2}
                      dot={{ fill: '#7c3aed', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Impressions Over Time */}
          {charts?.impressionsOverTime && (
            <div className="chart-container">
              <h3 className="text-lg font-semibold text-dashboard-text-primary mb-4 font-display">
                Impressions (7 days)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.impressionsOverTime}>
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#71717a', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: '#71717a', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={formatNumber}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#111111',
                        border: '1px solid #1a1a1a',
                        borderRadius: '8px',
                        color: '#ffffff'
                      }}
                      formatter={[formatNumber, 'Impressions']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="impressions" 
                      stroke="#059669" 
                      strokeWidth={2}
                      dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Recent Posts Feed */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-dashboard-text-primary mb-6 font-display">
            Recent Posts
          </h3>
          <div className="space-y-4">
            {posts.map((post) => (
              <div 
                key={post.id} 
                className="flex items-start gap-4 p-4 rounded-lg border border-dashboard-border hover:bg-white/5 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <PlatformBadge platform={post.platform} size="sm" />
                    <span className="text-sm text-dashboard-text-muted">
                      {post.handle}
                    </span>
                    <span className="text-sm text-dashboard-text-muted">•</span>
                    <span className="text-sm text-dashboard-text-muted">
                      {post.clientName}
                    </span>
                  </div>
                  <p className="text-dashboard-text-primary text-sm mb-2 leading-relaxed">
                    {truncateContent(post.content)}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-dashboard-text-muted">
                    <span>{formatDate(post.createdAt)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      {post.agentId}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={post.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}