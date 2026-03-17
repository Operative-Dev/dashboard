import { NextResponse } from 'next/server';
import { PostBridgeClient } from '@/lib/postbridge';
import { getCompanyAccountIds } from '@/lib/companies';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companySlug = searchParams.get('company') || 'all';
    const companyAccountIds = getCompanyAccountIds(companySlug);
    
    const { accounts, posts, analytics, postResults } = await PostBridgeClient.getAllData();
    
    // Filter posts by company account IDs
    const filteredPosts = companySlug === 'all' ? posts : posts.filter(post => 
      post.social_accounts.some(accountId => companyAccountIds.includes(accountId))
    );
    
    // Create account lookup
    const accountsMap = new Map();
    accounts.forEach(account => {
      accountsMap.set(account.id, account);
    });
    
    // Create analytics lookup
    const analyticsMap = new Map();
    analytics.forEach(item => {
      analyticsMap.set(item.platform_post_id, item);
    });
    
    // Failed posts - filtered posts with failed results or failed status
    const failedPosts = filteredPosts.filter(post => {
      const results = postResults.get(post.id.toString()) || [];
      return post.status === 'failed' || results.some((result: any) => !result.success);
    }).map(post => {
      const account = accountsMap.get(post.social_accounts[0]);
      return {
        id: post.id.toString(),
        content: post.caption,
        handle: account ? `@${account.username}` : '@unknown',
        platform: account?.platform || 'tiktok',
        status: post.status,
        created_at: post.created_at,
        client_name: 'Woz',
        reason: 'Publishing failed or API error'
      };
    });
    
    // Low engagement posts - filtered posts with very low engagement rates
    const lowEngagementPosts = filteredPosts.filter(post => {
      const analyticsData = analyticsMap.get(post.id.toString());
      if (!analyticsData || analyticsData.view_count === 0) return false;
      
      const engagementRate = ((analyticsData.like_count + analyticsData.comment_count + analyticsData.share_count) / analyticsData.view_count) * 100;
      return engagementRate < 1.0;
    }).map(post => {
      const account = accountsMap.get(post.social_accounts[0]);
      const analyticsData = analyticsMap.get(post.id.toString());
      const engagementRate = analyticsData ? 
        ((analyticsData.like_count + analyticsData.comment_count + analyticsData.share_count) / analyticsData.view_count) * 100 
        : 0;
      
      return {
        id: post.id.toString(),
        content: post.caption,
        handle: account ? `@${account.username}` : '@unknown',
        platform: account?.platform || 'tiktok',
        status: post.status,
        created_at: post.created_at,
        client_name: 'Woz',
        engagement_rate: Math.round(engagementRate * 100) / 100,
        reason: `Low engagement rate: ${Math.round(engagementRate * 100) / 100}%`
      };
    });
    
    // Stale scheduled posts - filtered posts scheduled but still pending after 24h
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const staleScheduledPosts = filteredPosts.filter(post => {
      return post.status === 'scheduled' && new Date(post.created_at) < dayAgo;
    }).map(post => {
      const account = accountsMap.get(post.social_accounts[0]);
      return {
        id: post.id.toString(),
        content: post.caption,
        handle: account ? `@${account.username}` : '@unknown',
        platform: account?.platform || 'tiktok',
        status: post.status,
        created_at: post.created_at,
        client_name: 'Woz',
        reason: 'Scheduled for more than 24 hours'
      };
    });

    return NextResponse.json({ 
      failedPosts, 
      lowEngagementPosts, 
      staleScheduledPosts 
    });
  } catch (error) {
    console.error('Error fetching needs attention data:', error);
    return NextResponse.json({ error: 'Failed to fetch needs attention data' }, { status: 500 });
  }
}