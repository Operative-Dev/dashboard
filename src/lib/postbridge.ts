const BASE_URL = 'https://api.post-bridge.com/v1';
const API_KEY = process.env.POSTBRIDGE_API_KEY;

if (!API_KEY) {
  throw new Error('POSTBRIDGE_API_KEY environment variable is required');
}

// Simple cache to avoid hammering the API
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60 * 1000; // 60 seconds

async function cachedFetch<T>(endpoint: string, cacheKey?: string): Promise<T> {
  const key = cacheKey || endpoint;
  const cached = cache.get(key);
  const now = Date.now();

  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
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
  cache.set(key, { data, timestamp: now });
  
  return data;
}

export interface PostBridgeAccount {
  id: number;
  platform: string;
  username: string;
}

export interface PostBridgePost {
  id: number;
  caption: string;
  status: string;
  social_accounts: number[];
  created_at: string;
  media: any[];
  is_draft: boolean;
  platform_configurations: any;
}

export interface PostBridgeResult {
  success: boolean;
  social_account_id: number;
  error: string | null;
  platform_data: any;
}

export interface PostBridgeAnalytics {
  platform_post_id: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  share_url: string;
  video_description: string;
  platform_created_at: string;
}

export class PostBridgeClient {
  static async getAccounts(): Promise<{ data: PostBridgeAccount[] }> {
    return cachedFetch('/social-accounts');
  }

  static async getPosts(limit = 50): Promise<{ data: PostBridgePost[] }> {
    return cachedFetch(`/posts?limit=${limit}`);
  }

  static async getPostResults(postId: number): Promise<{ data: PostBridgeResult[] }> {
    return cachedFetch(`/post-results?post_id=${postId}`, `post-results-${postId}`);
  }

  static async getAnalytics(platform = 'tiktok', timeframe = '30d', limit = 50): Promise<{ data: PostBridgeAnalytics[] }> {
    return cachedFetch(`/analytics?platform=${platform}&timeframe=${timeframe}&limit=${limit}`, `analytics-${platform}-${timeframe}-${limit}`);
  }

  // Helper method to get all data needed for the dashboard
  static async getAllData() {
    const [accountsData, postsData, analyticsData] = await Promise.all([
      this.getAccounts(),
      this.getPosts(50),
      this.getAnalytics('tiktok', '30d', 50)
    ]);

    // Also fetch results for all posts
    const postResultsPromises = postsData.data.map(post => 
      this.getPostResults(post.id).catch(() => ({ data: [] }))
    );
    const postResults = await Promise.all(postResultsPromises);

    // Create a map of post ID to results
    const resultsMap = new Map();
    postsData.data.forEach((post, index) => {
      resultsMap.set(post.id, postResults[index].data);
    });

    return {
      accounts: accountsData.data,
      posts: postsData.data,
      analytics: analyticsData.data,
      postResults: resultsMap
    };
  }
}