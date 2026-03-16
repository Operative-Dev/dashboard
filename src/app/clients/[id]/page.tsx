'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/dashboard-layout';
import StatusBadge from '@/components/ui/status-badge';
import PlatformBadge from '@/components/ui/platform-badge';
import MetricCard from '@/components/ui/metric-card';
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
          <h2 className="text-2xl font-bold text-zinc-50 mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            Client Not Found
          </h2>
          <p className="text-zinc-400 mb-6">
            The client you're looking for doesn't exist.
          </p>
          <Link 
            href="/clients" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md transition-colors"
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
            className="p-2 hover:bg-zinc-800/50 rounded-md transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-500" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-zinc-50" style={{ fontFamily: 'var(--font-display)' }}>
              {client.name}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-mono bg-zinc-900 text-emerald-400 border border-zinc-800">
                <div className="status-dot active mr-1"></div>
                {client.status}
              </span>
              <div className="flex gap-1">
                {client.platforms.map((platform) => (
                  <PlatformBadge key={platform} platform={platform} showIcon={true} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <MetricCard
            title="Total Posts"
            value={client.postCount}
            subtitle={`Across ${client.accounts} accounts`}
            icon={FileText}
          />

          <MetricCard
            title="Impressions"
            value={formatNumber(client.totalImpressions)}
            subtitle="Total reach"
            icon={Eye}
          />

          <MetricCard
            title="Engagement"
            value={`${client.avgEngagement}%`}
            subtitle="Average rate"
            icon={TrendingUp}
          />

          <MetricCard
            title="Platforms"
            value={client.platforms.length}
            subtitle={`${client.accounts} accounts`}
            icon={Users}
          />
        </div>

        {/* Charts and Accounts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Posts Over Time Chart */}
          {charts?.postsOverTime && (
            <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 p-6 rounded-md">
              <h3 className="text-lg font-semibold text-zinc-50 mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                Posting Activity (30 days)
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

          {/* Accounts List */}
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-md">
            <h3 className="text-lg font-semibold text-zinc-50 mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              Connected Accounts
            </h3>
            <div className="space-y-3">
              {accounts.map((account) => (
                <div key={account.id} className="flex items-center gap-3 p-3 rounded border border-zinc-800">
                  <PlatformBadge platform={account.platform} showIcon={true} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-50 truncate">
                      {account.account_name}
                    </p>
                    <p className="text-xs text-zinc-400 font-mono">
                      {account.handle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Posts */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-md p-6">
          <h3 className="text-lg font-semibold text-zinc-50 mb-6" style={{ fontFamily: 'var(--font-display)' }}>
            Recent Posts
          </h3>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Content</th>
                  <th>Platform</th>
                  <th>Status</th>
                  <th>Engagement</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {posts.slice(0, 10).map((post) => (
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
                      <StatusBadge status={post.status as any} />
                    </td>
                    <td>
                      {post.engagementRate ? (
                        <div className="text-sm">
                          <span className="font-mono text-zinc-50">
                            {post.engagementRate}%
                          </span>
                          {post.impressions && (
                            <p className="text-zinc-400 font-mono text-xs">
                              {formatNumber(post.impressions)} views
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-zinc-500">-</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-zinc-500" />
                        <span className="text-zinc-400 text-sm font-mono">
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