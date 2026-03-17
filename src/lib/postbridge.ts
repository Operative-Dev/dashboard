const BASE_URL = 'https://api.post-bridge.com/v1';
const API_KEY = process.env.POSTBRIDGE_API_KEY;

if (!API_KEY) {
  throw new Error('POSTBRIDGE_API_KEY environment variable is required');
}

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60 * 1000;

export function clearCache() {
  cache.clear();
}

async function cachedFetch<T>(endpoint: string, cacheKey?: string, skipCache = false): Promise<T> {
  const key = cacheKey || endpoint;
  
  if (!skipCache) {
    const cached = cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached.data;
    }
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`PostBridge API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}

export interface PostBridgeAccount { id: number; platform: string; username: string; }
export interface PostBridgePost { id: number; caption: string; status: string; social_accounts: number[]; created_at: string; media: any[]; is_draft: boolean; platform_configurations: any; }
export interface PostBridgeResult { success: boolean; social_account_id: number; error: string | null; platform_data: any; }
export interface PostBridgeAnalytics { platform_post_id: string; view_count: number; like_count: number; comment_count: number; share_count: number; share_url: string; video_description: string; platform_created_at: string; }

export class PostBridgeClient {
  static async getAccounts(fresh = false): Promise<{ data: PostBridgeAccount[] }> {
    return cachedFetch('/social-accounts', undefined, fresh);
  }

  static async getPosts(limit = 50, fresh = false): Promise<{ data: PostBridgePost[] }> {
    return cachedFetch(`/posts?limit=${limit}`, undefined, fresh);
  }

  static async getPostResults(postId: number, fresh = false): Promise<{ data: PostBridgeResult[] }> {
    return cachedFetch(`/post-results?post_id=${postId}`, `post-results-${postId}`, fresh);
  }

  static async getAnalytics(platform = 'tiktok', timeframe = '30d', limit = 50, fresh = false): Promise<{ data: PostBridgeAnalytics[] }> {
    return cachedFetch(`/analytics?platform=${platform}&timeframe=${timeframe}&limit=${limit}`, `analytics-${platform}-${timeframe}-${limit}`, fresh);
  }

  static async syncAnalytics(): Promise<any> {
    const response = await fetch(`${BASE_URL}/analytics/sync`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: 'tiktok' }),
    });
    return response.json();
  }

  static async getAllData(fresh = false) {
    const [accountsData, postsData, analyticsData] = await Promise.all([
      this.getAccounts(fresh),
      this.getPosts(50, fresh),
      this.getAnalytics('tiktok', '30d', 50, fresh)
    ]);

    const postResultsPromises = postsData.data.map(post =>
      this.getPostResults(post.id, fresh).catch(() => ({ data: [] }))
    );
    const postResults = await Promise.all(postResultsPromises);

    const resultsMap = new Map();
    postsData.data.forEach((post, index) => {
      resultsMap.set(post.id, postResults[index].data);
    });

    return {
      accounts: accountsData.data,
      posts: postsData.data,
      analytics: analyticsData.data,
      postResults: resultsMap,
      fetchedAt: new Date().toISOString(),
    };
  }
}
