'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import StatusBadge from '@/components/ui/status-badge';
import PlatformBadge from '@/components/ui/platform-badge';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ExternalLink,
  Clock,
  User
} from 'lucide-react';

interface Post {
  id: string;
  content: string;
  handle: string;
  accountName: string;
  platform: string;
  clientName: string;
  status: 'posted' | 'scheduled' | 'failed' | 'draft';
  agentId: string;
  createdAt: string;
  publishedAt?: string;
  mediaUrl?: string;
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [expandedPost, setExpandedPost] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await fetch('/api/posts?limit=100');
        const data = await response.json();
        setPosts(data.posts);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  const filteredPosts = posts.filter(post => {
    const matchesSearch = !searchTerm || 
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.handle.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    const matchesPlatform = platformFilter === 'all' || post.platform === platformFilter;
    
    return matchesSearch && matchesStatus && matchesPlatform;
  });

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

  const platforms = [...new Set(posts.map(p => p.platform))];
  const statuses = ['posted', 'scheduled', 'failed', 'draft'];

  if (loading) {
    return (
      <DashboardLayout 
        title="Posts" 
        subtitle="Manage and monitor all your content"
      >
        <div className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="skeleton h-12 w-full rounded-lg"></div>
            {[...Array(10)].map((_, i) => (
              <div key={i} className="skeleton h-16 w-full rounded-lg"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Posts" 
      subtitle={`${filteredPosts.length} posts across all platforms`}
    >
      <div className="p-8 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dashboard-text-muted" />
            <input
              type="text"
              placeholder="Search posts, clients, or handles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dashboard-card border border-dashboard-border rounded-lg text-dashboard-text-primary placeholder-dashboard-text-muted focus:outline-none focus:border-dashboard-accent-bright"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-dashboard-card border border-dashboard-border rounded-lg text-dashboard-text-primary focus:outline-none focus:border-dashboard-accent-bright"
            >
              <option value="all">All Status</option>
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
            
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="px-3 py-2 bg-dashboard-card border border-dashboard-border rounded-lg text-dashboard-text-primary focus:outline-none focus:border-dashboard-accent-bright"
            >
              <option value="all">All Platforms</option>
              {platforms.map(platform => (
                <option key={platform} value={platform}>
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Posts Table */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="px-6 py-3">Content</th>
                  <th className="px-6 py-3">Platform</th>
                  <th className="px-6 py-3">Client</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Agent</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map((post) => (
                  <>
                    <tr 
                      key={post.id} 
                      className="cursor-pointer"
                      onClick={() => setExpandedPost(
                        expandedPost === post.id ? null : post.id
                      )}
                    >
                      <td className="px-6 py-4 max-w-md">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-dashboard-text-primary font-medium leading-relaxed">
                              {truncateContent(post.content)}
                            </p>
                            <p className="text-sm text-dashboard-text-muted mt-1">
                              {post.handle}
                            </p>
                          </div>
                          {post.mediaUrl && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <PlatformBadge platform={post.platform} />
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-dashboard-text-primary font-medium">
                          {post.clientName}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={post.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-dashboard-text-muted" />
                          <span className="text-dashboard-text-secondary font-mono text-sm">
                            {post.agentId}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-dashboard-text-muted" />
                          <span className="text-dashboard-text-secondary text-sm">
                            {formatDate(post.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                          <ExternalLink className="w-4 h-4 text-dashboard-text-muted" />
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expanded Row */}
                    {expandedPost === post.id && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 bg-white/[0.02] border-t border-dashboard-border">
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium text-dashboard-text-primary mb-2">
                                Full Content
                              </h4>
                              <p className="text-dashboard-text-secondary leading-relaxed">
                                {post.content}
                              </p>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-dashboard-text-muted">Account:</span>
                                <p className="text-dashboard-text-primary font-medium">
                                  {post.accountName}
                                </p>
                              </div>
                              {post.publishedAt && (
                                <div>
                                  <span className="text-dashboard-text-muted">Published:</span>
                                  <p className="text-dashboard-text-primary font-medium">
                                    {formatDate(post.publishedAt)}
                                  </p>
                                </div>
                              )}
                              {post.mediaUrl && (
                                <div>
                                  <span className="text-dashboard-text-muted">Media:</span>
                                  <a 
                                    href={post.mediaUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-dashboard-accent-bright hover:underline"
                                  >
                                    View Media
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-dashboard-text-muted">
              No posts found matching your criteria.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}