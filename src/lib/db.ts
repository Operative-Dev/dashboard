import Database from 'better-sqlite3';
import { join } from 'path';

// Database path
const dbPath = join(process.cwd(), 'data.sqlite');
const db = new Database(dbPath);

// Enable foreign key constraints
db.pragma('foreign_keys = ON');

// Initialize tables
export const initializeDatabase = () => {
  // Clients table
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Channels table
  db.exec(`
    CREATE TABLE IF NOT EXISTS channels (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id),
      platform TEXT NOT NULL
    )
  `);

  // Accounts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL REFERENCES channels(id),
      handle TEXT NOT NULL,
      account_name TEXT,
      external_id TEXT
    )
  `);

  // Posts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL REFERENCES accounts(id),
      content TEXT,
      media_url TEXT,
      status TEXT DEFAULT 'scheduled',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      published_at DATETIME,
      agent_id TEXT
    )
  `);

  // Post metrics table
  db.exec(`
    CREATE TABLE IF NOT EXISTS post_metrics (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES posts(id),
      impressions INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      shares INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      engagement_rate REAL DEFAULT 0,
      captured_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Agent activity log table
  db.exec(`
    CREATE TABLE IF NOT EXISTS agent_activity_log (
      id TEXT PRIMARY KEY,
      agent_id TEXT,
      post_id TEXT REFERENCES posts(id),
      action TEXT,
      status TEXT,
      log TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

// Helper function to generate UUIDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Seed data function
export const seedDatabase = () => {
  const clientsExist = db.prepare('SELECT COUNT(*) as count FROM clients').get() as { count: number };
  
  if (clientsExist.count > 0) {
    return; // Already seeded
  }

  // Insert clients
  const insertClient = db.prepare('INSERT INTO clients (id, name, status) VALUES (?, ?, ?)');
  const clients = [
    { id: 'woz-1', name: 'Woz', status: 'active' },
    { id: 'personal-1', name: 'Personal Brand', status: 'active' },
    { id: 'novi-1', name: 'Novi', status: 'active' },
    { id: 'mira-1', name: 'Mira', status: 'active' }
  ];
  
  clients.forEach(client => insertClient.run(client.id, client.name, client.status));

  // Insert channels
  const insertChannel = db.prepare('INSERT INTO channels (id, client_id, platform) VALUES (?, ?, ?)');
  const channels = [
    { id: 'woz-tiktok', client_id: 'woz-1', platform: 'tiktok' },
    { id: 'personal-linkedin', client_id: 'personal-1', platform: 'linkedin' },
    { id: 'personal-twitter', client_id: 'personal-1', platform: 'twitter' },
    { id: 'novi-tiktok', client_id: 'novi-1', platform: 'tiktok' },
    { id: 'novi-instagram', client_id: 'novi-1', platform: 'instagram' },
    { id: 'mira-tiktok', client_id: 'mira-1', platform: 'tiktok' },
    { id: 'mira-twitter', client_id: 'mira-1', platform: 'twitter' }
  ];
  
  channels.forEach(channel => insertChannel.run(channel.id, channel.client_id, channel.platform));

  // Insert accounts
  const insertAccount = db.prepare('INSERT INTO accounts (id, channel_id, handle, account_name, external_id) VALUES (?, ?, ?, ?, ?)');
  const accounts = [
    { id: 'acc-1', channel_id: 'woz-tiktok', handle: '@withwozz', account_name: 'WithWozz', external_id: 'pb_withwozz' },
    { id: 'acc-2', channel_id: 'woz-tiktok', handle: '@woz_app', account_name: 'Woz App', external_id: 'pb_wozapp' },
    { id: 'acc-3', channel_id: 'woz-tiktok', handle: '@lizzycodez6', account_name: 'Lizzy Codes', external_id: 'pb_lizzycodez' },
    { id: 'acc-4', channel_id: 'woz-tiktok', handle: '@shanerzfi5m', account_name: 'Shaner', external_id: 'pb_shanerzfi5m' },
    { id: 'acc-5', channel_id: 'woz-tiktok', handle: '@wozzie', account_name: 'Wozzie', external_id: 'pb_wozzie' },
    { id: 'acc-6', channel_id: 'personal-linkedin', handle: '@personal-brand', account_name: 'Personal Brand', external_id: null },
    { id: 'acc-7', channel_id: 'personal-twitter', handle: '@personal_brand', account_name: 'Personal Brand', external_id: null },
    { id: 'acc-8', channel_id: 'novi-tiktok', handle: '@novi_official', account_name: 'Novi Official', external_id: 'pb_novi' },
    { id: 'acc-9', channel_id: 'novi-instagram', handle: '@novi.official', account_name: 'Novi', external_id: null },
    { id: 'acc-10', channel_id: 'mira-tiktok', handle: '@mira_creative', account_name: 'Mira Creative', external_id: 'pb_mira' },
    { id: 'acc-11', channel_id: 'mira-twitter', handle: '@mira_creative', account_name: 'Mira', external_id: null }
  ];
  
  accounts.forEach(account => insertAccount.run(account.id, account.channel_id, account.handle, account.account_name, account.external_id));

  // Generate sample posts
  const insertPost = db.prepare('INSERT INTO posts (id, account_id, content, media_url, status, created_at, published_at, agent_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const insertMetrics = db.prepare('INSERT INTO post_metrics (id, post_id, impressions, likes, comments, shares, clicks, engagement_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const insertLog = db.prepare('INSERT INTO agent_activity_log (id, agent_id, post_id, action, status, log, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');

  const samplePosts = [
    { content: "Building the future with AI! 🚀 Check out our latest app builder features", agent: "Producer", status: "posted" },
    { content: "5 coding tips that will change your development workflow forever", agent: "Scripter", status: "posted" },
    { content: "Behind the scenes: How we're revolutionizing app development", agent: "Producer", status: "scheduled" },
    { content: "The AI revolution is here and it's changing everything", agent: "Hopper", status: "posted" },
    { content: "No-code vs low-code: Which is better for your startup?", agent: "Scripter", status: "failed" },
    { content: "Building in public: Our journey to 100k users", agent: "Producer", status: "posted" },
    { content: "The future of personal branding in the AI era", agent: "Hopper", status: "posted" },
    { content: "Productivity hack: Automate your social media with AI", agent: "Scripter", status: "posted" },
    { content: "Why every business needs an AI strategy in 2026", agent: "Producer", status: "scheduled" },
    { content: "From idea to app in 30 minutes - is it possible?", agent: "Hopper", status: "posted" }
  ];

  // Create 50 posts across accounts
  for (let i = 0; i < 50; i++) {
    const postId = `post-${i + 1}`;
    const accountId = accounts[i % accounts.length].id;
    const post = samplePosts[i % samplePosts.length];
    const now = new Date();
    const createdAt = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Last 7 days
    const publishedAt = post.status === 'posted' ? new Date(createdAt.getTime() + Math.random() * 2 * 60 * 60 * 1000) : null; // Within 2 hours of creation
    
    insertPost.run(
      postId,
      accountId,
      post.content,
      Math.random() > 0.7 ? 'https://example.com/media.jpg' : null,
      post.status,
      createdAt.toISOString(),
      publishedAt?.toISOString() || null,
      post.agent
    );

    if (post.status === 'posted') {
      // Generate metrics for posted content
      const impressions = Math.floor(Math.random() * 50000) + 1000;
      const likes = Math.floor(impressions * (Math.random() * 0.1 + 0.02)); // 2-12% engagement
      const comments = Math.floor(likes * (Math.random() * 0.3 + 0.1)); // 10-40% of likes
      const shares = Math.floor(likes * (Math.random() * 0.2 + 0.05)); // 5-25% of likes
      const clicks = Math.floor(impressions * (Math.random() * 0.05 + 0.01)); // 1-6% CTR
      const engagementRate = ((likes + comments + shares) / impressions) * 100;

      insertMetrics.run(
        `metrics-${i + 1}`,
        postId,
        impressions,
        likes,
        comments,
        shares,
        clicks,
        Math.round(engagementRate * 100) / 100
      );
    }

    // Generate agent activity logs
    const actions = ['content_generated', 'media_processed', 'scheduled', 'published', 'metrics_collected'];
    const logActions = post.status === 'failed' ? ['content_generated', 'publishing_failed'] : actions.slice(0, post.status === 'scheduled' ? 3 : 5);
    
    logActions.forEach((action, idx) => {
      const logTime = new Date(createdAt.getTime() + idx * 30 * 60 * 1000); // 30 min intervals
      insertLog.run(
        `log-${i + 1}-${idx + 1}`,
        post.agent,
        postId,
        action,
        post.status === 'failed' && action === 'publishing_failed' ? 'error' : 'success',
        action === 'publishing_failed' ? 'API rate limit exceeded' : `Successfully completed ${action}`,
        logTime.toISOString()
      );
    });
  }
};

// Query functions
export const getClients = () => {
  return db.prepare('SELECT * FROM clients ORDER BY created_at DESC').all();
};

export const getClientById = (id: string) => {
  return db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
};

export const getChannelsByClient = (clientId: string) => {
  return db.prepare('SELECT * FROM channels WHERE client_id = ?').all(clientId);
};

export const getAccountsByChannel = (channelId: string) => {
  return db.prepare('SELECT * FROM accounts WHERE channel_id = ?').all(channelId);
};

export const getPosts = (limit = 50) => {
  return db.prepare(`
    SELECT p.*, a.handle, a.account_name, c.platform, cl.name as client_name
    FROM posts p
    JOIN accounts a ON p.account_id = a.id
    JOIN channels c ON a.channel_id = c.id
    JOIN clients cl ON c.client_id = cl.id
    ORDER BY p.created_at DESC
    LIMIT ?
  `).all(limit);
};

export const getPostsByAccount = (accountId: string, limit = 20) => {
  return db.prepare(`
    SELECT p.*, pm.impressions, pm.likes, pm.comments, pm.shares, pm.engagement_rate
    FROM posts p
    LEFT JOIN post_metrics pm ON p.id = pm.post_id
    WHERE p.account_id = ?
    ORDER BY p.created_at DESC
    LIMIT ?
  `).all(accountId, limit);
};

export const getPostById = (id: string) => {
  return db.prepare(`
    SELECT p.*, a.handle, a.account_name, c.platform, cl.name as client_name,
           pm.impressions, pm.likes, pm.comments, pm.shares, pm.clicks, pm.engagement_rate
    FROM posts p
    JOIN accounts a ON p.account_id = a.id
    JOIN channels c ON a.channel_id = c.id
    JOIN clients cl ON c.client_id = cl.id
    LEFT JOIN post_metrics pm ON p.id = pm.post_id
    WHERE p.id = ?
  `).get(id);
};

export const getAgentLogs = (postId: string) => {
  return db.prepare(`
    SELECT * FROM agent_activity_log 
    WHERE post_id = ? 
    ORDER BY created_at ASC
  `).all(postId);
};

export const getOverviewStats = () => {
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  return {
    postsToday: db.prepare(`SELECT COUNT(*) as count FROM posts WHERE DATE(created_at) = ?`).get(today),
    postsThisWeek: db.prepare(`SELECT COUNT(*) as count FROM posts WHERE DATE(created_at) >= ?`).get(weekAgo),
    totalImpressions: db.prepare(`SELECT SUM(impressions) as total FROM post_metrics`).get(),
    avgEngagementRate: db.prepare(`SELECT AVG(engagement_rate) as avg FROM post_metrics WHERE engagement_rate > 0`).get(),
    activeClients: db.prepare(`SELECT COUNT(*) as count FROM clients WHERE status = 'active'`).get(),
    failedPosts: db.prepare(`SELECT COUNT(*) as count FROM posts WHERE status = 'failed'`).get(),
    lowEngagementPosts: db.prepare(`SELECT COUNT(*) as count FROM post_metrics WHERE engagement_rate < 1.0`).get()
  };
};

export const getPostsOverTime = (days = 30) => {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  return db.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM posts 
    WHERE DATE(created_at) >= ?
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `).all(startDate);
};

export const getImpressionsOverTime = (days = 30) => {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  return db.prepare(`
    SELECT DATE(p.published_at) as date, SUM(pm.impressions) as impressions
    FROM posts p
    JOIN post_metrics pm ON p.id = pm.post_id
    WHERE DATE(p.published_at) >= ? AND p.status = 'posted'
    GROUP BY DATE(p.published_at)
    ORDER BY date ASC
  `).all(startDate);
};

export default db;