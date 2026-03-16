'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/dashboard-layout';
import StatusBadge from '@/components/ui/status-badge';
import PlatformBadge from '@/components/ui/platform-badge';
import { 
  ArrowLeft,
  Users,
  FileText,
  Eye,
  TrendingUp,
  Calendar,
  Clock,
  ExternalLink
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface Client {
  id: string;
  name: string;
  status: string;
  platforms: string[];
  accounts: number;
  postCount: number;
  totalImpressions: number;
  avgEngagement: number;
}

interface Account {
  id: string;
  handle: string;
  account_name: string;
  platform: string;
}

interface Post {
  id: string;
  content: string;
  handle: string;
  platform: string;
  status: string;
  createdAt: string;
  publishedAt?: string;
  impressions?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  engagementRate?: number;
}

interface ChartData {
  postsOverTime: Array<{ date: string; count: number }>;
}

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  
  const [client, setClient] = useState<Client | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClientDetails() {
      try {
        const response = await fetch(`/api/clients/${clientId}`);
        if (!response.ok) {
          throw new Error('Client not found');
        }
        const data = await response.json();
        setClient(data.client);
        setAccounts(data.accounts);
        setPosts(data.posts);
        setCharts(data.charts);
      } catch (error) {
        console.error('Error fetching client details:', error);
      } finally {
        setLoading(false);
      }
    }

    if (clientId) {
      fetchClientDetails();
    }
  }, [clientId]);

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
            <div className="skeleton h-12 w-64 rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton h-32 rounded-lg"></div>
              ))}
            </div>
            <div className="skeleton h-80 rounded-lg"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!client) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-dashboard-text-primary mb-4">
            Client Not Found
          </h2>
          <p className="text-dashboard-text-muted mb-6">
            The client you're looking for doesn't exist.
          </p>
          <Link 
            href="/clients" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-dashboard-accent hover:bg-dashboard-accent-bright text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Clients
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link 
            href="/clients"
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-dashboard-text-muted" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-dashboard-text-primary font-display">
              {client.name}
            </h1>
            <p className="text-dashboard-text-muted">
              Client overview and performance metrics
            </p>
          </div>
        </div>

        {/* Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-dashboard-text-primary">
                Total Posts
              </h3>
            </div>
            <p className="text-3xl font-bold text-dashboard-text-primary font-mono">
              {client.postCount}
            </p>
            <p className="text-sm text-dashboard-text-muted mt-1">
              Across {client.accounts} accounts
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <Eye className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-semibold text-dashboard-text-primary">
                Impressions
              </h3>
            </div>
            <p className="text-3xl font-bold text-dashboard-text-primary font-mono">
              {formatNumber(client.totalImpressions)}
            </p>
            <p className="text-sm text-dashboard-text-muted mt-1">
              Total reach
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-dashboard-text-primary">
                Engagement
              </h3>
            </div>
            <p className="text-3xl font-bold text-dashboard-text-primary font-mono">
              {client.avgEngagement}%
            </p>
            <p className="text-sm text-dashboard-text-muted mt-1">
              Average rate
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-semibold text-dashboard-text-primary">
                Platforms
              </h3>
            </div>
            <p className="text-3xl font-bold text-dashboard-text-primary font-mono">
              {client.platforms.length}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {client.platforms.map((platform) => (
                <PlatformBadge 
                  key={platform} 
                  platform={platform} 
                  size="sm" 
                  showIcon={false}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Charts and Accounts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Posts Over Time Chart */}
          {charts?.postsOverTime && (
            <div className="lg:col-span-2 chart-container">
              <h3 className="text-lg font-semibold text-dashboard-text-primary mb-4 font-display">
                Posting Activity (30 days)
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

          {/* Accounts List */}
          <div className="glass-card p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-dashboard-text-primary mb-4 font-display">
              Connected Accounts
            </h3>
            <div className="space-y-3">
              {accounts.map((account) => (
                <div key={account.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-dashboard-border">
                  <PlatformBadge platform={account.platform} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dashboard-text-primary truncate">
                      {account.account_name}
                    </p>
                    <p className="text-xs text-dashboard-text-muted">
                      {account.handle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Posts */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-dashboard-text-primary mb-6 font-display">
            Recent Posts
          </h3>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="px-4 py-3">Content</th>
                  <th className="px-4 py-3">Platform</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Engagement</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {posts.slice(0, 10).map((post) => (
                  <tr key={post.id}>
                    <td className="px-4 py-4 max-w-md">
                      <p className="text-dashboard-text-primary leading-relaxed">
                        {truncateContent(post.content)}
                      </p>
                      <p className="text-sm text-dashboard-text-muted mt-1">
                        {post.handle}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <PlatformBadge platform={post.platform} />
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={post.status as any} />
                    </td>
                    <td className="px-4 py-4">
                      {post.engagementRate ? (
                        <div className="text-sm">
                          <span className="font-mono text-dashboard-text-primary">
                            {post.engagementRate}%
                          </span>
                          {post.impressions && (
                            <p className="text-dashboard-text-muted">
                              {formatNumber(post.impressions)} views
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-dashboard-text-muted">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-dashboard-text-muted" />
                        <span className="text-dashboard-text-secondary text-sm">
                          {formatDate(post.createdAt)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}