import { NextResponse } from 'next/server';
import { getClientById, getChannelsByClient, getAccountsByChannel } from '@/lib/db';
import db from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id;
    const client = getClientById(clientId);
    
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }
    
    const channels = getChannelsByClient(clientId);
    const platforms = [...new Set(channels.map((ch: any) => ch.platform))];
    
    // Get all accounts for this client
    const accounts = [];
    for (const channel of channels) {
      const channelAccounts = getAccountsByChannel(channel.id);
      accounts.push(...channelAccounts.map((acc: any) => ({
        ...acc,
        platform: channel.platform
      })));
    }
    
    // Get posts for this client with metrics
    const posts = db.prepare(`
      SELECT 
        p.*,
        a.handle,
        a.account_name,
        c.platform,
        pm.impressions,
        pm.likes,
        pm.comments,
        pm.shares,
        pm.engagement_rate
      FROM posts p
      JOIN accounts a ON p.account_id = a.id
      JOIN channels c ON a.channel_id = c.id
      LEFT JOIN post_metrics pm ON p.id = pm.post_id
      WHERE c.client_id = ?
      ORDER BY p.created_at DESC
      LIMIT 50
    `).all(clientId);
    
    // Get posting frequency over last 30 days
    const postsOverTime = db.prepare(`
      SELECT DATE(p.created_at) as date, COUNT(*) as count
      FROM posts p
      JOIN accounts a ON p.account_id = a.id
      JOIN channels c ON a.channel_id = c.id
      WHERE c.client_id = ? AND DATE(p.created_at) >= DATE('now', '-30 days')
      GROUP BY DATE(p.created_at)
      ORDER BY date ASC
    `).all(clientId);
    
    // Calculate metrics
    const totalPosts = posts.length;
    const postedPosts = posts.filter((p: any) => p.status === 'posted');
    const totalImpressions = postedPosts.reduce((sum: number, p: any) => sum + (p.impressions || 0), 0);
    const avgEngagement = postedPosts.length > 0 
      ? postedPosts.reduce((sum: number, p: any) => sum + (p.engagement_rate || 0), 0) / postedPosts.length
      : 0;
    
    return NextResponse.json({
      client: {
        ...client,
        platforms,
        accounts: accounts.length,
        postCount: totalPosts,
        totalImpressions,
        avgEngagement: Math.round(avgEngagement * 100) / 100
      },
      accounts,
      posts: posts.map((post: any) => ({
        id: post.id,
        content: post.content,
        handle: post.handle,
        platform: post.platform,
        status: post.status,
        createdAt: post.created_at,
        publishedAt: post.published_at,
        impressions: post.impressions,
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
        engagementRate: post.engagement_rate
      })),
      charts: {
        postsOverTime: postsOverTime.map((item: any) => ({
          date: item.date,
          count: item.count
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching client details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client details' },
      { status: 500 }
    );
  }
}