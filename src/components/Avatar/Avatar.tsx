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
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  const showImage = src && !imgError;
  const initials = name ? getInitials(name) : '';

  const classNames = [
    styles.avatar,
    styles[size],
    styles[shape],
    !showImage ? styles.fallback : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classNames} style={style} role="img" aria-label={alt || name || 'avatar'}>
      {showImage ? (
        <img
          className={styles.image}
          src={src}
          alt={alt}
          onError={() => setImgError(true)}
        />
      ) : initials ? (
        <span className={styles.initials} aria-hidden="true">
          {initials}
        </span>
      ) : (
        <DefaultIcon />
      )}
    </span>
  );
}
