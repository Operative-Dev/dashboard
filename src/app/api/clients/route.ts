import { NextResponse } from 'next/server';
import { initializeDatabase, seedDatabase, getClients, getChannelsByClient, getAccountsByChannel } from '@/lib/db';
import db from '@/lib/db';

let dbInitialized = false;
function ensureDatabase() {
  if (!dbInitialized) {
    initializeDatabase();
    seedDatabase();
    dbInitialized = true;
  }
}

export async function GET() {
  try {
    ensureDatabase();
    const clients = getClients();
    
    const clientsWithDetails = clients.map((client: any) => {
      const channels = getChannelsByClient(client.id);
      
      const channelsWithCounts = channels.map((ch: any) => {
        const accounts = getAccountsByChannel(ch.id);
        return { id: ch.id, platform: ch.platform, accountCount: accounts.length };
      });

      const postCount = db.prepare(`
        SELECT COUNT(*) as count FROM posts p
        JOIN accounts a ON p.account_id = a.id
        JOIN channels c ON a.channel_id = c.id
        WHERE c.client_id = ?
      `).get(client.id) as any;

      const impressions = db.prepare(`
        SELECT COALESCE(SUM(pm.impressions), 0) as total FROM post_metrics pm
        JOIN posts p ON pm.post_id = p.id
        JOIN accounts a ON p.account_id = a.id
        JOIN channels c ON a.channel_id = c.id
        WHERE c.client_id = ?
      `).get(client.id) as any;
      
      return {
        id: client.id,
        name: client.name,
        status: client.status,
        created_at: client.created_at,
        channels: channelsWithCounts,
        totalPosts: postCount?.count || 0,
        totalImpressions: impressions?.total || 0,
      };
    });
    
    return NextResponse.json({ clients: clientsWithDetails });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}
