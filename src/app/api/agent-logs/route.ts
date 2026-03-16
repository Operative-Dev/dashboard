import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Mock data for agent logs - real agent log data not available yet
    const mockLogs = [
      {
        id: 'log-1',
        agent_id: 'Producer',
        post_id: 'post-1',
        action: 'content_generated',
        status: 'success',
        log: 'Successfully generated content for TikTok post',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        content: 'Building the future with AI! 🚀 Check out our latest app builder features',
        handle: '@withwozz',
        platform: 'tiktok',
        client_name: 'Woz'
      },
      {
        id: 'log-2',
        agent_id: 'Scripter',
        post_id: 'post-2',
        action: 'media_processed',
        status: 'success',
        log: 'Video optimized for TikTok format',
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        content: '5 coding tips that will change your development workflow forever',
        handle: '@woz_app',
        platform: 'tiktok',
        client_name: 'Woz'
      },
      {
        id: 'log-3',
        agent_id: 'Producer',
        post_id: 'post-3',
        action: 'publishing_failed',
        status: 'error',
        log: 'API rate limit exceeded, will retry in 30 minutes',
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        content: 'Behind the scenes: How we\'re revolutionizing app development',
        handle: '@lizzycodez6',
        platform: 'tiktok',
        client_name: 'Woz'
      },
      {
        id: 'log-4',
        agent_id: 'Hopper',
        post_id: 'post-4',
        action: 'metrics_collected',
        status: 'success',
        log: 'Collected performance metrics for published post',
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        content: 'The AI revolution is here and it\'s changing everything',
        handle: '@shanerzfi5m',
        platform: 'tiktok',
        client_name: 'Woz'
      }
    ];

    const mockAgentStats = [
      {
        agent_id: 'Producer',
        total_actions: 45,
        successful_actions: 42,
        failed_actions: 3,
        last_activity: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      {
        agent_id: 'Scripter',
        total_actions: 38,
        successful_actions: 36,
        failed_actions: 2,
        last_activity: new Date(Date.now() - 45 * 60 * 1000).toISOString()
      },
      {
        agent_id: 'Hopper',
        total_actions: 52,
        successful_actions: 49,
        failed_actions: 3,
        last_activity: new Date(Date.now() - 15 * 60 * 1000).toISOString()
      }
    ];

    return NextResponse.json({ 
      logs: mockLogs, 
      agentStats: mockAgentStats,
      notice: 'Mock data - real agent logs coming soon'
    });
  } catch (error) {
    console.error('Error fetching agent logs:', error);
    return NextResponse.json({ error: 'Failed to fetch agent logs' }, { status: 500 });
  }
}