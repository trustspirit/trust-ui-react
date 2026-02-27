import type { ReactNode } from 'react';
import styles from './Chip.module.css';

export interface ChipProps {
  /** Visual style variant */
  variant?: 'filled' | 'outlined';
  /** Color scheme */
  color?: 'primary' | 'secondary' | 'success' | 'danger';
  /** Size of the chip */
  size?: 'sm' | 'md';
  /** Callback when the delete icon is clicked; shows the delete button when provided */
  onDelete?: () => void;
  /** Makes the chip clickable */
  onClick?: () => void;
  /** Icon placed before the label */
  startIcon?: ReactNode;
  /** Chip label content */
  children: ReactNode;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

function DeleteIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      width="14"
      height="14"
      aria-hidden="true"
    >
      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
    </svg>
  );
}

export function Chip({
  variant = 'filled',
  color = 'primary',
  size = 'md',
  onDelete,
  onClick,
  startIcon,
  children,
  className,
  style,
}: ChipProps) {
  const classNames = [
    styles.chip,
    styles[variant],
    styles[color],
    styles[size],
    onClick ? styles.clickable : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <span
      className={classNames}
      style={style}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
    >
      {startIcon && <span className={styles.icon}>{startIcon}</span>}
      <span className={styles.label}>{children}</span>
      {onDelete && (
        <button
          type="button"
          className={styles.deleteButton}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Remove"
        >
          <DeleteIcon />
        </button>
      )}
    </span>
  );
}
