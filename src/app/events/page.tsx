'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import {
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Zap,
  BarChart3,
  Eye,
} from 'lucide-react';

interface Event {
  id: string;
  event_type: string;
  client: string;
  account: string | null;
  timestamp: string;
  data: Record<string, any>;
  created_at: string;
}

const EVENT_ICONS: Record<string, typeof Activity> = {
  'post.published': CheckCircle,
  'post.failed': XCircle,
  'batch.complete': CheckCircle,
  'batch.incomplete': AlertTriangle,
  'analytics.daily': BarChart3,
  'analytics.breakout': TrendingUp,
  'intel.trend': Zap,
  'intel.competitor': Eye,
  'alert.batch_miss': AlertTriangle,
  'alert.account_down': XCircle,
};

const EVENT_COLORS: Record<string, string> = {
  'post.published': 'text-emerald-400',
  'post.failed': 'text-red-400',
  'batch.complete': 'text-emerald-400',
  'batch.incomplete': 'text-amber-400',
  'analytics.daily': 'text-blue-400',
  'analytics.breakout': 'text-purple-400',
  'intel.trend': 'text-cyan-400',
  'intel.competitor': 'text-orange-400',
  'alert.batch_miss': 'text-red-400',
  'alert.account_down': 'text-red-400',
};

const CLIENT_COLORS: Record<string, string> = {
  woz: '#10b981',
  novi: '#3b82f6',
  thoughtful: '#f59e0b',
  system: '#71717a',
  all: '#71717a',
};

function formatEventDescription(event: Event): string {
  const d = event.data;
  switch (event.event_type) {
    case 'post.published':
      return `Posted to ${event.account || 'unknown'} — "${(d.caption || '').slice(0, 60)}${(d.caption || '').length > 60 ? '...' : ''}"`;
    case 'post.failed':
      return `Failed to post to ${event.account || 'unknown'}: ${d.error || 'unknown error'}`;
    case 'batch.complete':
      return `Batch complete: ${d.posted || '?'}/${d.total || '?'} accounts ✅`;
    case 'batch.incomplete':
      return `Batch incomplete: ${d.posted || '?'}/${d.total || '?'} — missing: ${(d.missing_accounts || []).join(', ')}`;
    case 'analytics.daily':
      return `Daily recap: ${d.total_views ? d.total_views.toLocaleString() + ' views' : ''} across ${d.accounts?.length || '?'} accounts`;
    case 'analytics.breakout':
      return `🔥 Breakout! ${event.account} hit ${(d.views || 0).toLocaleString()} views`;
    case 'intel.trend':
      return `Trending: "${(d.hook || d.format || '').slice(0, 80)}"`;
    case 'intel.competitor':
      return `${d.competitor}: ${(d.caption || '').slice(0, 60)} (${(d.views || 0).toLocaleString()} views)`;
    case 'alert.batch_miss':
      return `Batch miss: ${(d.missing_accounts || []).join(', ')} didn't post`;
    case 'alert.account_down':
      return `Account issue: ${event.account} — ${d.reason || 'check manually'}`;
    default:
      return JSON.stringify(d).slice(0, 100);
  }
}

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchEvents = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (filter !== 'all') params.set('client', filter);
      const res = await fetch(`/api/events?${params}`);
      const data = await res.json();
      setEvents(data.events || []);
    } catch (e) {
      console.error('Failed to fetch events:', e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchEvents, 30000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  return (
    <DashboardLayout title="Event Feed">
      <div className="p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-50" style={{ fontFamily: 'var(--font-display)' }}>
              Event Feed
            </h1>
            <p className="text-sm text-zinc-500 mt-1">Real-time events from the posting pipeline</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-zinc-500 font-mono">Live</span>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1">
          {['all', 'woz', 'novi', 'thoughtful'].map(c => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-3 py-1.5 text-xs font-mono rounded-md cursor-pointer transition-colors ${
                filter === c
                  ? 'bg-zinc-800 text-zinc-50 border border-zinc-700'
                  : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
              }`}
            >
              {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>

        {/* Event list */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-md divide-y divide-zinc-800/50">
          {loading ? (
            <div className="p-8 text-center text-zinc-500 text-sm">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">
              No events yet. Events will appear here once the pipeline starts sending webhooks.
            </div>
          ) : (
            events.map((event) => {
              const Icon = EVENT_ICONS[event.event_type] || Activity;
              const colorClass = EVENT_COLORS[event.event_type] || 'text-zinc-400';
              const clientColor = CLIENT_COLORS[event.client] || '#71717a';

              return (
                <div key={event.id} className="flex items-start gap-3 p-4 hover:bg-zinc-800/30 transition-colors">
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${colorClass}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="text-xs font-mono px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: clientColor + '20', color: clientColor }}
                      >
                        {event.client}
                      </span>
                      <span className="text-xs text-zinc-600 font-mono">
                        {event.event_type}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-300">
                      {formatEventDescription(event)}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-600 font-mono shrink-0">
                    {timeAgo(event.timestamp)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
