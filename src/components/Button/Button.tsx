import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import styles from './Button.module.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  /** Size of the button */
  size?: 'sm' | 'md' | 'lg';
  /** Shows a spinner and disables the button */
  loading?: boolean;
  /** Icon placed before the children */
  startIcon?: ReactNode;
  /** Icon placed after the children */
  endIcon?: ReactNode;
  /** Stretches the button to fill its container */
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      startIcon,
      endIcon,
      fullWidth = false,
      className,
      style,
      children,
      ...rest
    },
    ref,
  ) => {
    const classNames = [
      styles.button,
      styles[variant],
      styles[size],
      fullWidth ? styles.fullWidth : '',
      loading ? styles.loading : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={classNames}
        disabled={disabled || loading}
        style={style}
        {...rest}
      >
        {loading && <span className={styles.spinner} aria-hidden="true" />}
        {!loading && startIcon && (
          <span className={styles.icon}>{startIcon}</span>
        )}
        {children && <span className={styles.label}>{children}</span>}
        {!loading && endIcon && (
          <span className={styles.icon}>{endIcon}</span>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
