-- ============================================
-- Agent Dashboard — Supabase Schema
-- Run this in Supabase SQL Editor to set up tables
-- ============================================

-- Events: universal event log from pipeline webhooks
create table if not exists events (
  id uuid default gen_random_uuid() primary key,
  event_type text not null,           -- post.published, batch.complete, analytics.daily, intel.trend, etc.
  client text not null,               -- woz, novi, thoughtful
  account text,                       -- @withwozz, @novistartuptips, etc.
  account_id integer,                 -- PostBridge account ID
  timestamp timestamptz not null default now(),
  data jsonb not null default '{}',   -- event-specific payload
  processed boolean default false,
  created_at timestamptz default now()
);

-- Index for fast queries by client + time
create index idx_events_client_ts on events (client, timestamp desc);
create index idx_events_type on events (event_type);

-- Notifications: delivery tracking for client alerts
create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events(id) on delete cascade,
  client text not null,
  channel text not null,              -- slack, email, sms, webhook
  status text default 'pending',      -- pending, sent, failed
  sent_at timestamptz,
  error text,
  created_at timestamptz default now()
);

create index idx_notifications_client on notifications (client, created_at desc);

-- Hook performance: Social Intel data for hook leaderboard
create table if not exists hooks (
  id uuid default gen_random_uuid() primary key,
  hook_text text not null,
  hook_type text,                     -- question, statistic, controversy, story, etc.
  client text,
  source_url text,
  total_views bigint default 0,
  total_likes bigint default 0,
  total_shares bigint default 0,
  times_used integer default 0,
  avg_views_per_use numeric default 0,
  first_seen timestamptz default now(),
  last_used timestamptz,
  created_at timestamptz default now()
);

create index idx_hooks_client on hooks (client);
create index idx_hooks_views on hooks (total_views desc);

-- Competitor activity: tracked competitor posts
create table if not exists competitor_activity (
  id uuid default gen_random_uuid() primary key,
  competitor text not null,           -- sorhan.plays, FlowithOS, etc.
  platform text default 'tiktok',
  post_url text,
  caption text,
  view_count bigint default 0,
  like_count bigint default 0,
  detected_at timestamptz default now(),
  data jsonb default '{}',
  created_at timestamptz default now()
);

create index idx_competitor_detected on competitor_activity (detected_at desc);

-- Daily analytics snapshots: aggregated daily stats per account
create table if not exists daily_analytics (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  client text not null,
  account text not null,
  account_id integer,
  posts_count integer default 0,
  total_views bigint default 0,
  total_likes bigint default 0,
  total_comments bigint default 0,
  total_shares bigint default 0,
  avg_views numeric default 0,
  top_post_url text,
  top_post_views bigint default 0,
  created_at timestamptz default now(),
  unique (date, account_id)
);

create index idx_daily_analytics_date on daily_analytics (date desc, client);

-- Enable Row Level Security (prep for client access later)
alter table events enable row level security;
alter table notifications enable row level security;
alter table hooks enable row level security;
alter table competitor_activity enable row level security;
alter table daily_analytics enable row level security;

-- For now: allow all access via service_role key (our backend)
-- When we add client logins, we'll add per-client RLS policies
create policy "Service role full access" on events for all using (true);
create policy "Service role full access" on notifications for all using (true);
create policy "Service role full access" on hooks for all using (true);
create policy "Service role full access" on competitor_activity for all using (true);
create policy "Service role full access" on daily_analytics for all using (true);

-- Enable realtime for live dashboard updates
alter publication supabase_realtime add table events;
alter publication supabase_realtime add table notifications;
