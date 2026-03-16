interface StatusBadgeProps {
  status: 'posted' | 'scheduled' | 'failed' | 'draft';
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'posted':
        return {
          label: 'Posted',
          dotColor: 'bg-emerald-500',
          textColor: 'text-emerald-400'
        };
      case 'scheduled':
        return {
          label: 'Scheduled',
          dotColor: 'bg-amber-500',
          textColor: 'text-amber-400'
        };
      case 'failed':
        return {
          label: 'Failed',
          dotColor: 'bg-red-500',
          textColor: 'text-red-400'
        };
      case 'draft':
        return {
          label: 'Draft',
          dotColor: 'bg-blue-500',
          textColor: 'text-blue-400'
        };
      default:
        return {
          label: status,
          dotColor: 'bg-zinc-500',
          textColor: 'text-zinc-400'
        };
    }
  };

  const config = getStatusConfig();
  const sizeClass = size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs';

  return (
    <span className={`inline-flex items-center ${sizeClass} bg-zinc-900 border border-zinc-800 rounded font-mono`}>
      <span className={`w-2 h-2 ${config.dotColor} rounded-full mr-2`}></span>
      <span className={config.textColor}>{config.label}</span>
    </span>
  );
}