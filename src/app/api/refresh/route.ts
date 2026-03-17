import { NextResponse } from 'next/server';
import { PostBridgeClient } from '@/lib/postbridge';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companySlug = searchParams.get('company');

    if (companySlug) {
      // Sync a single company
      const result = await PostBridgeClient.syncCompany(companySlug);
      if (!result) {
        return NextResponse.json({ error: `Company '${companySlug}' not found or has no API key` }, { status: 404 });
      }
    } else {
      // Sync all companies
      await PostBridgeClient.syncAll();
    }

    return NextResponse.json({ success: true, refreshedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Error refreshing:', error);
    return NextResponse.json({ error: 'Failed to refresh' }, { status: 500 });
  }
}
