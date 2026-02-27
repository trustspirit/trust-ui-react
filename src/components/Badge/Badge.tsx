import type { ReactNode } from 'react';
import styles from './Badge.module.css';

export interface BadgeProps {
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  /** Size of the badge */
  size?: 'sm' | 'md';
  /** Renders as a small colored dot with no text */
  dot?: boolean;
  /** Badge content */
  children?: ReactNode;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

export function Badge({
  variant = 'primary',
  size = 'md',
  dot = false,
  children,
  className,
  style,
}: BadgeProps) {
  const classNames = [
    styles.badge,
    styles[variant],
    styles[size],
    dot ? styles.dot : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classNames} style={style}>
      {!dot && children}
    </span>
  );
}
