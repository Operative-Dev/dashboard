import { NextResponse } from 'next/server';
import { PostBridgeClient } from '@/lib/postbridge';

export async function POST() {
  try {
    // Trigger analytics sync on PostBridge first
    try {
      await PostBridgeClient.syncAnalytics();
    } catch (e) {
      // sync is best-effort
    }

    // Force fresh fetch and persist to cache
    await PostBridgeClient.getAllData(true);

    return NextResponse.json({ success: true, refreshedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Error refreshing:', error);
    return NextResponse.json({ error: 'Failed to refresh' }, { status: 500 });
  }
}
