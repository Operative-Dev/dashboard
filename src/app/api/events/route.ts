export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getRecentEvents } from '@/lib/supabase';

/**
 * GET /api/events?client=woz&type=post.published&limit=50
 * 
 * Returns recent events from Supabase for the dashboard event feed.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const client = searchParams.get('client') || undefined;
    const event_type = searchParams.get('type') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');

    const events = await getRecentEvents({ client, event_type, limit });

    return NextResponse.json({ events });
  } catch (error: any) {
    console.error('Events fetch error:', error);
    return NextResponse.json({ events: [], error: error.message }, { status: 500 });
  }
}
