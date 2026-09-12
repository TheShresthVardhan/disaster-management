import './Card.css';

export default function Card({
  variant = 'default',
  className = '',
  children,
  header,
  footer,
  hoverable = false,
  bordered = true,
  shadow = 'sm',
  ...props
}) {
  const variantClass = {
    default: 'card-default',
    elevated: 'card-elevated',
    outlined: 'card-outlined',
    filled: 'card-filled',
  }[variant] || 'card-default';

  const shadowClass = `shadow-${shadow}`;
  const hoverClass = hoverable ? 'card-hoverable' : '';
  const borderClass = bordered ? '' : 'card-borderless';

  return (
    <div className={`card ${variantClass} ${shadowClass} ${hoverClass} ${borderClass} ${className}`.trim()} {...props}>
      {header && <div className="card-header">{header}</div>}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
}

export function CardHeader({ className = '', children, action, title, subtitle }) {
  return (
    <div className={`card-header ${className}`.trim()}>
      {title && (
        <div className="card-header-content">
          <h3 className="card-header-title">{title}</h3>
          {subtitle && <p className="card-header-subtitle">{subtitle}</p>}
        </div>
      )}
      {action && <div className="card-header-action">{action}</div>}
      {!title && children}
    </div>
  );
}

export function CardBody({ className = '', children }) {
  return <div className={`card-body ${className}`.trim()}>{children}</div>;
}

export function CardFooter({ className = '', children }) {
  return <div className={`card-footer ${className}`.trim()}>{children}</div>;
}