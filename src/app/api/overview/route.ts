import { NextResponse } from 'next/server';
import { initializeDatabase, seedDatabase, getOverviewStats, getPostsOverTime, getImpressionsOverTime } from '@/lib/db';

// Initialize database on first API call
let dbInitialized = false;
function ensureDatabase() {
  if (!dbInitialized) {
    initializeDatabase();
    seedDatabase();
    dbInitialized = true;
  }
}

export async function GET() {
  try {
    ensureDatabase();
    
    const stats = getOverviewStats();
    const postsOverTime = getPostsOverTime(7); // Last 7 days
    const impressionsOverTime = getImpressionsOverTime(7);
    
    // Calculate success rate
    const totalPosts = (stats.postsThisWeek as any)?.count || 0;
    const failedPosts = (stats.failedPosts as any)?.count || 0;
    const successRate = totalPosts > 0 ? ((totalPosts - failedPosts) / totalPosts) * 100 : 0;
    
    return NextResponse.json({
      stats: {
        postsToday: (stats.postsToday as any)?.count || 0,
        postsThisWeek: totalPosts,
        totalImpressions: (stats.totalImpressions as any)?.total || 0,
        avgEngagementRate: Math.round(((stats.avgEngagementRate as any)?.avg || 0) * 100) / 100,
        activeClients: (stats.activeClients as any)?.count || 0,
        successRate: Math.round(successRate * 100) / 100,
        lowEngagementPosts: (stats.lowEngagementPosts as any)?.count || 0
      },
      charts: {
        postsOverTime: postsOverTime.map((item: any) => ({
          date: item.date,
          count: item.count
        })),
        impressionsOverTime: impressionsOverTime.map((item: any) => ({
          date: item.date,
          impressions: item.impressions || 0
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching overview data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overview data' },
      { status: 500 }
    );
  }
}