import { NextResponse } from 'next/server';
import { PostBridgeClient, PostBridgeAccount, PostBridgeAnalytics } from '@/lib/postbridge';
import { getCompanyBySlug, getCompanyAccountIds, companies } from '@/lib/companies';

const getUsernameFromUrl = (url: string): string | null => {
  const match = url?.match?.(/tiktok\.com\/@([^/]+)/);
  return match ? match[1].toLowerCase() : null;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companySlug = searchParams.get('company') || 'all';
    const companyAccountIds = getCompanyAccountIds(companySlug);

    const { accounts, posts, analytics, postResults, fetchedAt } = await PostBridgeClient.getAllData(false);

    // Filter accounts by company
    const filteredAccounts = companySlug === 'all'
      ? accounts
      : accounts.filter(a => companyAccountIds.includes(a.id));

    // Build username map: accountId -> username
    const idToUsername = new Map<number, string>();
    for (const acc of accounts) {
      idToUsername.set(acc.id, acc.username.toLowerCase());
    }

    // Build analytics by username
    const analyticsByUsername = new Map<string, PostBridgeAnalytics[]>();
    for (const item of analytics) {
      const username = getUsernameFromUrl(item.share_url);
      if (!username) continue;
      if (!analyticsByUsername.has(username)) analyticsByUsername.set(username, []);
      analyticsByUsername.get(username)!.push(item);
    }

    // Build post count by account id
    const postCountByAccountId = new Map<number, number>();
    for (const post of posts) {
      if (post.status !== 'posted' && post.status !== 'scheduled') continue;
      for (const accId of post.social_accounts) {
        postCountByAccountId.set(accId, (postCountByAccountId.get(accId) || 0) + 1);
      }
    }

    // Build account response
    const accountData = filteredAccounts.map(acc => {
      const username = acc.username.toLowerCase();
      const accAnalytics = analyticsByUsername.get(username) || [];

      const totalViews = accAnalytics.reduce((s, a) => s + (a.view_count || 0), 0);
      const totalLikes = accAnalytics.reduce((s, a) => s + (a.like_count || 0), 0);
      const totalComments = accAnalytics.reduce((s, a) => s + (a.comment_count || 0), 0);
      const totalShares = accAnalytics.reduce((s, a) => s + (a.share_count || 0), 0);
      const postsLive = accAnalytics.length;
      const avgViews = postsLive > 0 ? Math.round(totalViews / postsLive) : 0;

      // Recent activity: views from posts in last 7 days (by day)
      const now = new Date();
      const recentActivity: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const dayViews = accAnalytics
          .filter(a => new Date(a.platform_created_at).toISOString().split('T')[0] === dateStr)
          .reduce((s, a) => s + (a.view_count || 0), 0);
        recentActivity.push(dayViews);
      }

      // Find which company this account belongs to
      const company = companies.find(c => c.postbridgeAccountIds.includes(acc.id));

      return {
        id: acc.id,
        username: acc.username,
        platform: acc.platform,
        companySlug: company?.slug || 'unknown',
        companyName: company?.name || 'Unknown',
        companyColor: company?.color || '#71717a',
        postsLive,
        totalViews,
        totalLikes,
        totalComments,
        totalShares,
        avgViews,
        recentActivity, // 7-day sparkline data
      };
    });

    // Sort by total views descending
    accountData.sort((a, b) => b.totalViews - a.totalViews);

    return NextResponse.json({ accounts: accountData, fetchedAt });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}
