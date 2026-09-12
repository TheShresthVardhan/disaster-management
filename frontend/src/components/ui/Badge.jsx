import './Badge.css';

const variantClasses = {
  default: 'badge-default',
  primary: 'badge-primary',
  secondary: 'badge-secondary',
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  info: 'badge-info',
  light: 'badge-light',
  dark: 'badge-dark',
  severity: 'badge-severity',
};

const sizeClasses = {
  sm: 'badge-sm',
  md: '',
  lg: 'badge-lg',
};

export default function Badge({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  dot = false,
  dotColor,
  ...props
}) {
  const variantClass = variantClasses[variant] || variantClasses.default;
  const sizeClass = sizeClasses[size] || '';
  
  let dotStyle = {};
  if (dot && dotColor) {
    dotStyle = { backgroundColor: dotColor };
  } else if (dot) {
    dotStyle = { backgroundColor: 'currentColor' };
  }

  return (
    <span className={`badge ${variantClass} ${sizeClass} ${className}`.trim()} {...props}>
      {dot && <span className="badge-dot" style={dotStyle} aria-hidden="true"></span>}
      <span className="badge-text">{children}</span>
    </span>
  );
}

export function SeverityBadge({ severity, size = 'md', showLabel = true, ...props }) {
  const severityConfig = {
    critical: { variant: 'danger', label: 'Critical', dotColor: '#dc3545' },
    high: { variant: 'warning', label: 'High', dotColor: '#fd7e14' },
    moderate: { variant: 'info', label: 'Moderate', dotColor: '#0dcaf0' },
    low: { variant: 'success', label: 'Low', dotColor: '#198754' },
    unknown: { variant: 'secondary', label: 'Unknown', dotColor: '#6c757d' },
  };

  const config = severityConfig[severity?.toLowerCase()] || severityConfig.unknown;
  
  return (
    <Badge
      variant={config.variant}
      size={size}
      dot={showLabel}
      dotColor={config.dotColor}
      {...props}
    >
      {showLabel ? config.label : severity}
    </Badge>
  );
}

export function StatusBadge({ status, size = 'md', ...props }) {
  const statusConfig = {
    active: { variant: 'success', label: 'Active' },
    pending: { variant: 'warning', label: 'Pending' },
    resolved: { variant: 'info', label: 'Resolved' },
    closed: { variant: 'secondary', label: 'Closed' },
    draft: { variant: 'light', label: 'Draft' },
  };

  const config = statusConfig[status?.toLowerCase()] || statusConfig.draft;
  
  return <Badge variant={config.variant} size={size} {...props}>{config.label}</Badge>;
}