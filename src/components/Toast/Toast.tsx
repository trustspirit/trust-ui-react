import { useEffect, useLayoutEffect, useRef,
  useState, type CSSProperties } from 'react';
import styles from './Toast.module.css';
import { useMessages } from '../../providers/LocaleProvider';

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

/**
 * 상태는 획의 색으로만 알린다 — 배지도 원도 두지 않는다.
 * 획 굵기는 1.5, 크기는 16px — 표의 정렬 아이콘(12px, 굵기 1.5~2)과 크기도
 * 굵기도 다르다. 서로 다른 자리에서 각자 알맞게 읽히면 되는 것이지, 두
 * 컴포넌트가 같은 값을 공유해야 하는 것은 아니다.
 */
function VariantIcon({ variant }: { variant: ToastVariant }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  if (variant === 'success') {
    return (
      <svg {...common}>
        <path d="M3 8.5l3.5 3.5L13 4.5" />
      </svg>
    );
  }
  if (variant === 'danger') {
    return (
      <svg {...common}>
        <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
      </svg>
    );
  }
  if (variant === 'warning') {
    return (
      <svg {...common}>
        <path d="M8 2.6l5.9 10.2a.5.5 0 0 1-.4.7H2.5a.5.5 0 0 1-.4-.7z" />
        <path d="M8 6.6v3.1" />
        <path d="M8 11.7h.01" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="8" cy="8" r="5.6" />
      <path d="M8 7.4v3.2" />
      <path d="M8 5.2h.01" />
    </svg>
  );
}

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
  const t = useMessages();
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  });

  // 읽거나 닫기 버튼으로 가는 동안 사라지면 안 된다(WCAG 2.2.1).
  // 포인터가 올라와 있거나 포커스가 안에 있으면 타이머를 멈추고 남은 시간을 기억한다.
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const paused = hovered || focused;
  const remainingRef = useRef(duration);
  useEffect(() => {
    remainingRef.current = duration;
  }, [duration]);

  useEffect(() => {
    if (duration <= 0 || paused) return;
    const startedAt = Date.now();
    timerRef.current = setTimeout(() => {
      onCloseRef.current?.();
    }, remainingRef.current);
    return () => {
      clearTimeout(timerRef.current);
      remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startedAt));
    };
  }, [duration, paused]);

  // 성공·안내는 하던 말을 끊지 않고 알린다. 경고·오류만 즉시 끼어든다.
  const role = variant === 'danger' || variant === 'warning' ? 'alert' : 'status';

  const classNames = [styles.toast, styles[variant], className]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      role={role}
      className={classNames}
      style={style}
      data-paused={paused || undefined}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <span className={styles.icon} aria-hidden="true">
        <VariantIcon variant={variant} />
      </span>
      <div className={styles.body}>
        <p className={styles.message}>{message}</p>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      <button
        type="button"
        className={styles.closeButton}
        onClick={onClose}
        aria-label={t.toast.close}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
        </svg>
      </button>
      {showProgress && duration > 0 && (
        <span
          className={styles.drain}
          style={{ animationDuration: `${duration}ms` }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

Toast.displayName = 'Toast';
