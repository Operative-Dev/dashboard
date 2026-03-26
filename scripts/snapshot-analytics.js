/**
 * Snapshot Analytics Script
 * Run: cd agent-dashboard && node scripts/snapshot-analytics.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.resolve(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const PB_BASE = 'https://api.post-bridge.com/v1';

const companies = [
  { slug: 'woz', name: 'Woz', apiKey: 'pb_live_3xh1Ms7WDVTy3XG7f1wdDk', accountIds: [47791, 47792, 47793, 47796, 47852] },
  { slug: 'novi', name: 'Novi', apiKey: 'pb_live_Paed5uuR1qdGnYux2qoXty', accountIds: [50441, 50442, 51056, 51057, 51058] },
  { slug: 'thoughtful', name: 'Thoughtful', apiKey: 'pb_live_JyMJsnUzEW8DzGpeSrYuk1', accountIds: [50426, 50430, 51812, 51813] },
];

async function fetchAll(endpoint, apiKey) {
  const all = [];
  let offset = 0;
  while (true) {
    const sep = endpoint.includes('?') ? '&' : '?';
    const res = await fetch(`${PB_BASE}${endpoint}${sep}limit=100&offset=${offset}`, {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
    const json = await res.json();
    all.push(...json.data);
    if (json.data.length < 100) break;
    offset += 100;
  }
  return all;
}

function getUsernameFromUrl(url) {
  return url?.match?.(/tiktok\.com\/@([^/]+)/)?.[1]?.toLowerCase() || null;
}

async function snapshotCompany(company) {
  console.log(`\n📸 Snapshotting ${company.name}...`);
  
  const [accounts, analytics] = await Promise.all([
    fetchAll('/social-accounts', company.apiKey),
    fetchAll('/analytics?platform=tiktok&timeframe=all', company.apiKey),
  ]);

  const accountMap = new Map(accounts.map(a => [a.username.toLowerCase(), a]));

  const ownedAnalytics = analytics.filter(item => {
    const username = getUsernameFromUrl(item.share_url);
    return username && accountMap.has(username);
  });

  console.log(`  Found ${ownedAnalytics.length} posts with analytics`);

  const now = new Date();
  const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

  // 1. Upsert view_snapshots
  for (let i = 0; i < ownedAnalytics.length; i += 50) {
    const batch = ownedAnalytics.slice(i, i + 50).map(item => ({
      post_id: item.platform_post_id,
      account: getUsernameFromUrl(item.share_url) || 'unknown',
      client: company.slug,
      views: item.view_count,
      likes: item.like_count,
      snapped_at: now.toISOString(),
    }));
    const { error } = await supabase.from('view_snapshots').upsert(batch, { onConflict: 'post_id' });
    if (error) console.error(`  ⚠️ view_snapshots error:`, error.message);
  }
  console.log(`  ✅ Upserted ${ownedAnalytics.length} view snapshots`);

  // 2. Aggregate into daily_analytics per account
  const byAccount = new Map();
  for (const item of ownedAnalytics) {
    const username = getUsernameFromUrl(item.share_url);
    const account = accountMap.get(username);
    if (!account) continue;
    if (!byAccount.has(username)) byAccount.set(username, { username, accountId: account.id, posts: [] });
    byAccount.get(username).posts.push(item);
  }

  for (const [username, data] of byAccount) {
    const totalViews = data.posts.reduce((s, p) => s + p.view_count, 0);
    const totalLikes = data.posts.reduce((s, p) => s + p.like_count, 0);
    const totalComments = data.posts.reduce((s, p) => s + p.comment_count, 0);
    const totalShares = data.posts.reduce((s, p) => s + p.share_count, 0);
    const topPost = data.posts.reduce((best, p) => p.view_count > best.view_count ? p : best, data.posts[0]);

    const { error } = await supabase.from('daily_analytics').upsert({
      date: todayStr,
      client: company.slug,
      account: username,
      account_id: data.accountId,
      posts_count: data.posts.length,
      total_views: totalViews,
      total_likes: totalLikes,
      total_comments: totalComments,
      total_shares: totalShares,
      avg_views: data.posts.length > 0 ? Math.round(totalViews / data.posts.length) : 0,
      top_post_url: topPost?.share_url || null,
      top_post_views: topPost?.view_count || 0,
    }, { onConflict: 'date,account_id' });

    if (error) console.error(`  ⚠️ daily_analytics error for ${username}:`, error.message);
    else console.log(`    ${username}: ${totalViews} views, ${data.posts.length} posts`);
  }

  return { postsTracked: ownedAnalytics.length, accountsTracked: byAccount.size };
}

async function main() {
  console.log('🚀 Starting analytics snapshot...');
  console.log(`📅 Date: ${new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })}`);

  let totalPosts = 0, totalAccounts = 0;
  for (const company of companies) {
    try {
      const result = await snapshotCompany(company);
      totalPosts += result.postsTracked;
      totalAccounts += result.accountsTracked;
    } catch (e) {
      console.error(`❌ Failed for ${company.name}:`, e.message);
    }
  }

  console.log(`\n✅ Done! Tracked ${totalPosts} posts across ${totalAccounts} accounts.`);
}

main().catch(console.error);
