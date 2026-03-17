import { NextResponse } from 'next/server';
import { PostBridgeClient } from '@/lib/postbridge';
import { getCompanyAccountIds, companies, getCompanyBySlug } from '@/lib/companies';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companySlug = searchParams.get('company') || 'all';
    const companyAccountIds = getCompanyAccountIds(companySlug);
    
    const { accounts, posts, analytics, postResults } = await PostBridgeClient.getAllData();
    
    // Filter posts and analytics by company account IDs
    const filteredPosts = companySlug === 'all' ? posts : posts.filter(post => 
      post.social_accounts.some(accountId => companyAccountIds.includes(accountId))
    );
    
    const filteredAnalytics = companySlug === 'all' ? analytics : analytics.filter(item => {
      // Find the account for this analytics item
      const account = accounts.find(acc => 
        acc.platform === 'tiktok' // Assuming analytics is mostly TikTok for now
      );
      return account && companyAccountIds.includes(account.id);
    });
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Calculate stats from filtered data
    const postsToday = filteredPosts.filter(post => {
      const postDate = new Date(post.created_at).toISOString().split('T')[0];
      return postDate === today;
    }).length;
    
    const postsThisWeek = filteredPosts.filter(post => {
      const postDate = new Date(post.created_at).toISOString().split('T')[0];
      return postDate >= weekAgo;
    }).length;
    
    const totalViews = filteredAnalytics.reduce((sum, item) => sum + (item.view_count || 0), 0);
    
    // Calculate success rate based on posted status and successful results
    const postedPosts = filteredPosts.filter(post => post.status === 'posted');
    const failedPosts = filteredPosts.filter(post => {
      const results = postResults.get(post.id) || [];
      return post.status === 'failed' || results.some(result => !result.success);
    });
    const successRate = filteredPosts.length > 0 ? ((filteredPosts.length - failedPosts.length) / filteredPosts.length) * 100 : 0;
    
    // Count unique accounts that have posted (filtered by company)
    const filteredAccountIds = companySlug === 'all' 
      ? new Set(filteredPosts.map(post => post.social_accounts[0]).filter(Boolean))
      : new Set(filteredPosts.map(post => post.social_accounts[0]).filter(id => companyAccountIds.includes(id)));
    const activeAccounts = filteredAccountIds.size;
    
    // Posts over time (last 7 days) - filtered
    const postsOverTime = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const count = filteredPosts.filter(post => {
        const postDate = new Date(post.created_at).toISOString().split('T')[0];
        return postDate === dateStr;
      }).length;
      postsOverTime.push({ date: dateStr, count });
    }
    
    // Views over time (last 7 days) - filtered analytics
    const viewsOverTime = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const views = filteredAnalytics.filter(item => {
        const analyticsDate = new Date(item.platform_created_at).toISOString().split('T')[0];
        return analyticsDate === dateStr;
      }).reduce((sum, item) => sum + (item.view_count || 0), 0);
      viewsOverTime.push({ date: dateStr, impressions: views });
    }
    
    // Count posts with low engagement - filtered
    const lowEngagementPosts = filteredAnalytics.filter(item => {
      const engagementRate = item.view_count > 0 
        ? ((item.like_count + item.comment_count + item.share_count) / item.view_count) * 100
        : 0;
      return engagementRate < 1.0;
    }).length;
    
    return NextResponse.json({
      stats: {
        postsToday,
        postsThisWeek,
        totalImpressions: totalViews, // Keep field name for compatibility, but it's actually views
        avgEngagementRate: 0, // Will calculate this properly if needed
        activeAccounts,
        successRate: Math.round(successRate * 100) / 100,
        lowEngagementPosts
      },
      charts: {
        postsOverTime,
        impressionsOverTime: viewsOverTime
      }
    });
  } catch (error) {
    console.error('Error fetching overview data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overview data' },
      { status: 500 }
    );
  }
}