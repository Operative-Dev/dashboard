import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Client-side (browser) — uses anon key, respects RLS
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side — uses service role key, bypasses RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Webhook auth secret — pipeline scripts include this in X-Webhook-Secret header
export const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'changeme';

// ============================================
// Type definitions
// ============================================

export interface EventRow {
  id: string;
  event_type: string;
  client: string;
  account: string | null;
  account_id: number | null;
  timestamp: string;
  data: Record<string, any>;
  processed: boolean;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  event_id: string;
  client: string;
  channel: string;
  status: 'pending' | 'sent' | 'failed';
  sent_at: string | null;
  error: string | null;
  created_at: string;
}

export interface HookRow {
  id: string;
  hook_text: string;
  hook_type: string | null;
  client: string | null;
  source_url: string | null;
  total_views: number;
  total_likes: number;
  total_shares: number;
  times_used: number;
  avg_views_per_use: number;
  first_seen: string;
  last_used: string | null;
}

export interface DailyAnalyticsRow {
  id: string;
  date: string;
  client: string;
  account: string;
  account_id: number | null;
  posts_count: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  avg_views: number;
  top_post_url: string | null;
  top_post_views: number;
}

// ============================================
// Helper functions
// ============================================

/** Insert an event into the events table */
export async function insertEvent(event: {
  event_type: string;
  client: string;
  account?: string;
  account_id?: number;
  timestamp?: string;
  data?: Record<string, any>;
}) {
  const { data, error } = await supabaseAdmin.from('events').insert({
    event_type: event.event_type,
    client: event.client,
    account: event.account || null,
    account_id: event.account_id || null,
    timestamp: event.timestamp || new Date().toISOString(),
    data: event.data || {},
  }).select().single();

  if (error) throw error;
  return data as EventRow;
}

/** Get recent events, optionally filtered by client */
export async function getRecentEvents(opts: {
  client?: string;
  event_type?: string;
  limit?: number;
} = {}) {
  let query = supabaseAdmin.from('events')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(opts.limit || 50);

  if (opts.client) query = query.eq('client', opts.client);
  if (opts.event_type) query = query.eq('event_type', opts.event_type);

  const { data, error } = await query;
  if (error) throw error;
  return data as EventRow[];
}

/** Get daily analytics for a date range */
export async function getDailyAnalytics(opts: {
  client?: string;
  from?: string;
  to?: string;
}) {
  let query = supabaseAdmin.from('daily_analytics')
    .select('*')
    .order('date', { ascending: false });

  if (opts.client) query = query.eq('client', opts.client);
  if (opts.from) query = query.gte('date', opts.from);
  if (opts.to) query = query.lte('date', opts.to);

  const { data, error } = await query;
  if (error) throw error;
  return data as DailyAnalyticsRow[];
}

/** Get top hooks by views */
export async function getTopHooks(opts: { client?: string; limit?: number } = {}) {
  let query = supabaseAdmin.from('hooks')
    .select('*')
    .order('total_views', { ascending: false })
    .limit(opts.limit || 20);

  if (opts.client) query = query.eq('client', opts.client);

  const { data, error } = await query;
  if (error) throw error;
  return data as HookRow[];
}
