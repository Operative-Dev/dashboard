'use client'

import { Activity, User, CheckCircle, XCircle, Clock, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatDateTime } from '@/lib/utils'
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />
      default:
        return <Clock className="w-4 h-4 text-amber-400" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'content_generated':
        return 'text-blue-400 bg-blue-400/10'
      case 'media_processed':
        return 'text-purple-400 bg-purple-400/10'
      case 'scheduled':
        return 'text-amber-400 bg-amber-400/10'
      case 'published':
        return 'text-emerald-400 bg-emerald-400/10'
      case 'metrics_collected':
        return 'text-cyan-400 bg-cyan-400/10'
      case 'publishing_failed':
        return 'text-red-400 bg-red-400/10'
      default:
        return 'text-gray-400 bg-gray-400/10'
    }
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-gradient mb-2">
          Agent Logs
        </h1>
        <p className="text-gray-400 font-mono">
          Real-time activity from all autonomous agents
        </p>
      </div>

      {/* Agent Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {agentStats.map((agent: any, index) => {
          const successRate = ((agent.successful_actions / agent.total_actions) * 100).toFixed(1)
          
          return (
            <motion.div
              key={agent.agent_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className="glass-card p-6 rounded-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold font-display">{agent.agent_id}</h3>
                    <p className="text-xs text-gray-400 font-mono">
                      Last active {formatDateTime(agent.last_activity)}
                    </p>
                  </div>
                </div>
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold font-display text-white">
                    {agent.total_actions}
                  </div>
                  <div className="text-xs text-gray-400 font-mono">
                    Total Actions
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold font-display text-emerald-400">
                    {agent.successful_actions}
                  </div>
                  <div className="text-xs text-gray-400 font-mono">
                    Success
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold font-display text-white">
                    {successRate}%
                  </div>
                  <div className="text-xs text-gray-400 font-mono">
                    Success Rate
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-mono">
                    {agent.successful_actions} successful
                  </span>
                  <span className="text-red-400 font-mono">
                    {agent.failed_actions} failed
                  </span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Activity Log */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="glass-card rounded-xl overflow-hidden"
      >
        <div className="p-6 border-b border-white/10">
          <h3 className="text-lg font-semibold font-display text-white mb-1">Recent Activity</h3>
          <p className="text-sm text-gray-400 font-mono">Live agent actions and status updates</p>
        </div>

        <div className="max-h-[600px] overflow-y-auto">
          <div className="p-6 space-y-4">
            {logs.map((log: any, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="flex items-start space-x-4 p-4 glass rounded-lg hover:bg-white/5 transition-colors duration-200"
              >
                {/* Status Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(log.status)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                      {log.action.replace('_', ' ')}
                    </span>
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <User className="w-3 h-3" />
                      <span className="font-mono">{log.agent_id}</span>
                    </div>
                    <span className="text-xs text-gray-500 font-mono">
                      {formatDateTime(log.created_at)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-300 mb-2">
                    {log.log}
                  </p>

                  {log.content && (
                    <div className="flex items-center space-x-4 text-xs">
                      <span className="text-gray-400">
                        Post: {log.content.substring(0, 50)}...
                      </span>
                      {log.handle && (
                        <span className="text-purple-400 font-mono">
                          {log.handle} • {log.platform}
                        </span>
                      )}
                      {log.client_name && (
                        <span className="text-gray-500">
                          {log.client_name}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Action indicator */}
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    log.status === 'success' ? 'bg-emerald-500/20' : 
                    log.status === 'error' ? 'bg-red-500/20' : 'bg-amber-500/20'
                  }`}>
                    <Zap className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}