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
      <DashboardLayout title="Posts">
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
    <DashboardLayout title="Posts">
      <div className="p-8 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search posts, clients, or handles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-50 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-50 focus:outline-none focus:border-emerald-500"
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
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-50 focus:outline-none focus:border-emerald-500"
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
        <div className="bg-zinc-900 border border-zinc-800 rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Content</th>
                  <th>Platform</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Agent</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map((post) => (
                  <>
                    <tr 
                      key={post.id}
                      onClick={() => setExpandedPost(
                        expandedPost === post.id ? null : post.id
                      )}
                    >
                      <td className="max-w-md">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-zinc-50 font-medium leading-relaxed">
                              {truncateContent(post.content)}
                            </p>
                            <p className="text-sm text-zinc-400 mt-1 font-mono">
                              {post.handle}
                            </p>
                          </div>
                          {post.mediaUrl && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </td>
                      <td>
                        <PlatformBadge platform={post.platform} showIcon={true} />
                      </td>
                      <td>
                        <span className="text-zinc-50 font-medium">
                          {post.clientName}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={post.status} />
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-zinc-500" />
                          <span className="text-zinc-400 font-mono text-sm">
                            {post.agentId}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-zinc-500" />
                          <span className="text-zinc-400 text-sm font-mono">
                            {formatDate(post.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <button className="p-2 hover:bg-zinc-800/50 rounded-md transition-colors">
                          <ExternalLink className="w-4 h-4 text-zinc-500" />
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expanded Row */}
                    {expandedPost === post.id && (
                      <tr>
                        <td colSpan={7} className="bg-zinc-800/20 border-t border-zinc-800">
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium text-zinc-50 mb-2 font-mono uppercase tracking-wider">
                                Full Content
                              </h4>
                              <p className="text-zinc-300 leading-relaxed">
                                {post.content}
                              </p>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-zinc-500 font-mono uppercase tracking-wider text-xs">Account:</span>
                                <p className="text-zinc-50 font-medium">
                                  {post.accountName}
                                </p>
                              </div>
                              {post.publishedAt && (
                                <div>
                                  <span className="text-zinc-500 font-mono uppercase tracking-wider text-xs">Published:</span>
                                  <p className="text-zinc-50 font-medium font-mono">
                                    {formatDate(post.publishedAt)}
                                  </p>
                                </div>
                              )}
                              {post.mediaUrl && (
                                <div>
                                  <span className="text-zinc-500 font-mono uppercase tracking-wider text-xs">Media:</span>
                                  <a 
                                    href={post.mediaUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-emerald-500 hover:underline"
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
            <p className="text-zinc-500">
              No posts found matching your criteria.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}