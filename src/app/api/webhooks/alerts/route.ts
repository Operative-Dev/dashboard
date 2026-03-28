export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { insertEvent, WEBHOOK_SECRET } from '@/lib/supabase';

/**
 * POST /api/webhooks/alerts
 * 
 * Receives alerts from self-healing system:
 * - alert.batch_miss — batch verification found missing posts
 * - alert.account_down — account appears suspended/banned
 * - alert.rate_limit — hitting API rate limits
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

    const row = await insertEvent({
      event_type: event,
      client: client || 'system',
      account: data?.account,
      account_id: data?.account_id,
      timestamp: timestamp || new Date().toISOString(),
      data,
    });

    return NextResponse.json({ ok: true, id: row.id });
  } catch (error: any) {
    console.error('Webhook alerts error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
