import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  subtitle?: string;
  className?: string;
}

export default function MetricCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  subtitle,
  className = ''
}: MetricCardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-emerald-500';
      case 'negative':
        return 'text-red-500';
      default:
        return 'text-zinc-500';
    }
  };

  return (
    <div className={`bg-zinc-900 border border-zinc-800 p-6 rounded-md ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wider text-zinc-500 font-mono mb-2">
            {title}
          </p>
          <p className="text-3xl font-mono font-semibold text-zinc-50">
            {value}
          </p>
          {(change || subtitle) && (
            <div className="mt-2">
              {change && (
                <span className={`text-sm font-medium font-mono ${getChangeColor()}`}>
                  {change}
                </span>
              )}
              {subtitle && (
                <p className="text-sm text-zinc-400 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>
        <div className="ml-4">
          <Icon className="w-5 h-5 text-zinc-600" />
        </div>
      </div>
    </div>
  );
}