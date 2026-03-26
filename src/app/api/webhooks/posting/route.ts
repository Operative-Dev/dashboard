import { NextRequest, NextResponse } from 'next/server';
import { insertEvent, WEBHOOK_SECRET } from '@/lib/supabase';

/**
 * POST /api/webhooks/posting
 * 
 * Receives events from the posting pipeline:
 * - post.published — a video was posted successfully
 * - post.failed — posting failed
 * - batch.complete — full batch finished
 * - batch.incomplete — batch finished with gaps
 */
export async function POST(req: NextRequest) {
  // Auth check
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

    const row = await insertEvent({
      event_type: event,
      client,
      account: data?.account,
      account_id: data?.account_id,
      timestamp: timestamp || new Date().toISOString(),
      data,
    });

    return NextResponse.json({ ok: true, id: row.id });
  } catch (error: any) {
    console.error('Webhook posting error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
