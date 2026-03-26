import { NextRequest, NextResponse } from 'next/server';
import { insertEvent, supabaseAdmin, WEBHOOK_SECRET } from '@/lib/supabase';

/**
 * POST /api/webhooks/social-intel
 * 
 * Receives events from Social Intel pipeline:
 * - intel.trend — trending hook/format detected
 * - intel.competitor — competitor activity alert
 * - intel.hooks — hook performance data batch
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret');
  if (secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { event, client, timestamp, data } = body;

    if (!event) {
      return NextResponse.json({ error: 'Missing event type' }, { status: 400 });
    }

    // Store as event
    const row = await insertEvent({
      event_type: event,
      client: client || 'all',
      timestamp: timestamp || new Date().toISOString(),
      data,
    });

    // If it's hook data, upsert into hooks table
    if (event === 'intel.hooks' && data?.hooks) {
      for (const hook of data.hooks) {
        await supabaseAdmin.from('hooks').upsert({
          hook_text: hook.text,
          hook_type: hook.type || null,
          client: hook.client || client || null,
          source_url: hook.source_url || null,
          total_views: hook.views || 0,
          total_likes: hook.likes || 0,
          total_shares: hook.shares || 0,
          times_used: hook.times_used || 1,
          avg_views_per_use: hook.avg_views || 0,
          last_used: hook.last_used || new Date().toISOString(),
        }, { onConflict: 'hook_text' }); // dedupe by text — may need smarter matching later
      }
    }

    // If it's competitor data, insert into competitor_activity
    if (event === 'intel.competitor' && data?.competitor) {
      await supabaseAdmin.from('competitor_activity').insert({
        competitor: data.competitor,
        platform: data.platform || 'tiktok',
        post_url: data.post_url || null,
        caption: data.caption || null,
        view_count: data.views || 0,
        like_count: data.likes || 0,
        data: data,
      });
    }

    return NextResponse.json({ ok: true, id: row.id });
  } catch (error: any) {
    console.error('Webhook social-intel error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
