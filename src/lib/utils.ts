import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'posted':
      return 'text-emerald-400 bg-emerald-400/10'
    case 'scheduled':
      return 'text-amber-400 bg-amber-400/10'
    case 'failed':
      return 'text-red-400 bg-red-400/10'
    default:
      return 'text-gray-400 bg-gray-400/10'
  }
}

export function getPlatformColor(platform: string): string {
  switch (platform) {
    case 'tiktok':
      return 'text-pink-400 bg-pink-400/10'
    case 'twitter':
      return 'text-blue-400 bg-blue-400/10'
    case 'linkedin':
      return 'text-cyan-400 bg-cyan-400/10'
    case 'instagram':
      return 'text-purple-400 bg-purple-400/10'
    default:
      return 'text-gray-400 bg-gray-400/10'
  }
}