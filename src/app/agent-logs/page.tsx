'use client'

import { useState, useEffect } from 'react'
import { Activity, User, CheckCircle, XCircle, Clock, Zap } from 'lucide-react'
import DashboardLayout from '@/components/layout/dashboard-layout'

export default function AgentLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [agentStats, setAgentStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/agent-logs')
      .then(r => r.json())
      .then(data => { setLogs(data.logs || []); setAgentStats(data.agentStats || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  const getStatusIcon = (status: string) => {
    if (status === 'success') return <CheckCircle className="w-4 h-4 text-emerald-500" />
    if (status === 'error') return <XCircle className="w-4 h-4 text-red-500" />
    return <Clock className="w-4 h-4 text-amber-500" />
  }

  const getActionColor = (action: string) => {
    const map: Record<string, string> = {
      content_generated: 'text-blue-400 bg-zinc-900 border-blue-500/20',
      media_processed: 'text-amber-400 bg-zinc-900 border-amber-500/20',
      scheduled: 'text-amber-400 bg-zinc-900 border-amber-500/20',
      published: 'text-emerald-400 bg-zinc-900 border-emerald-500/20',
      metrics_collected: 'text-blue-400 bg-zinc-900 border-blue-500/20',
      publishing_failed: 'text-red-400 bg-zinc-900 border-red-500/20',
    }
    return map[action] || 'text-zinc-400 bg-zinc-900 border-zinc-500/20'
  }

  if (loading) {
    return <DashboardLayout title="Agent Logs"><div className="p-8"><div className="text-zinc-500 font-mono text-sm">Loading...</div></div></DashboardLayout>
  }

  return (
    <DashboardLayout title="Agent Logs">
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {agentStats.map((agent: any) => {
            const successRate = ((agent.successful_actions / agent.total_actions) * 100).toFixed(1)
            return (
              <div key={agent.agent_id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-zinc-800 border border-zinc-700 rounded-md flex items-center justify-center">
                      <User className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                      <h3 className="text-zinc-50 font-semibold font-mono">{agent.agent_id}</h3>
                      <p className="text-xs text-zinc-400 font-mono">Last active {formatDateTime(agent.last_activity)}</p>
                    </div>
                  </div>
                  <div className="status-dot active"></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold font-mono text-zinc-50">{agent.total_actions}</div>
                    <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold font-mono text-emerald-500">{agent.successful_actions}</div>
                    <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Success</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold font-mono text-zinc-50">{successRate}%</div>
                    <div className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Rate</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-md overflow-hidden">
          <div className="p-6 border-b border-zinc-800">
            <h3 className="text-lg font-semibold text-zinc-50 mb-1" style={{ fontFamily: 'var(--font-display)' }}>Recent Activity</h3>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            <div className="p-6 space-y-4">
              {logs.map((log: any) => (
                <div key={log.id} className="flex items-start space-x-4 p-4 border border-zinc-800 rounded hover:bg-zinc-800/50 transition-colors cursor-pointer">
                  <div className="flex-shrink-0 mt-1">{getStatusIcon(log.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-mono border ${getActionColor(log.action)}`}>{log.action.replace('_', ' ')}</span>
                      <div className="flex items-center space-x-2 text-xs text-zinc-400">
                        <User className="w-3 h-3" />
                        <span className="font-mono">{log.agent_id}</span>
                      </div>
                      <span className="text-xs text-zinc-500 font-mono">{formatDateTime(log.created_at)}</span>
                    </div>
                    <p className="text-sm text-zinc-300 mb-2">{log.log}</p>
                    {log.content && (
                      <div className="flex items-center space-x-4 text-xs">
                        <span className="text-zinc-400">Post: {log.content.substring(0, 50)}...</span>
                        {log.handle && <span className="text-zinc-400 font-mono">{log.handle} • {log.platform}</span>}
                        {log.client_name && <span className="text-zinc-500">{log.client_name}</span>}
                      </div>
                    )}
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
