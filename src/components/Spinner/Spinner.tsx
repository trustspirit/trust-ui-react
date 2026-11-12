import { forwardRef, useId, type CSSProperties, type HTMLAttributes } from 'react';
import styles from './Spinner.module.css';

export interface SpinnerProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Size of the ring: 16px, 20px or 28px */
  size?: 'sm' | 'md' | 'lg';
  /** Text that names the loading state. Always exposed to assistive technology. */
  label?: string;
  /** Shows the label next to the ring instead of hiding it visually */
  showLabel?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
}

export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(
  ({ size = 'md', label = 'Loading', showLabel = false, className, style, ...rest }, ref) => {
    const labelId = useId();
    const classNames = [styles.spinner, styles[size], className ?? ''].filter(Boolean).join(' ');

    // 이름을 aria-label 로 따로 주지 않고 라벨 요소를 가리킨다 — 보이는 글자와
    // 읽히는 이름이 한 곳에서 나와야 둘이 어긋나지 않는다.
    return (
      <span ref={ref} role="status" aria-labelledby={labelId} className={classNames} style={style} {...rest}>
        <span className={styles.ring} aria-hidden="true" />
        <span
          id={labelId}
          className={showLabel ? styles.label : styles.visuallyHidden}
          data-visually-hidden={showLabel ? undefined : ''}
        >
          {label}
        </span>
      </span>
    );
  },
);

Spinner.displayName = 'Spinner';
