'use client'

import { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatNumber } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: LucideIcon
  delay?: number
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon: Icon,
  delay = 0,
  subtitle,
  trend = 'neutral'
}: MetricCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      return formatNumber(val)
    }
    return val
  }

  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-emerald-400'
      case 'negative':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const getTrendIcon = () => {
    if (trend === 'up') return '↗'
    if (trend === 'down') return '↘'
    return '→'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="metric-card group"
    >
      {/* Icon */}
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 flex items-center justify-center">
          <Icon className="w-5 h-5 text-purple-400" />
        </div>
        {change && (
          <span className={`text-xs font-mono ${getChangeColor()} flex items-center space-x-1`}>
            <span>{getTrendIcon()}</span>
            <span>{change}</span>
          </span>
        )}
      </div>

      {/* Value */}
      <div className="mb-2">
        <div className="text-2xl font-bold font-display text-white mb-1">
          {formatValue(value)}
        </div>
        <div className="text-sm text-gray-400 font-medium">
          {title}
        </div>
        {subtitle && (
          <div className="text-xs text-gray-500 font-mono mt-1">
            {subtitle}
          </div>
        )}
      </div>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />
    </motion.div>
  )
}

// Skeleton loading state
export function MetricCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="glass-card p-6 rounded-xl"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-lg skeleton" />
        <div className="w-12 h-4 skeleton rounded" />
      </div>
      
      <div className="mb-2">
        <div className="w-20 h-8 skeleton rounded mb-1" />
        <div className="w-32 h-4 skeleton rounded" />
      </div>
    </motion.div>
  )
}