import { NextResponse } from 'next/server';
import { getClients, getChannelsByClient, getAccountsByChannel } from '@/lib/db';
import db from '@/lib/db';

export async function GET() {
  try {
    const clients = getClients();
    
    const clientsWithDetails = clients.map((client: any) => {
      const channels = getChannelsByClient(client.id);
      const platforms = [...new Set(channels.map((ch: any) => ch.platform))];
      
      // Get post count for this client
      const postCount = db.prepare(`
        SELECT COUNT(*) as count 
        FROM posts p
        JOIN accounts a ON p.account_id = a.id
        JOIN channels c ON a.channel_id = c.id
        WHERE c.client_id = ?
      `).get(client.id) as any;
      
      // Get last post date
      const lastPost = db.prepare(`
        SELECT MAX(p.created_at) as lastPost
        FROM posts p
        JOIN accounts a ON p.account_id = a.id
        JOIN channels c ON a.channel_id = c.id
        WHERE c.client_id = ?
      `).get(client.id) as any;
      
      return {
        id: client.id,
        name: client.name,
        status: client.status,
        platforms,
        postCount: postCount?.count || 0,
        lastPost: lastPost?.lastPost,
        createdAt: client.created_at
      };
    });
    
    return NextResponse.json({
      clients: clientsWithDetails
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}