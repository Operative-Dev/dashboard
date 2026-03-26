import { NextRequest, NextResponse } from 'next/server';
import { insertEvent, supabaseAdmin, WEBHOOK_SECRET } from '@/lib/supabase';

/**
 * POST /api/webhooks/analytics
 * 
 * Receives events from daily-recap.py and analytics pipeline:
 * - analytics.daily — daily recap data
 * - analytics.breakout — single post hit view threshold
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret');
  if (secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { event, client, timestamp, data } = body;

    if (!event || !client) {
      return NextResponse.json({ error: 'Missing event or client' }, { status: 400 });
    }

    // Store as event
    const row = await insertEvent({
      event_type: event,
      client,
      account: data?.account,
      account_id: data?.account_id,
      timestamp: timestamp || new Date().toISOString(),
      data,
    });

    // If it's a daily analytics payload, also upsert into daily_analytics table
    if (event === 'analytics.daily' && data?.accounts) {
      for (const acc of data.accounts) {
        await supabaseAdmin.from('daily_analytics').upsert({
          date: data.date || new Date().toISOString().split('T')[0],
          client,
          account: acc.account,
          account_id: acc.account_id,
          posts_count: acc.posts_count || 0,
          total_views: acc.total_views || 0,
          total_likes: acc.total_likes || 0,
          total_comments: acc.total_comments || 0,
          total_shares: acc.total_shares || 0,
          avg_views: acc.avg_views || 0,
          top_post_url: acc.top_post_url || null,
          top_post_views: acc.top_post_views || 0,
        }, { onConflict: 'date,account_id' });
      }
    }

    return NextResponse.json({ ok: true, id: row.id });
  } catch (error: any) {
    console.error('Webhook analytics error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
