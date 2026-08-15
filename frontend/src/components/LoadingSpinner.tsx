import './LoadingSpinner.css';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface LoadingSpinnerProps {
  size?: SpinnerSize;
  label?: string;
}

export function LoadingSpinner({
  size = 'md',
  label,
}: LoadingSpinnerProps) {
  return (
    <span
      className={`spinner spinner--${size}`}
      role="status"
      aria-label={label ?? 'Loading'}
    >
      <span className="spinner__ring" aria-hidden="true" />
      {label && <span className="spinner__label">{label}</span>}
    </span>
  );
}
