'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/dashboard-layout';
import PlatformBadge from '@/components/ui/platform-badge';
import { 
  Users,
  FileText,
  Clock,
  TrendingUp,
  ChevronRight,
  Calendar
} from 'lucide-react';

interface Client {
  id: string;
  name: string;
  status: string;
  platforms: string[];
  postCount: number;
  lastPost?: string;
  createdAt: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClients() {
      try {
        const response = await fetch('/api/clients');
        const data = await response.json();
        setClients(data.clients);
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchClients();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'paused':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'inactive':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const daysSinceLastPost = (lastPost?: string) => {
    if (!lastPost) return null;
    const days = Math.floor((Date.now() - new Date(lastPost).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  if (loading) {
    return (
      <DashboardLayout 
        title="Clients" 
        subtitle="Manage your content clients"
      >
        <div className="p-8">
          <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-48 rounded-xl"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Clients" 
      subtitle={`${clients.length} active clients across all platforms`}
    >
      <div className="p-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-dashboard-text-primary">
                Total Clients
              </h3>
            </div>
            <p className="text-3xl font-bold text-dashboard-text-primary font-mono">
              {clients.length}
            </p>
          </div>
          
          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-semibold text-dashboard-text-primary">
                Total Posts
              </h3>
            </div>
            <p className="text-3xl font-bold text-dashboard-text-primary font-mono">
              {clients.reduce((sum, client) => sum + client.postCount, 0)}
            </p>
          </div>
          
          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-dashboard-text-primary">
                Active Clients
              </h3>
            </div>
            <p className="text-3xl font-bold text-dashboard-text-primary font-mono">
              {clients.filter(c => c.status === 'active').length}
            </p>
          </div>
        </div>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <Link 
              key={client.id} 
              href={`/clients/${client.id}`}
              className="block group"
            >
              <div className="glass-card p-6 rounded-xl transition-all duration-300 hover:bg-white/8 hover:scale-[1.02] relative overflow-hidden">
                {/* Hover effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] transition-transform duration-700 group-hover:translate-x-[100%]"></div>
                
                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-dashboard-text-primary mb-1 font-display">
                        {client.name}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-mono border ${getStatusColor(client.status)}`}>
                        {client.status}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-dashboard-text-muted group-hover:text-dashboard-text-primary transition-colors" />
                  </div>

                  {/* Platforms */}
                  <div className="mb-4">
                    <p className="text-sm text-dashboard-text-muted mb-2">Platforms</p>
                    <div className="flex flex-wrap gap-2">
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

                  {/* Metrics */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-dashboard-text-muted">Posts</span>
                      <span className="text-sm font-mono text-dashboard-text-primary">
                        {client.postCount}
                      </span>
                    </div>
                    
                    {client.lastPost && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-dashboard-text-muted">Last Post</span>
                        <span className="text-sm font-mono text-dashboard-text-secondary">
                          {daysSinceLastPost(client.lastPost)}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-dashboard-text-muted">Since</span>
                      <span className="text-sm font-mono text-dashboard-text-secondary">
                        {formatDate(client.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {clients.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-dashboard-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-dashboard-text-primary mb-2">
              No clients found
            </h3>
            <p className="text-dashboard-text-muted">
              Start by adding your first client to get going.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}