import { Music, Twitter, Linkedin, Instagram } from 'lucide-react';

interface PlatformBadgeProps {
  platform: string;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

const getPlatformConfig = (platform: string) => {
  const normalized = platform.toLowerCase();
  
  switch (normalized) {
    case 'tiktok':
      return {
        label: 'TikTok',
        icon: Music,
        className: 'platform-tiktok'
      };
    case 'twitter':
    case 'x':
      return {
        label: 'X',
        icon: Twitter,
        className: 'platform-twitter'
      };
    case 'linkedin':
      return {
        label: 'LinkedIn',
        icon: Linkedin,
        className: 'platform-linkedin'
      };
    case 'instagram':
      return {
        label: 'Instagram',
        icon: Instagram,
        className: 'platform-instagram'
      };
    default:
      return {
        label: platform,
        icon: Music,
        className: 'platform-tiktok'
      };
  }
};

export default function PlatformBadge({ 
  platform, 
  size = 'sm', 
  showIcon = true 
}: PlatformBadgeProps) {
  const config = getPlatformConfig(platform);
  const Icon = config.icon;
  const sizeClass = size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs';

  return (
    <span className={`${config.className} ${sizeClass} inline-flex items-center gap-1`}>
      {showIcon && <Icon className="w-3 h-3" />}
      {config.label}
    </span>
  );
}