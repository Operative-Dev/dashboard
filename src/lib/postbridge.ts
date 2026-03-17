import fs from 'fs';
import path from 'path';
import { companies, Company } from './companies';

const BASE_URL = 'https://api.post-bridge.com/v1';

// File-based cache — one file per company
const CACHE_DIR = path.join(process.cwd(), '.cache');

interface CachedData {
  accounts: PostBridgeAccount[];
  posts: PostBridgePost[];
  analytics: PostBridgeAnalytics[];
  postResults: Record<string, PostBridgeResult[]>;
  fetchedAt: string;
}

function cacheFile(companySlug: string): string {
  return path.join(CACHE_DIR, `postbridge-${companySlug}.json`);
}

function readCache(companySlug: string): CachedData | null {
  try {
    const file = cacheFile(companySlug);
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
    }
  } catch (e) {
    console.error(`Cache read error (${companySlug}):`, e);
  }
  return null;
}

function writeCache(companySlug: string, data: CachedData) {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(cacheFile(companySlug), JSON.stringify(data), 'utf-8');
  } catch (e) {
    console.error(`Cache write error (${companySlug}):`, e);
  }
}

export function clearCache() {
  try {
    for (const company of companies) {
      const file = cacheFile(company.slug);
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
    // Also clean up legacy cache file
    const legacy = path.join(CACHE_DIR, 'postbridge-data.json');
    if (fs.existsSync(legacy)) fs.unlinkSync(legacy);
  } catch (e) {
    console.error('Cache clear error:', e);
  }
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

  /** Sync a single company by slug. Returns the cached data for that company. */
  static async syncCompany(companySlug: string): Promise<CachedData | null> {
    const company = companies.find(c => c.slug === companySlug);
    if (!company || !company.postbridgeApiKey) return null;

    // Trigger analytics sync first (best-effort)
    try { await PostBridgeClient.syncAnalytics(company.postbridgeApiKey); } catch {}

    return syncCompanyData(company);
  }

  /** Sync ALL companies that have API keys */
  static async syncAll(): Promise<void> {
    const active = companiesWithKeys();
    // Trigger analytics syncs in parallel (best-effort)
    await Promise.allSettled(
      active.map(c => PostBridgeClient.syncAnalytics(c.postbridgeApiKey))
    );
    // Fetch data for each company in parallel
    await Promise.allSettled(
      active.map(c => syncCompanyData(c))
    );
  }

  /**
   * Get all data — serves from file caches unless fresh=true.
   * Merges data from all companies with API keys.
   */
  static async getAllData(fresh = false) {
    const active = companiesWithKeys();

    if (fresh) {
      await PostBridgeClient.syncAll();
    }

    // Read caches for all active companies
    const datasets: CachedData[] = [];
    for (const company of active) {
      const cached = readCache(company.slug);
      if (cached) {
        datasets.push(cached);
      } else if (fresh) {
        // Already synced above, shouldn't happen, but skip gracefully
      } else {
        // No cache and not fresh — try fetching this company
        try {
          const data = await syncCompanyData(company);
          datasets.push(data);
        } catch (e) {
          console.error(`Failed to fetch data for ${company.slug}:`, e);
        }
      }
    }

    return mergeData(datasets);
  }
}
