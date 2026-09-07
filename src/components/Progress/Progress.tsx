import styles from './Progress.module.css';

export interface ProgressProps {
  /** Current progress value (0-100) */
  value?: number;
  /** Color variant */
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  /** Height of the progress bar */
  size?: 'sm' | 'md' | 'lg';
  /** Shows an animated indeterminate loading bar */
  indeterminate?: boolean;
  /** Shows the percentage label */
  showLabel?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

export function Progress({
  value = 0,
  variant = 'primary',
  size = 'md',
  indeterminate = false,
  showLabel = false,
  className,
  style,
}: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));

  const classNames = [
    styles.wrapper,
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const progressClassNames = [
    styles.progress,
    styles[variant],
    styles[size],
    indeterminate ? styles.indeterminate : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} style={style}>
      <progress
        className={progressClassNames}
        value={indeterminate ? undefined : clamped}
        max={100}
        aria-valuenow={indeterminate ? undefined : clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      />
      {showLabel && !indeterminate && (
        <span className={styles.label}>{Math.round(clamped)}%</span>
      )}
    </div>
  );
}
