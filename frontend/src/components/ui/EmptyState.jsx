import './EmptyState.css';

export default function EmptyState({
  icon,
  title,
  description,
  action,
  actionLabel,
  className = '',
  size = 'md',
}) {
  const sizeClass = size === 'sm' ? 'empty-state-sm' : size === 'lg' ? 'empty-state-lg' : '';

  return (
    <div className={`empty-state ${sizeClass} ${className}`.trim()} role="status" aria-live="polite">
      {icon && <div className="empty-state-icon" aria-hidden="true">{icon}</div>}
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {action && actionLabel && (
        <div className="empty-state-action">
          {action}
        </div>
      )}
    </div>
  );
}

export function PlaceholderCard({
  title,
  description,
  icon,
  features = [],
  className = '',
}) {
  return (
    <div className={`placeholder-card ${className}`.trim()}>
      <div className="placeholder-card-content">
        {icon && <div className="placeholder-card-icon" aria-hidden="true">{icon}</div>}
        <h4 className="placeholder-card-title">{title}</h4>
        <p className="placeholder-card-description">{description}</p>
        {features.length > 0 && (
          <ul className="placeholder-card-features">
            {features.map((feature, index) => (
              <li key={index} className="placeholder-card-feature">
                <span className="placeholder-card-feature-icon" aria-hidden="true">✓</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function ComingSoon({
  feature,
  description,
  estimatedPhase = 'Phase 3',
  className = '',
}) {
  return (
    <div className={`coming-soon ${className}`.trim()}>
      <div className="coming-soon-badge">Coming Soon</div>
      <h4 className="coming-soon-title">{feature}</h4>
      <p className="coming-soon-description">{description}</p>
      <div className="coming-soon-phase">
        <span className="coming-soon-phase-label">Estimated:</span>
        <span className="coming-soon-phase-value">{estimatedPhase}</span>
      </div>
    </div>
  );
}