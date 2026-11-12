import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react';
import styles from './StatusDot.module.css';

export interface StatusDotProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Meaning of the dot */
  variant: 'neutral' | 'success' | 'warning' | 'danger' | 'accent';
  /**
   * Text alternative, e.g. "Online". Required: colour alone does not carry
   * the status to everyone.
   */
  label: string;
  /** Draws a slow expanding ring to show the status is live. Stops under reduced motion. */
  pulse?: boolean;
  /** Size of the dot: 6px or 8px */
  size?: 'sm' | 'md';
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
}

export const StatusDot = forwardRef<HTMLSpanElement, StatusDotProps>(
  ({ variant, label, pulse = false, size = 'md', className, style, ...rest }, ref) => {
    const classNames = [
      styles.statusDot,
      styles[variant],
      styles[size],
      pulse ? styles.pulse : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    return <span ref={ref} role="img" aria-label={label} className={classNames} style={style} {...rest} />;
  },
);

StatusDot.displayName = 'StatusDot';
