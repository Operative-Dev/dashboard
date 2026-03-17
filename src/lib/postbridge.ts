import { companies, Company } from './companies';

const BASE_URL = 'https://api.post-bridge.com/v1';

// In-memory cache — survives across requests within the same serverless instance
// Works on both local dev and Netlify/Vercel (no filesystem needed)
const memoryCache = new Map<string, { data: CachedData; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes — auto-refresh after this

interface CachedData {
  accounts: PostBridgeAccount[];
  posts: PostBridgePost[];
  analytics: PostBridgeAnalytics[];
  postResults: Record<string, PostBridgeResult[]>;
  fetchedAt: string;
}

function readCache(companySlug: string): CachedData | null {
  const entry = memoryCache.get(companySlug);
  if (entry && (Date.now() - entry.timestamp) < CACHE_TTL) {
    return entry.data;
  }
  return null;
}

function writeCache(companySlug: string, data: CachedData) {
  memoryCache.set(companySlug, { data, timestamp: Date.now() });
}

export function clearCache() {
  memoryCache.clear();
}

async function apiFetch<T>(endpoint: string, apiKey: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`PostBridge API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/** Paginate through all results for an endpoint (max 100 per page) */
async function fetchAll<T>(endpoint: string, apiKey: string): Promise<T[]> {
  const all: T[] = [];
  let offset = 0;
  const pageSize = 100;
  
  while (true) {
    const separator = endpoint.includes('?') ? '&' : '?';
    const res: { data: T[]; meta?: { total?: number } } = await apiFetch(
      `${endpoint}${separator}limit=${pageSize}&offset=${offset}`,
      apiKey
    );
    all.push(...res.data);
    
    if (res.data.length < pageSize || (res.meta?.total && all.length >= res.meta.total)) {
      break;
    }
    offset += pageSize;
  }
  return all;
}

export interface PostBridgeAccount { id: number; platform: string; username: string; }
export interface PostBridgePost { id: number; caption: string; status: string; social_accounts: number[]; created_at: string; media: any[]; is_draft: boolean; platform_configurations: any; }
export interface PostBridgeResult { id: string; success: boolean; social_account_id: number; error: string | null; platform_data: any; }
export interface PostBridgeAnalytics { platform_post_id: string; post_result_id: string; view_count: number; like_count: number; comment_count: number; share_count: number; share_url: string; video_description: string; platform_created_at: string; }

/** Sync a single company's data from PostBridge API */
async function syncCompanyData(company: Company): Promise<CachedData> {
  const apiKey = company.postbridgeApiKey;
  if (!apiKey) throw new Error(`No API key for ${company.slug}`);

  const [accounts, posts, analytics] = await Promise.all([
    fetchAll<PostBridgeAccount>('/social-accounts', apiKey),
    fetchAll<PostBridgePost>('/posts', apiKey),
    fetchAll<PostBridgeAnalytics>('/analytics?platform=tiktok&timeframe=all', apiKey),
  ]);

  // Fetch post results in batches
  const resultsObj: Record<string, PostBridgeResult[]> = {};
  const batchSize = 10;
  for (let i = 0; i < posts.length; i += batchSize) {
    const batch = posts.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(post =>
        apiFetch<{ data: PostBridgeResult[] }>(`/post-results?post_id=${post.id}`, apiKey)
          .then(r => r.data)
          .catch(() => [] as PostBridgeResult[])
      )
    );
    batch.forEach((post, idx) => {
      resultsObj[post.id.toString()] = results[idx];
    });
  }

  const data: CachedData = {
    accounts,
    posts,
    analytics,
    postResults: resultsObj,
    fetchedAt: new Date().toISOString(),
  };

  writeCache(company.slug, data);
  return data;
}

/** Merge multiple CachedData objects into one unified result */
function mergeData(datasets: CachedData[]) {
  const accounts: PostBridgeAccount[] = [];
  const posts: PostBridgePost[] = [];
  const analytics: PostBridgeAnalytics[] = [];
  const postResults: Record<string, PostBridgeResult[]> = {};
  let latestFetchedAt = '';

  for (const d of datasets) {
    accounts.push(...d.accounts);
    posts.push(...d.posts);
    analytics.push(...d.analytics);
    Object.assign(postResults, d.postResults);
    if (d.fetchedAt > latestFetchedAt) latestFetchedAt = d.fetchedAt;
  }

  return {
    accounts,
    posts,
    analytics,
    postResults: new Map(Object.entries(postResults)),
    fetchedAt: latestFetchedAt || new Date().toISOString(),
  };
}

/** Get companies that have a PostBridge API key */
function companiesWithKeys(): Company[] {
  return companies.filter(c => c.postbridgeApiKey);
}

/** Get data for a single company — from cache or fresh fetch */
async function getCompanyData(company: Company): Promise<CachedData | null> {
  if (!company.postbridgeApiKey) return null;
  
  // Try cache first
  const cached = readCache(company.slug);
  if (cached) return cached;
  
  // No cache — fetch fresh
  try {
    return await syncCompanyData(company);
  } catch (e) {
    console.error(`Failed to fetch data for ${company.slug}:`, e);
    return null;
  }
}

export class PostBridgeClient {
  /** Sync analytics for a specific company */
  static async syncAnalytics(apiKey: string): Promise<any> {
    const response = await fetch(`${BASE_URL}/analytics/sync`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: 'tiktok' }),
    });
    return response.json();
  }

  /** Sync a single company by slug */
  static async syncCompany(companySlug: string): Promise<CachedData | null> {
    const company = companies.find(c => c.slug === companySlug);
    if (!company || !company.postbridgeApiKey) return null;

    try { await PostBridgeClient.syncAnalytics(company.postbridgeApiKey); } catch {}
    return syncCompanyData(company);
  }

  /** Sync ALL companies that have API keys */
  static async syncAll(): Promise<void> {
    const active = companiesWithKeys();
    await Promise.allSettled(
      active.map(c => PostBridgeClient.syncAnalytics(c.postbridgeApiKey))
    );
    await Promise.allSettled(
      active.map(c => syncCompanyData(c))
    );
  }

  /**
   * Get all data — serves from in-memory cache (5 min TTL).
   * On cache miss, fetches from PostBridge automatically.
   * fresh=true forces a re-fetch for all companies.
   */
  static async getAllData(fresh = false) {
    const active = companiesWithKeys();

    if (fresh) {
      await PostBridgeClient.syncAll();
      // Read back from cache after sync
      const datasets: CachedData[] = [];
      for (const company of active) {
        const cached = readCache(company.slug);
        if (cached) datasets.push(cached);
      }
      return mergeData(datasets);
    }

    // Non-fresh: get each company's data (cache or fetch)
    const results = await Promise.all(
      active.map(c => getCompanyData(c))
    );
    
    const datasets = results.filter((d): d is CachedData => d !== null);
    return mergeData(datasets);
  }
}
