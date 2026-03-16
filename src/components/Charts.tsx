'use client'

import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import { motion } from 'framer-motion'
import { formatNumber } from '@/lib/utils'

interface ChartData {
  date: string
  count?: number
  impressions?: number
  engagement?: number
}

interface ChartProps {
  data: ChartData[]
  title: string
  subtitle?: string
  delay?: number
}

// Custom tooltip component
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 rounded-lg border border-white/20">
        <p className="text-xs text-gray-400 font-mono mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
            {entry.name}: {formatNumber(entry.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function PostsOverTimeChart({ data, title, subtitle, delay = 0 }: ChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="chart-container"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold font-display text-white">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-400 font-mono mt-1">{subtitle}</p>
        )}
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="postGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#a1a1aa' }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#a1a1aa' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="count" 
              stroke="#7c3aed" 
              fillOpacity={1} 
              fill="url(#postGradient)"
              strokeWidth={2}
              name="Posts"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}

export function ImpressionsChart({ data, title, subtitle, delay = 0 }: ChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="chart-container"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold font-display text-white">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-400 font-mono mt-1">{subtitle}</p>
        )}
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#a1a1aa' }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#a1a1aa' }}
              tickFormatter={(value) => formatNumber(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="impressions" 
              stroke="#06b6d4" 
              strokeWidth={3}
              dot={{ r: 4, fill: '#06b6d4', strokeWidth: 2, stroke: '#0a0a0a' }}
              activeDot={{ r: 6, fill: '#06b6d4', strokeWidth: 2, stroke: '#0a0a0a' }}
              name="Impressions"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}

export function EngagementChart({ data, title, subtitle, delay = 0 }: ChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="chart-container"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold font-display text-white">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-400 font-mono mt-1">{subtitle}</p>
        )}
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#a1a1aa' }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#a1a1aa' }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="engagement" 
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              name="Engagement Rate"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}

// Skeleton loading state for charts
export function ChartSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="chart-container"
    >
      <div className="mb-6">
        <div className="w-40 h-6 skeleton rounded mb-2" />
        <div className="w-32 h-4 skeleton rounded" />
      </div>
      
      <div className="h-64 skeleton rounded-lg" />
    </motion.div>
  )
}