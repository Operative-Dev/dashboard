import { NextResponse } from 'next/server';
import { clearCache, PostBridgeClient } from '@/lib/postbridge';

export async function POST() {
  try {
    // Clear all cached data
    clearCache();
    
    // Trigger analytics sync on PostBridge
    try {
      await PostBridgeClient.syncAnalytics();
    } catch (e) {
      // sync is best-effort
    }

    return NextResponse.json({ success: true, refreshedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Error refreshing:', error);
    return NextResponse.json({ error: 'Failed to refresh' }, { status: 500 });
  }
}
