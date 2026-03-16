import { NextResponse } from 'next/server';
import { PostBridgeClient } from '@/lib/postbridge';

export async function GET() {
  try {
    const { accounts, posts, analytics, postResults } = await PostBridgeClient.getAllData();
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Calculate stats from real data
    const postsToday = posts.filter(post => {
      const postDate = new Date(post.created_at).toISOString().split('T')[0];
      return postDate === today;
    }).length;
    
    const postsThisWeek = posts.filter(post => {
      const postDate = new Date(post.created_at).toISOString().split('T')[0];
      return postDate >= weekAgo;
    }).length;
    
    const totalViews = analytics.reduce((sum, item) => sum + (item.view_count || 0), 0);
    
    // Calculate success rate based on posted status and successful results
    const postedPosts = posts.filter(post => post.status === 'posted');
    const failedPosts = posts.filter(post => {
      const results = postResults.get(post.id) || [];
      return post.status === 'failed' || results.some(result => !result.success);
    });
    const successRate = posts.length > 0 ? ((posts.length - failedPosts.length) / posts.length) * 100 : 0;
    
    // Count unique accounts that have posted
    const activeAccountIds = new Set(posts.map(post => post.social_accounts[0]).filter(Boolean));
    const activeAccounts = activeAccountIds.size;
    
    // Posts over time (last 7 days)
    const postsOverTime = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const count = posts.filter(post => {
        const postDate = new Date(post.created_at).toISOString().split('T')[0];
        return postDate === dateStr;
      }).length;
      postsOverTime.push({ date: dateStr, count });
    }
    
    // Views over time (last 7 days) - group analytics by date
    const viewsOverTime = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const views = analytics.filter(item => {
        const analyticsDate = new Date(item.platform_created_at).toISOString().split('T')[0];
        return analyticsDate === dateStr;
      }).reduce((sum, item) => sum + (item.view_count || 0), 0);
      viewsOverTime.push({ date: dateStr, impressions: views });
    }
    
    // Count posts with low engagement
    const lowEngagementPosts = analytics.filter(item => {
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