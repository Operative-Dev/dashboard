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
        return 'text-emerald-400';
      case 'negative':
        return 'text-red-400';
      default:
        return 'text-dashboard-text-muted';
    }
  };

  return (
    <div className={`metric-card ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-dashboard-text-muted text-sm font-medium mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-dashboard-text-primary font-mono">
            {value}
          </p>
          {(change || subtitle) && (
            <div className="mt-2">
              {change && (
                <span className={`text-sm font-medium ${getChangeColor()}`}>
                  {change}
                </span>
              )}
              {subtitle && (
                <p className="text-xs text-dashboard-text-muted">
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>
        <div className="bg-white/5 p-2 rounded-lg">
          <Icon className="w-5 h-5 text-dashboard-text-secondary" />
        </div>
      </div>
    </div>
  );
}