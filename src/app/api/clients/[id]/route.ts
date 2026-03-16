import { NextResponse } from 'next/server';
import { PostBridgeClient } from '@/lib/postbridge';

const WOZ_ACCOUNT_IDS = [47791, 47792, 47793, 47796, 47852];

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id;
    
    // Define client info
    const clients = {
      'woz-1': { name: 'Woz', status: 'active' },
      'personal-1': { name: 'Personal Brand', status: 'active' },
      'novi-1': { name: 'Novi', status: 'active' },
      'mira-1': { name: 'Mira', status: 'active' }
    };
    
    const client = clients[clientId as keyof typeof clients];
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }
    
    if (clientId === 'woz-1') {
      // Return real data for Woz
      const { accounts, posts, analytics } = await PostBridgeClient.getAllData();
      
      // Filter for Woz accounts and posts
      const wozAccounts = accounts.filter(account => WOZ_ACCOUNT_IDS.includes(account.id));
      const wozPosts = posts.filter(post => 
        post.social_accounts.some(accountId => WOZ_ACCOUNT_IDS.includes(accountId))
      );
      
      // Create analytics lookup
      const analyticsMap = new Map();
      analytics.forEach(item => {
        analyticsMap.set(item.platform_post_id, item);
      });
      
      // Transform posts
      const transformedPosts = wozPosts.map(post => {
        const analyticsData = analyticsMap.get(post.id.toString());
        const account = accounts.find(acc => acc.id === post.social_accounts[0]);
        
        return {
          id: post.id.toString(),
          content: post.caption,
          handle: account ? `@${account.username}` : '@unknown',
          platform: account?.platform || 'tiktok',
          status: post.status,
          createdAt: post.created_at,
          publishedAt: post.status === 'posted' ? post.created_at : null,
          impressions: analyticsData?.view_count || 0,
          likes: analyticsData?.like_count || 0,
          comments: analyticsData?.comment_count || 0,
          shares: analyticsData?.share_count || 0,
          engagementRate: analyticsData ? 
            (analyticsData.view_count > 0 
              ? ((analyticsData.like_count + analyticsData.comment_count + analyticsData.share_count) / analyticsData.view_count) * 100
              : 0) 
            : 0
        };
      });
      
      // Calculate posting frequency over last 30 days
      const now = new Date();
      const postsOverTime = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const count = wozPosts.filter(post => {
          const postDate = new Date(post.created_at).toISOString().split('T')[0];
          return postDate === dateStr;
        }).length;
        postsOverTime.push({ date: dateStr, count });
      }
      
      // Calculate metrics
      const totalPosts = wozPosts.length;
      const postedPosts = transformedPosts.filter(p => p.status === 'posted');
      const totalImpressions = postedPosts.reduce((sum, p) => sum + p.impressions, 0);
      const avgEngagement = postedPosts.length > 0 
        ? postedPosts.reduce((sum, p) => sum + p.engagementRate, 0) / postedPosts.length
        : 0;
      
      return NextResponse.json({
        client: {
          id: clientId,
          name: client.name,
          status: client.status,
          platforms: ['tiktok'],
          accounts: wozAccounts.length,
          postCount: totalPosts,
          totalImpressions,
          avgEngagement: Math.round(avgEngagement * 100) / 100
        },
        accounts: wozAccounts.map(account => ({
          id: account.id.toString(),
          handle: `@${account.username}`,
          account_name: account.username,
          platform: account.platform
        })),
        posts: transformedPosts.slice(0, 50),
        charts: {
          postsOverTime
        }
      });
    } else {
      // Return placeholder data for other clients
      return NextResponse.json({
        client: {
          id: clientId,
          name: client.name,
          status: client.status,
          platforms: clientId === 'personal-1' ? ['linkedin', 'twitter'] : 
                     clientId === 'novi-1' ? ['tiktok', 'instagram'] : 
                     ['tiktok', 'twitter'],
          accounts: 0,
          postCount: 0,
          totalImpressions: 0,
          avgEngagement: 0
        },
        accounts: [],
        posts: [],
        charts: {
          postsOverTime: []
        }
      });
    }
  } catch (error) {
    console.error('Error fetching client details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client details' },
      { status: 500 }
    );
  }
}