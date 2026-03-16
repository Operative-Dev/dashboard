import { NextResponse } from 'next/server';
import { PostBridgeClient } from '@/lib/postbridge';

// Known Woz account IDs from PostBridge
const WOZ_ACCOUNT_IDS = [47791, 47792, 47793, 47796, 47852];

export async function GET() {
  try {
    const { accounts, posts, analytics } = await PostBridgeClient.getAllData();
    
    // Calculate stats for Woz (real data)
    const wozPosts = posts.filter(post => 
      post.social_accounts.some(accountId => WOZ_ACCOUNT_IDS.includes(accountId))
    );
    
    const wozViews = analytics.reduce((sum, item) => sum + (item.view_count || 0), 0);
    
    // Find Woz accounts
    const wozAccounts = accounts.filter(account => WOZ_ACCOUNT_IDS.includes(account.id));
    
    const clients = [
      {
        id: 'woz-1',
        name: 'Woz',
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        channels: [
          {
            id: 'woz-tiktok',
            platform: 'tiktok',
            accountCount: wozAccounts.length
          }
        ],
        totalPosts: wozPosts.length,
        totalImpressions: wozViews,
        accounts: wozAccounts.map(account => ({
          id: account.id,
          username: account.username,
          platform: account.platform
        }))
      },
      {
        id: 'personal-1',
        name: 'Personal Brand',
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        channels: [
          {
            id: 'personal-linkedin',
            platform: 'linkedin',
            accountCount: 0
          },
          {
            id: 'personal-twitter',
            platform: 'twitter',
            accountCount: 0
          }
        ],
        totalPosts: 0,
        totalImpressions: 0,
        accounts: []
      },
      {
        id: 'novi-1',
        name: 'Novi',
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        channels: [
          {
            id: 'novi-tiktok',
            platform: 'tiktok',
            accountCount: 0
          },
          {
            id: 'novi-instagram',
            platform: 'instagram',
            accountCount: 0
          }
        ],
        totalPosts: 0,
        totalImpressions: 0,
        accounts: []
      },
      {
        id: 'mira-1',
        name: 'Mira',
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        channels: [
          {
            id: 'mira-tiktok',
            platform: 'tiktok',
            accountCount: 0
          },
          {
            id: 'mira-twitter',
            platform: 'twitter',
            accountCount: 0
          }
        ],
        totalPosts: 0,
        totalImpressions: 0,
        accounts: []
      }
    ];
    
    return NextResponse.json({ clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}