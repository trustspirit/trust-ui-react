import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import styles from './Banner.module.css';

export type BannerStatus = 'info' | 'success' | 'warning' | 'danger';

export interface BannerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'role'> {
  /** Meaning of the message. Sets the icon and the colour of the leading rule. */
  status: BannerStatus;
  /** Main message */
  title: ReactNode;
  /** Supporting text below the title */
  description?: ReactNode;
  /**
   * Replaces the default status icon. Pass `null` to render no icon. The icon
   * is decorative and hidden from assistive technology.
   */
  icon?: ReactNode;
  /** Buttons or links placed at the inline end; they wrap below the text in narrow containers */
  actions?: ReactNode;
  /** Called when the close button is pressed. The close button renders only when this is provided. */
  onDismiss?: () => void;
  /** Accessible name of the close button */
  dismissLabel?: string;
  /**
   * Live-region role. Leave unset for a banner that is part of the page from
   * the start; set `status` (polite) or `alert` (assertive) only when the
   * banner is inserted in response to something that just happened.
   */
  role?: 'status' | 'alert';
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
}

/** Toast 의 VariantIcon 과 같은 도형이다 — 같은 상태는 어디서나 같은 획으로 읽혀야 한다. */
function StatusIcon({ status }: { status: BannerStatus }) {
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
  if (status === 'success') {
    return (
      <svg {...common}>
        <path d="M3 8.5l3.5 3.5L13 4.5" />
      </svg>
    );
  }
  if (status === 'danger') {
    return (
      <svg {...common}>
        <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
      </svg>
    );
  }
  if (status === 'warning') {
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

export const Banner = forwardRef<HTMLDivElement, BannerProps>(
  (
    {
      status,
      title,
      description,
      icon,
      actions,
      onDismiss,
      dismissLabel = 'Dismiss',
      role,
      className,
      style,
      ...rest
    },
    ref,
  ) => {
    const classNames = [styles.banner, styles[status], className ?? ''].filter(Boolean).join(' ');
    // undefined 는 "기본 아이콘", null 은 "아이콘 없음" 이다.
    const resolvedIcon = icon === undefined ? <StatusIcon status={status} /> : icon;

    return (
      <div ref={ref} role={role} className={classNames} style={style} {...rest}>
        {resolvedIcon !== null && resolvedIcon !== false && (
          <span className={styles.icon} aria-hidden="true">
            {resolvedIcon}
          </span>
        )}
        <div className={styles.content}>
          <div className={styles.text}>
            <p className={styles.title}>{title}</p>
            {description && <div className={styles.description}>{description}</div>}
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
        {onDismiss && (
          <button
            type="button"
            className={styles.dismissButton}
            onClick={onDismiss}
            aria-label={dismissLabel}
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
        )}
      </div>
    );
  },
);

Banner.displayName = 'Banner';
