import { NextResponse } from 'next/server';
import { initializeDatabase, seedDatabase, getPosts } from '@/lib/db';

let dbInitialized = false;
function ensureDatabase() {
  if (!dbInitialized) { initializeDatabase(); seedDatabase(); dbInitialized = true; }
}

export async function GET() {
  try {
    ensureDatabase();
    const allPosts = getPosts(200) as any[];
    
    const failedPosts = allPosts.filter((p: any) => p.status === 'failed');
    const lowEngagementPosts = allPosts.filter((p: any) => 
      p.status === 'posted' && p.engagement_rate !== null && p.engagement_rate < 1.0
    );
    const staleScheduledPosts = allPosts.filter((p: any) => 
      p.status === 'scheduled' && new Date(p.created_at) < new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    return NextResponse.json({ failedPosts, lowEngagementPosts, staleScheduledPosts });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
