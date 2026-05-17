import { useEffect, useLayoutEffect, useRef, type CSSProperties } from 'react';
import styles from './Toast.module.css';

export type ToastVariant = 'success' | 'danger' | 'warning' | 'info';

export interface ToastProps {
  /** Unique identifier for the toast */
  id: string;
  /** Visual variant */
  variant: ToastVariant;
  /** Main message text */
  message: string;
  /** Optional description below the message */
  description?: string;
  /** Auto-dismiss duration in milliseconds (default: 4000) */
  duration?: number;
  /** Show a progress bar that drains over the duration */
  showProgress?: boolean;
  /** Callback when toast is closed */
  onClose?: () => void;
  /** Additional CSS class name */
  className?: string;
  /** Additional inline styles */
  style?: CSSProperties;
}

const variantIcons: Record<ToastVariant, string> = {
  success: '✓',
  danger: '✕',
  warning: '⚠',
  info: 'ℹ',
};

export function Toast({
  variant,
  message,
  description,
  duration = 4000,
  showProgress,
  onClose,
  className,
  style,
}: ToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (duration > 0) {
      timerRef.current = setTimeout(() => {
        onCloseRef.current?.();
      }, duration);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [duration]);

  const classNames = [styles.toast, styles[variant], className]
    .filter(Boolean)
    .join(' ');

  return (
    <div role="alert" className={classNames} style={style}>
      <span className={styles.icon} aria-hidden="true">
        {variantIcons[variant]}
      </span>
      <div className={styles.body}>
        <p className={styles.message}>{message}</p>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      <button
        type="button"
        className={styles.closeButton}
        onClick={onClose}
        aria-label="Close notification"
      >
        ✕
      </button>
      {showProgress && duration > 0 && (
        <div
          className={[styles.progress, styles[variant]].filter(Boolean).join(' ')}
          style={{ animationDuration: `${duration}ms` }}
        />
      )}
    </div>
  );
}

Toast.displayName = 'Toast';
