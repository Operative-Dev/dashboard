export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { PostBridgeClient } from '@/lib/postbridge';
import { getCompanyAccountIds, companies, getCompanyBySlug } from '@/lib/companies';
import { supabaseAdmin } from '@/lib/supabase';

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
    
    // Count posts today from both analytics AND posts (analytics may lag behind for new posts)
    const analyticsToday = filteredAnalytics.filter(item => {
      const postDate = toLocalDate(new Date(item.platform_created_at));
      return postDate === today;
    }).length;
    
    const postedPostsToday = filteredPosts.filter(post => {
      const postDate = toLocalDate(new Date(post.created_at));
      return postDate === today;
    }).length;
    
    // Use the higher of analytics vs posts count (analytics lags for newly published posts)
    const postsToday = Math.max(analyticsToday, postedPostsToday);
    
    const analyticsThisWeek = filteredAnalytics.filter(item => {
      const postDate = toLocalDate(new Date(item.platform_created_at));
      return postDate >= weekAgo;
    }).length;
    
    const postedPostsThisWeek = filteredPosts.filter(post => {
      const postDate = toLocalDate(new Date(post.created_at));
      return postDate >= weekAgo;
    }).length;
    
    const postsThisWeek = Math.max(analyticsThisWeek, postedPostsThisWeek);
    
    const queuedToday = Math.max(0, postedPostsToday - analyticsToday);
    
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
    
    // Posts over time - use BOTH analytics and posts, take the higher count per day
    // (analytics lags behind for newly published posts)
    const postsOverTime = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = toLocalDate(date);
      const analyticsCount = filteredAnalytics.filter(item => {
        const postDate = toLocalDate(new Date(item.platform_created_at));
        return postDate === dateStr;
      }).length;
      const postsCount = filteredPosts.filter(post => {
        const postDate = toLocalDate(new Date(post.created_at));
        return postDate === dateStr;
      }).length;
      postsOverTime.push({ date: dateStr, count: Math.max(analyticsCount, postsCount) });
    }
    
    // Views over time - filtered analytics (use PST dates)
    const viewsOverTime = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = toLocalDate(date);
      const views = filteredAnalytics.filter(item => {
        const analyticsDate = toLocalDate(new Date(item.platform_created_at));
        return analyticsDate === dateStr;
      }).reduce((sum, item) => sum + (item.view_count || 0), 0);
      viewsOverTime.push({ date: dateStr, impressions: views });
    }
    
    // --- Supabase daily_analytics overlay ---
    let viewsToday = 0;
    let supabaseViewsOverTime: { date: string; impressions: number }[] | null = null;
    try {
      const startDate = toLocalDate(new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000));
      const endDate = today;
      
      let daQuery = supabaseAdmin.from('daily_analytics')
        .select('date, client, total_views')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });
      
      if (companySlug !== 'all') {
        daQuery = daQuery.eq('client', companySlug);
      }
      
      const { data: dailyRows, error } = await daQuery;
      
      if (!error && dailyRows && dailyRows.length > 0) {
        // Aggregate by date
        const byDate = new Map<string, number>();
        for (const row of dailyRows) {
          byDate.set(row.date, (byDate.get(row.date) || 0) + (row.total_views || 0));
        }
        
        // Build the chart data - show cumulative views per day from daily_analytics
        supabaseViewsOverTime = [];
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const dateStr = toLocalDate(date);
          supabaseViewsOverTime.push({ date: dateStr, impressions: byDate.get(dateStr) || 0 });
        }
        
        // Views today = today's total_views minus yesterday's total_views (delta)
        const todayViews = byDate.get(today) || 0;
        const yesterday = toLocalDate(new Date(now.getTime() - 24 * 60 * 60 * 1000));
        
        // For delta, check if we have yesterday's snapshot
        let yQuery = supabaseAdmin.from('daily_analytics')
          .select('total_views')
          .eq('date', yesterday);
        if (companySlug !== 'all') yQuery = yQuery.eq('client', companySlug);
        const { data: yRows } = await yQuery;
        const yesterdayViews = yRows?.reduce((s, r) => s + (r.total_views || 0), 0) || 0;
        
        // If we only have one day of data, viewsToday = 0 (can't compute delta yet)
        viewsToday = yesterdayViews > 0 ? Math.max(0, todayViews - yesterdayViews) : 0;
      }
    } catch (e) {
      console.error('Supabase daily_analytics fetch error:', e);
      // Fall back to PostBridge-only data
    }

    // Use Supabase total views as source of truth (more accurate than PostBridge analytics cache)
    let supabaseTotalViews: number | null = null;
    try {
      let tvQuery = supabaseAdmin.from('daily_analytics')
        .select('total_views');
      if (companySlug !== 'all') {
        tvQuery = tvQuery.eq('client', companySlug);
      }
      // Get latest date's data for total views
      const { data: tvRows } = await tvQuery;
      if (tvRows && tvRows.length > 0) {
        supabaseTotalViews = tvRows.reduce((s: number, r: any) => s + (r.total_views || 0), 0);
      }
    } catch (e) {
      console.error('Supabase total views fetch error:', e);
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
        const companyPostCount = Math.max(companyAnalytics.length, companyPosts.length);
        const companyPostsThisWeekAnalytics = companyAnalytics.filter(item => {
          const postDate = toLocalDate(new Date(item.platform_created_at));
          return postDate >= weekAgo;
        }).length;
        const companyPostsThisWeekPosts = companyPosts.filter(post => {
          const postDate = toLocalDate(new Date(post.created_at));
          return postDate >= weekAgo;
        }).length;
        const companyPostsThisWeek = Math.max(companyPostsThisWeekAnalytics, companyPostsThisWeekPosts);

        return {
          id: company.id,
          name: company.name,
          slug: company.slug,
          status: company.status,
          platforms: company.platforms,
          color: company.color,
          postCount: companyPostCount,
          postsThisWeek: companyPostsThisWeek,
          hasPostBridgeData: !!company.postbridgeApiKey
        };
      });
    }
    
    return NextResponse.json({
      stats: {
        postsToday,
        postsThisWeek,
        totalImpressions: supabaseTotalViews ?? totalViews,
        totalImpressionsIsAllTime: true,
        viewsToday,
        avgEngagementRate: 0,
        activeAccounts,
        successRate: Math.round(successRate * 100) / 100,
        lowEngagementPosts,
        queuedToday: Math.max(0, queuedToday),
        totalQueued: filteredPosts.length - filteredAnalytics.length,
        totalLive: filteredAnalytics.length,
      },
      charts: {
        postsOverTime,
        impressionsOverTime: supabaseViewsOverTime || viewsOverTime
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