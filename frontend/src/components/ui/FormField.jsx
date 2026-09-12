import { useId } from 'react';
import './FormField.css';

export default function FormField({
  label,
  htmlFor,
  required = false,
  children,
  error,
  hint,
  className = '',
  labelClassName = '',
  inputClassName = '',
}) {
  const generatedId = useId();
  const id = htmlFor || generatedId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={`form-field ${className}`.trim()}>
      {label && (
        <label htmlFor={id} className={`form-field-label ${labelClassName}`.trim()}>
          {label}
          {required && <span className="form-field-required" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="form-field-input-wrapper">
        {React.Children.map(children, (child) =>
          React.isValidElement(child) ? React.cloneElement(child, {
            id,
            'aria-describedby': [hintId, errorId].filter(Boolean).join(' ') || undefined,
            'aria-invalid': error ? 'true' : undefined,
            className: `${child.props.className || ''} ${inputClassName}`.trim(),
          }) : child
        )}
      </div>
      {hint && !error && (
        <div id={hintId} className="form-field-hint">{hint}</div>
      )}
      {error && (
        <div id={errorId} className="form-field-error" role="alert">
          <span className="form-field-error-icon" aria-hidden="true">⚠</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export function FormSection({ title, subtitle, children, className = '' }) {
  return (
    <fieldset className={`form-section ${className}`.trim()}>
      {(title || subtitle) && (
        <div className="form-section-header">
          {title && <legend className="form-section-title">{title}</legend>}
          {subtitle && <p className="form-section-subtitle">{subtitle}</p>}
        </div>
      )}
      <div className="form-section-body">{children}</div>
    </fieldset>
  );
}

export function StepIndicator({ steps, currentStep, className = '' }) {
  return (
    <div className={`step-indicator ${className}`.trim()} role="navigation" aria-label="Form progress">
      <ol className="step-list">
        {steps.map((step, index) => (
          <li key={step.id || index} className="step-item">
            <div className="step-marker">
              <span className="step-number" aria-hidden="true">{index + 1}</span>
              {index < currentStep && <span className="step-check" aria-hidden="true">✓</span>}
            </div>
            <div className="step-content">
              <span className="step-label">{step.label}</span>
              {step.description && <span className="step-description">{step.description}</span>}
            </div>
            {index < steps.length - 1 && <span className="step-connector" aria-hidden="true"></span>}
          </li>
        ))}
      </ol>
    </div>
  );
}