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
          className: 'status-posted'
        };
      case 'scheduled':
        return {
          label: 'Scheduled',
          className: 'status-scheduled'
        };
      case 'failed':
        return {
          label: 'Failed',
          className: 'status-failed'
        };
      case 'draft':
        return {
          label: 'Draft',
          className: 'status-scheduled' // Reuse scheduled styling
        };
      default:
        return {
          label: status,
          className: 'status-scheduled'
        };
    }
  };

  const config = getStatusConfig();
  const sizeClass = size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs';

  return (
    <span className={`${config.className} ${sizeClass}`}>
      {config.label}
    </span>
  );
}