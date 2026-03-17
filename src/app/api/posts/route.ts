import { NextResponse } from 'next/server';
import { PostBridgeClient } from '@/lib/postbridge';
import { getCompanyAccountIds } from '@/lib/companies';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const companySlug = searchParams.get('company') || 'all';
    const companyAccountIds = getCompanyAccountIds(companySlug);
    
    const { accounts, posts, analytics, postResults } = await PostBridgeClient.getAllData();
    
    // Filter posts by company account IDs
    const filteredPosts = companySlug === 'all' ? posts : posts.filter(post => 
      post.social_accounts.some(accountId => companyAccountIds.includes(accountId))
    );
    
    // Create account lookup map
    const accountsMap = new Map();
    accounts.forEach(account => {
      accountsMap.set(account.id, account);
    });
    
    // Create analytics lookup map by video_description (caption match) since we don't have platform_post_id on posts
    const analyticsMap = new Map();
    analytics.forEach(item => {
      // Index by description for matching
      if (item.video_description) {
        analyticsMap.set(item.video_description.substring(0, 80), item);
      }
    });
    
    // Transform filtered posts to match the expected format
    const transformedPosts = filteredPosts
      .slice(0, limit ? parseInt(limit) : 50)
      .map(post => {
        const account = accountsMap.get(post.social_accounts[0]);
        const analyticsData = analyticsMap.get(post.caption.substring(0, 80));
        const results = postResults.get(post.id) || [];
        
        return {
          id: post.id.toString(),
          account_id: post.social_accounts[0]?.toString() || '',
          content: post.caption,
          media_url: post.media && post.media.length > 0 ? post.media[0].url || null : null,
          status: post.status,
          created_at: post.created_at,
          published_at: post.status === 'posted' ? post.created_at : null,
          agent_id: 'Agent', // Default agent name
          handle: account ? `@${account.username}` : '@unknown',
          account_name: account ? account.username : 'Unknown',
          platform: account ? account.platform : 'tiktok',
          client_name: 'Woz', // All current accounts belong to Woz
          // Analytics data
          impressions: analyticsData?.view_count || 0,
          likes: analyticsData?.like_count || 0,
          comments: analyticsData?.comment_count || 0,
          shares: analyticsData?.share_count || 0,
          engagement_rate: analyticsData ? 
            (analyticsData.view_count > 0 
              ? ((analyticsData.like_count + analyticsData.comment_count + analyticsData.share_count) / analyticsData.view_count) * 100
              : 0) 
            : 0,
          // TikTok URL from analytics or results
          tiktok_url: analyticsData?.share_url || 
            (results.find((r: any) => r.platform_data?.url)?.platform_data?.url) ||
            (account ? `https://www.tiktok.com/@${account.username}` : null),
          // Additional metadata
          is_draft: post.is_draft,
          has_failed_results: results.some((result: any) => !result.success)
        };
      });
    
    return NextResponse.json({ posts: transformedPosts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}