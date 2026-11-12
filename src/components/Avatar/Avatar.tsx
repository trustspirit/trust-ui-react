import { useState } from 'react';
import styles from './Avatar.module.css';

export interface AvatarProps {
  /** Image URL */
  src?: string;
  /** Alt text for the image */
  alt?: string;
  /** Name used to derive initials when no image is available */
  name?: string;
  /** Shape of the avatar */
  shape?: 'circle' | 'square';
  /** Size of the avatar */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Presence indicator dot in the bottom-right corner. */
  status?: 'online' | 'away' | 'busy' | 'offline';
  /** Add a ring outline around the avatar (good for stacked avatars). */
  outlined?: boolean;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return (parts[0]?.[0] ?? '').toUpperCase();
}

function DefaultIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      width="60%"
      height="60%"
      aria-hidden="true"
    >
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
}

export function Avatar({
  src,
  alt = '',
  name,
  shape = 'circle',
  size = 'md',
  className,
  style,
  status,
  outlined,
}: AvatarProps) {
  // 실패한 주소를 기억한다. boolean 으로 두면 src 가 바뀌어도 실패 상태가 남는다.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const showImage = src && failedSrc !== src;
  const initials = name ? getInitials(name) : '';

  const classNames = [
    styles.avatar,
    styles[size],
    styles[shape],
    !showImage ? styles.fallback : '',
    outlined ? styles.outlined : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={classNames}
      style={style}
      role="img"
      // role="img" 의 자식은 보조 기술에 전달되지 않는다. 상태는 이름에 합친다.
      aria-label={[alt || name || 'avatar', status].filter(Boolean).join(', ')}
    >
      <span className={styles.imageWrapper}>
        {showImage ? (
          <img
            className={styles.image}
            src={src}
            alt={alt}
            onError={() => setFailedSrc(src ?? null)}
          />
        ) : initials ? (
          <span className={styles.initials} aria-hidden="true">
            {initials}
          </span>
        ) : (
          <DefaultIcon />
        )}
      </span>
      {status && (
        <span
          className={[styles.statusDot, styles[status]].join(' ')}
          aria-hidden="true"
        />
      )}
    </span>
  );
}
