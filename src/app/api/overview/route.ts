import { NextResponse } from 'next/server';
import { PostBridgeClient } from '@/lib/postbridge';
import { getCompanyAccountIds, companies, getCompanyBySlug } from '@/lib/companies';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companySlug = searchParams.get('company') || 'all';
    const fresh = searchParams.get('fresh') === '1';
    const days = parseInt(searchParams.get('days') || '7');
    const companyAccountIds = getCompanyAccountIds(companySlug);
    
    const { accounts, posts, analytics, postResults, fetchedAt } = await PostBridgeClient.getAllData(fresh);
    
    // Filter posts and analytics by company account IDs
    const filteredPosts = companySlug === 'all' ? posts : posts.filter(post => 
      post.social_accounts.some(accountId => companyAccountIds.includes(accountId))
    );
    
    // Build set of known usernames from our accounts (to filter out stray analytics)
    const knownUsernames = new Set(accounts.map(acc => acc.username.toLowerCase()));
    
    // Extract username from TikTok share_url (e.g. https://www.tiktok.com/@username/video/...)
    const getUsernameFromUrl = (url: string): string | null => {
      const match = url?.match?.(/tiktok\.com\/@([^/]+)/);
      return match ? match[1].toLowerCase() : null;
    };
    
    // Filter analytics to only include posts from our known accounts
    const ownedAnalytics = analytics.filter(item => {
      const username = getUsernameFromUrl(item.share_url);
      return username && knownUsernames.has(username);
    });
    
    const filteredAnalytics = companySlug === 'all' ? ownedAnalytics : ownedAnalytics.filter(item => {
      const username = getUsernameFromUrl(item.share_url);
      const account = accounts.find(acc => acc.username.toLowerCase() === username);
      return account && companyAccountIds.includes(account.id);
    });
    
    const now = new Date();
    // Use PDT (UTC-7) for date calculations to match user's timezone
    const toLocalDate = (d: Date) => {
      const local = new Date(d.getTime() - 7 * 60 * 60 * 1000);
      return local.toISOString().split('T')[0];
    };
    const today = toLocalDate(now);
    const weekAgo = toLocalDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    
    // Count from analytics directly — each analytics entry = 1 actually-published post on TikTok
    const postsToday = filteredAnalytics.filter(item => {
      const postDate = toLocalDate(new Date(item.platform_created_at));
      return postDate === today;
    }).length;
    
    const postsThisWeek = filteredAnalytics.filter(item => {
      const postDate = toLocalDate(new Date(item.platform_created_at));
      return postDate >= weekAgo;
    }).length;
    
    const queuedToday = filteredPosts.filter(post => {
      const postDate = toLocalDate(new Date(post.created_at));
      return postDate === today;
    }).length - postsToday;
    
    const totalViews = filteredAnalytics.reduce((sum, item) => sum + (item.view_count || 0), 0);
    
    // Calculate success rate based on posted status and successful results
    const postedPosts = filteredPosts.filter(post => post.status === 'posted');
    const failedPosts = filteredPosts.filter(post => {
      const results = postResults.get(post.id.toString()) || [];
      return post.status === 'failed' || results.some((result: any) => !result.success);
    });
    const successRate = filteredPosts.length > 0 ? ((filteredPosts.length - failedPosts.length) / filteredPosts.length) * 100 : 0;
    
    // Count unique accounts that have posted (filtered by company)
    const filteredAccountIds = companySlug === 'all' 
      ? new Set(filteredPosts.map(post => post.social_accounts[0]).filter(Boolean))
      : new Set(filteredPosts.map(post => post.social_accounts[0]).filter(id => companyAccountIds.includes(id)));
    const activeAccounts = filteredAccountIds.size;
    
    // Posts over time - filtered
    const postsOverTime = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const count = filteredAnalytics.filter(item => {
        const postDate = toLocalDate(new Date(item.platform_created_at));
        return postDate === dateStr;
      }).length;
      postsOverTime.push({ date: dateStr, count });
    }
    
    // Views over time - filtered analytics
    const viewsOverTime = [];
    for (let i = days - 1; i >= 0; i--) {
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

    // Company summaries — all companies when viewing "all", or just the selected one
    let companySummaries: any[] = [];
    const companiesToSummarize = companySlug === 'all' 
      ? companies 
      : companies.filter(c => c.slug === companySlug);
    if (companiesToSummarize.length > 0) {
      companySummaries = companiesToSummarize.map(company => {
        const companyPosts = posts.filter(post => 
          post.social_accounts.some(accountId => company.postbridgeAccountIds.includes(accountId))
        );
        // Count from analytics for this company's accounts
        const companyAnalytics = ownedAnalytics.filter(item => {
          const username = getUsernameFromUrl(item.share_url);
          const account = accounts.find(acc => acc.username.toLowerCase() === username);
          return account && company.postbridgeAccountIds.includes(account.id);
        });
        const companyPostCount = companyAnalytics.length;
        const companyPostsThisWeek = companyAnalytics.filter(item => {
          const postDate = toLocalDate(new Date(item.platform_created_at));
          return postDate >= weekAgo;
        }).length;

        return {
          id: company.id,
          name: company.name,
          slug: company.slug,
          status: company.status,
          platforms: company.platforms,
          color: company.color,
          postCount: companyPostCount,
          postsThisWeek: companyPostsThisWeek,
          hasPostBridgeData: company.postbridgeAccountIds.length > 0
        };
      });
    }
    
    return NextResponse.json({
      stats: {
        postsToday,
        postsThisWeek,
        totalImpressions: totalViews, // Keep field name for compatibility, but it's actually views
        avgEngagementRate: 0, // Will calculate this properly if needed
        activeAccounts,
        successRate: Math.round(successRate * 100) / 100,
        lowEngagementPosts,
        queuedToday: Math.max(0, queuedToday),
        totalQueued: filteredPosts.length - filteredAnalytics.length,
        totalLive: filteredAnalytics.length,
      },
      charts: {
        postsOverTime,
        impressionsOverTime: viewsOverTime
      },
      companySummaries,
      fetchedAt,
    });
  } catch (error) {
    console.error('Error fetching overview data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overview data' },
      { status: 500 }
    );
  }
}