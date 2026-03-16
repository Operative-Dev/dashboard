'use client'

import { Activity, User, CheckCircle, XCircle, Clock, Zap } from 'lucide-react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import db from '@/lib/db'

export default function AgentLogsPage() {
  // Get all agent logs
  const logs = db.prepare(`
    SELECT 
      aal.*,
      p.content,
      a.handle,
      c.platform,
      cl.name as client_name
    FROM agent_activity_log aal
    LEFT JOIN posts p ON aal.post_id = p.id
    LEFT JOIN accounts a ON p.account_id = a.id
    LEFT JOIN channels c ON a.channel_id = c.id
    LEFT JOIN clients cl ON c.client_id = cl.id
    ORDER BY aal.created_at DESC
    LIMIT 100
  `).all()

  // Get agent stats
  const agentStats = db.prepare(`
    SELECT 
      agent_id,
      COUNT(*) as total_actions,
      SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_actions,
      SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failed_actions,
      MAX(created_at) as last_activity
    FROM agent_activity_log
    GROUP BY agent_id
    ORDER BY total_actions DESC
  `).all()

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-amber-500" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'content_generated':
        return 'text-blue-400 bg-zinc-900 border-blue-500/20'
      case 'media_processed':
        return 'text-amber-400 bg-zinc-900 border-amber-500/20'
      case 'scheduled':
        return 'text-amber-400 bg-zinc-900 border-amber-500/20'
      case 'published':
        return 'text-emerald-400 bg-zinc-900 border-emerald-500/20'
      case 'metrics_collected':
        return 'text-blue-400 bg-zinc-900 border-blue-500/20'
      case 'publishing_failed':
        return 'text-red-400 bg-zinc-900 border-red-500/20'
      default:
        return 'text-zinc-400 bg-zinc-900 border-zinc-500/20'
    }
  }

  return (
    <DashboardLayout title="Agent Logs">
      <div className="p-8 space-y-8">
        {/* Agent Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {agentStats.map((agent: any) => {
            const successRate = ((agent.successful_actions / agent.total_actions) * 100).toFixed(1)
            
            return (
              <div
                key={agent.agent_id}
                className="bg-zinc-900 border border-zinc-800 p-6 rounded-md"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-zinc-800 border border-zinc-700 rounded-md flex items-center justify-center">
                      <User className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                      <h3 className="text-zinc-50 font-semibold font-mono">{agent.agent_id}</h3>
                      <p className="text-xs text-zinc-400 font-mono">
                        Last active {formatDateTime(agent.last_activity)}
                      </p>
                    </div>
                  </div>
                  <div className="status-dot active"></div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold font-mono text-zinc-50">
                      {agent.total_actions}
                    </div>
                    <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider">
                      Total
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold font-mono text-emerald-500">
                      {agent.successful_actions}
                    </div>
                    <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider">
                      Success
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold font-mono text-zinc-50">
                      {successRate}%
                    </div>
                    <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider">
                      Rate
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-400 font-mono">
                      {agent.successful_actions} successful
                    </span>
                    <span className="text-red-400 font-mono">
                      {agent.failed_actions} failed
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Activity Log */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-md overflow-hidden">
          <div className="p-6 border-b border-zinc-800">
            <h3 className="text-lg font-semibold text-zinc-50 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
              Recent Activity
            </h3>
          </div>

          <div className="max-h-[600px] overflow-y-auto">
            <div className="p-6 space-y-4">
              {logs.map((log: any) => (
                <div
                  key={log.id}
                  className="flex items-start space-x-4 p-4 border border-zinc-800 rounded hover:bg-zinc-800/50 transition-colors cursor-pointer"
                >
                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(log.status)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-mono border ${getActionColor(log.action)}`}>
                        {log.action.replace('_', ' ')}
                      </span>
                      <div className="flex items-center space-x-2 text-xs text-zinc-400">
                        <User className="w-3 h-3" />
                        <span className="font-mono">{log.agent_id}</span>
                      </div>
                      <span className="text-xs text-zinc-500 font-mono">
                        {formatDateTime(log.created_at)}
                      </span>
                    </div>

                    <p className="text-sm text-zinc-300 mb-2">
                      {log.log}
                    </p>

                    {log.content && (
                      <div className="flex items-center space-x-4 text-xs">
                        <span className="text-zinc-400">
                          Post: {log.content.substring(0, 50)}...
                        </span>
                        {log.handle && (
                          <span className="text-zinc-400 font-mono">
                            {log.handle} • {log.platform}
                          </span>
                        )}
                        {log.client_name && (
                          <span className="text-zinc-500">
                            {log.client_name}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action indicator */}
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded border flex items-center justify-center ${
                      log.status === 'success' ? 'bg-zinc-900 border-emerald-500/20' : 
                      log.status === 'error' ? 'bg-zinc-900 border-red-500/20' : 'bg-zinc-900 border-amber-500/20'
                    }`}>
                      <Zap className="w-4 h-4 text-zinc-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}