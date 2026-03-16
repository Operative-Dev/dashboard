import { Music, Twitter, Linkedin, Instagram } from 'lucide-react';

interface PlatformBadgeProps {
  platform: string;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  showLabel?: boolean;
}

const getPlatformConfig = (platform: string) => {
  const normalized = platform.toLowerCase();
  
  switch (normalized) {
    case 'tiktok':
      return {
        label: 'TK',
        icon: Music,
        color: 'text-zinc-400'
      };
    case 'twitter':
    case 'x':
      return {
        label: 'X',
        icon: Twitter,
        color: 'text-zinc-400'
      };
    case 'linkedin':
      return {
        label: 'LI',
        icon: Linkedin,
        color: 'text-zinc-400'
      };
    case 'instagram':
      return {
        label: 'IG',
        icon: Instagram,
        color: 'text-zinc-400'
      };
    default:
      return {
        label: platform.substring(0, 2).toUpperCase(),
        icon: Music,
        color: 'text-zinc-400'
      };
  }
};

export default function PlatformBadge({ 
  platform, 
  size = 'sm', 
  showIcon = true,
  showLabel = false
}: PlatformBadgeProps) {
  const config = getPlatformConfig(platform);
  const Icon = config.icon;
  const iconSize = size === 'md' ? 'w-4 h-4' : 'w-3 h-3';

  return (
    <span className={`inline-flex items-center gap-1 ${config.color}`}>
      {showIcon && <Icon className={iconSize} />}
      {showLabel && (
        <span className="text-xs font-mono">{config.label}</span>
      )}
    </span>
  );
}