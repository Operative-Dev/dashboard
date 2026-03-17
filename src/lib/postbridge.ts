import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://api.post-bridge.com/v1';
const API_KEY = process.env.POSTBRIDGE_API_KEY;

if (!API_KEY) {
  throw new Error('POSTBRIDGE_API_KEY environment variable is required');
}

// File-based cache — persists across page refreshes, server restarts
const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'postbridge-data.json');

interface CachedData {
  accounts: PostBridgeAccount[];
  posts: PostBridgePost[];
  analytics: PostBridgeAnalytics[];
  postResults: Record<string, PostBridgeResult[]>;
  fetchedAt: string;
}

function readCache(): CachedData | null {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Cache read error:', e);
  }
  return null;
}

function writeCache(data: CachedData) {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data), 'utf-8');
  } catch (e) {
    console.error('Cache write error:', e);
  }
}

export function clearCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) fs.unlinkSync(CACHE_FILE);
  } catch (e) {
    console.error('Cache clear error:', e);
  }
}

async function apiFetch<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`PostBridge API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/** Paginate through all results for an endpoint (max 100 per page) */
async function fetchAll<T>(endpoint: string): Promise<T[]> {
  const all: T[] = [];
  let offset = 0;
  const pageSize = 100;
  
  while (true) {
    const separator = endpoint.includes('?') ? '&' : '?';
    const res: { data: T[]; meta?: { total?: number } } = await apiFetch(
      `${endpoint}${separator}limit=${pageSize}&offset=${offset}`
    );
    all.push(...res.data);
    
    // Stop if we got fewer than page size or hit the total
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

export class PostBridgeClient {
  static async syncAnalytics(): Promise<any> {
    const response = await fetch(`${BASE_URL}/analytics/sync`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: 'tiktok' }),
    });
    return response.json();
  }

  /**
   * Get all data — serves from file cache unless fresh=true.
   * Only hits PostBridge API on fresh=true or first load (no cache).
   */
  static async getAllData(fresh = false) {
    if (!fresh) {
      const cached = readCache();
      if (cached) {
        return {
          accounts: cached.accounts,
          posts: cached.posts,
          analytics: cached.analytics,
          postResults: new Map(Object.entries(cached.postResults)),
          fetchedAt: cached.fetchedAt,
        };
      }
    }

    // Fetch ALL data with pagination
    const [accounts, posts, analytics] = await Promise.all([
      fetchAll<PostBridgeAccount>('/social-accounts'),
      fetchAll<PostBridgePost>('/posts'),
      fetchAll<PostBridgeAnalytics>('/analytics?platform=tiktok&timeframe=all'),
    ]);

    // Fetch post results (batch, with error tolerance)
    const resultsObj: Record<string, PostBridgeResult[]> = {};
    const batchSize = 10;
    for (let i = 0; i < posts.length; i += batchSize) {
      const batch = posts.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(post =>
          apiFetch<{ data: PostBridgeResult[] }>(`/post-results?post_id=${post.id}`)
            .then(r => r.data)
            .catch(() => [] as PostBridgeResult[])
        )
      );
      batch.forEach((post, idx) => {
        resultsObj[post.id.toString()] = results[idx];
      });
    }

    const fetchedAt = new Date().toISOString();

    writeCache({ accounts, posts, analytics, postResults: resultsObj, fetchedAt });

    return {
      accounts,
      posts,
      analytics,
      postResults: new Map(Object.entries(resultsObj)),
      fetchedAt,
    };
  }
}
