import { NextResponse } from 'next/server';
import { initializeDatabase, seedDatabase } from '@/lib/db';
import db from '@/lib/db';

let dbInitialized = false;
function ensureDatabase() {
  if (!dbInitialized) { initializeDatabase(); seedDatabase(); dbInitialized = true; }
}

export async function GET() {
  try {
    ensureDatabase();

    const logs = db.prepare(`
      SELECT aal.*, p.content, a.handle, c.platform, cl.name as client_name
      FROM agent_activity_log aal
      LEFT JOIN posts p ON aal.post_id = p.id
      LEFT JOIN accounts a ON p.account_id = a.id
      LEFT JOIN channels c ON a.channel_id = c.id
      LEFT JOIN clients cl ON c.client_id = cl.id
      ORDER BY aal.created_at DESC LIMIT 100
    `).all();

    const agentStats = db.prepare(`
      SELECT agent_id, COUNT(*) as total_actions,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_actions,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failed_actions,
        MAX(created_at) as last_activity
      FROM agent_activity_log GROUP BY agent_id ORDER BY total_actions DESC
    `).all();

    return NextResponse.json({ logs, agentStats });
  } catch (error) {
    console.error('Error fetching agent logs:', error);
    return NextResponse.json({ error: 'Failed to fetch agent logs' }, { status: 500 });
  }
}
