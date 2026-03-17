import { NextResponse } from 'next/server';
import { PostBridgeClient } from '@/lib/postbridge';
import { getCompanyAccountIds, companies } from '@/lib/companies';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const companySlug = searchParams.get('company') || 'all';
    const fresh = searchParams.get('fresh') === '1';
    const companyAccountIds = getCompanyAccountIds(companySlug);
    
    const { accounts, posts, analytics, postResults } = await PostBridgeClient.getAllData(fresh);
    
    // Filter posts by company account IDs
    const filteredPosts = companySlug === 'all' ? posts : posts.filter(post => 
      post.social_accounts.some(accountId => companyAccountIds.includes(accountId))
    );
    
    // Create account lookup map
    const accountsMap = new Map<number, typeof accounts[0]>();
    accounts.forEach(account => {
      accountsMap.set(account.id, account);
    });
    
    // Build analytics lookup using TWO strategies:
    // 1. post_result_id join (most accurate)
    // 2. username + caption fallback (for posts without result data)
    
    const analyticsByResultId = new Map<string, typeof analytics[0]>();
    // Key: "username|caption_prefix" → analytics entries for that combo
    const analyticsByAccountCaption = new Map<string, typeof analytics[0][]>();
    
    analytics.forEach(item => {
      // Strategy 1: index by post_result_id
      if (item.post_result_id) {
        analyticsByResultId.set(item.post_result_id, item);
      }
      
      // Strategy 2: index by username extracted from share_url + caption
      const usernameMatch = item.share_url?.match(/tiktok\.com\/@([^/]+)/);
      if (usernameMatch && item.video_description) {
        const key = `${usernameMatch[1].toLowerCase()}|${item.video_description.substring(0, 60)}`;
        const existing = analyticsByAccountCaption.get(key) || [];
        existing.push(item);
        analyticsByAccountCaption.set(key, existing);
      }
    });
    
    // Track which analytics entries have been claimed (to avoid double-counting)
    const claimedAnalytics = new Set<string>();
    
    // Transform filtered posts
    const transformedPosts = filteredPosts
      .slice(0, limit ? parseInt(limit) : 100)
      .map(post => {
        const account = accountsMap.get(post.social_accounts[0]);
        const results = postResults.get(post.id.toString()) || [];
        
        // Strategy 1: match via post_result_id
        let analyticsData: typeof analytics[0] | null = null;
        for (const result of results) {
          const match = analyticsByResultId.get(result.id);
          if (match && !claimedAnalytics.has(match.platform_post_id)) {
            analyticsData = match;
            claimedAnalytics.add(match.platform_post_id);
            break;
          }
        }
        
        // Strategy 2: fallback to username + caption match
        if (!analyticsData && account) {
          const key = `${account.username.toLowerCase()}|${post.caption.substring(0, 60)}`;
          const candidates = analyticsByAccountCaption.get(key) || [];
          // Pick the first unclaimed one (ordered by time from API)
          for (const candidate of candidates) {
            if (!claimedAnalytics.has(candidate.platform_post_id)) {
              analyticsData = candidate;
              claimedAnalytics.add(candidate.platform_post_id);
              break;
            }
          }
        }
        
        return {
          id: post.id.toString(),
          account_id: post.social_accounts[0]?.toString() || '',
          content: post.caption,
          media_url: post.media && post.media.length > 0 ? post.media[0].url || null : null,
          status: post.status,
          created_at: post.created_at,
          published_at: post.status === 'posted' ? post.created_at : null,
          agent_id: 'Agent',
          handle: account ? `@${account.username}` : '@unknown',
          account_name: account ? account.username : 'Unknown',
          platform: account ? account.platform : 'tiktok',
          client_name: companies.find(c => c.postbridgeAccountIds.includes(post.social_accounts[0]))?.name || 'Unknown',
          impressions: analyticsData?.view_count || 0,
          likes: analyticsData?.like_count || 0,
          comments: analyticsData?.comment_count || 0,
          shares: analyticsData?.share_count || 0,
          engagement_rate: analyticsData ? 
            (analyticsData.view_count > 0 
              ? ((analyticsData.like_count + analyticsData.comment_count + analyticsData.share_count) / analyticsData.view_count) * 100
              : 0) 
            : 0,
          tiktok_url: analyticsData?.share_url || 
            (results.find((r: any) => r.platform_data?.url)?.platform_data?.url) ||
            (account ? `https://www.tiktok.com/@${account.username}` : null),
          is_draft: post.is_draft,
          has_failed_results: results.some((result: any) => !result.success)
        };
      });
    
    // Sort: live posts (with views) first by most views, then queued posts by newest
    transformedPosts.sort((a, b) => {
      if (a.impressions > 0 && b.impressions === 0) return -1;
      if (a.impressions === 0 && b.impressions > 0) return 1;
      if (a.impressions > 0 && b.impressions > 0) return b.impressions - a.impressions;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
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
