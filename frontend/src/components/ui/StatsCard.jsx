import './StatsCard.css';

export default function StatsCard({
  value,
  label,
  trend,
  trendDirection,
  icon,
  iconBg,
  className = '',
  variant = 'default',
}) {
  const trendClass = trendDirection === 'up' ? 'stats-trend-up' : 
                     trendDirection === 'down' ? 'stats-trend-down' : 'stats-trend-neutral';

  return (
    <div className={`stats-card ${variant} ${className}`.trim()}>
      <div className="stats-card-header">
        <div className="stats-card-icon-wrapper">
          {icon && <span className="stats-card-icon" style={{ backgroundColor: iconBg }} aria-hidden="true">{icon}</span>}
        </div>
        {trend && (
          <span className={`stats-trend ${trendClass}`}>
            <span className="stats-trend-icon" aria-hidden="true">
              {trendDirection === 'up' ? '▲' : trendDirection === 'down' ? '▼' : '●'}
            </span>
            <span className="stats-trend-value">{trend}</span>
          </span>
        )}
      </div>
      <div className="stats-card-body">
        <div className="stats-card-value">{value}</div>
        <div className="stats-card-label">{label}</div>
      </div>
    </div>
  );
}

export function StatsGrid({ cards, className = '', columns = 4 }) {
  return (
    <div className={`stats-grid ${className}`.trim()} style={{ '--stats-columns': columns }}>
      {cards.map((card, index) => (
        <StatsCard key={index} {...card} />
      ))}
    </div>
  );
}