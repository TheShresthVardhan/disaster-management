import './Button.css';

const variantClasses = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  outline: 'btn-outline-primary',
  outlineSecondary: 'btn-outline-secondary',
  danger: 'btn-danger',
  outlineDanger: 'btn-outline-danger',
  ghost: 'btn-ghost',
  link: 'btn-link',
};

const sizeClasses = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
  xl: 'btn-xl',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  disabled,
  loading,
  leftIcon,
  rightIcon,
  fullWidth = false,
  ...props
}) {
  const variantClass = variantClasses[variant] || variantClasses.primary;
  const sizeClass = sizeClasses[size] || '';
  const widthClass = fullWidth ? 'w-100' : '';

  return (
    <button
      className={`btn ${variantClass} ${sizeClass} ${widthClass} ${className}`.trim()}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="btn-spinner" aria-hidden="true"></span>}
      {!loading && leftIcon && <span className="btn-icon me-2" aria-hidden="true">{leftIcon}</span>}
      <span className="btn-text">{children}</span>
      {!loading && rightIcon && <span className="btn-icon ms-2" aria-hidden="true">{rightIcon}</span>}
    </button>
  );
}