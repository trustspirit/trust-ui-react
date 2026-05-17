import type { ReactNode } from 'react';
import styles from './Badge.module.css';

export interface BadgeProps {
  /**
   * Visual fill style. 'solid' (default) uses solid background. 'subtle' uses
   * subtle tint. 'outline' uses transparent bg with colored border.
   */
  variant?: 'solid' | 'subtle' | 'outline';
  /** Color scheme */
  color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
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
  variant = 'solid',
  color = 'primary',
  size = 'md',
  dot = false,
  children,
  className,
  style,
}: BadgeProps) {
  const classNames = [
    styles.badge,
    styles[size],
    styles[variant],
    styles[color],
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
