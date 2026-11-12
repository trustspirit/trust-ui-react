import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react';
import styles from './Skeleton.module.css';

export interface SkeletonProps extends HTMLAttributes<HTMLSpanElement> {
  /** Width of the placeholder. Numbers are pixels, strings are used as-is. */
  width?: number | string;
  /**
   * Height of the placeholder (of each bar when `lines` is set). Numbers are
   * pixels, strings are used as-is.
   */
  height?: number | string;
  /**
   * Shape of the placeholder. `text` and `rect` differ only in corner radius;
   * `circle` is fully round and uses one dimension for both sides (`width`
   * if given, otherwise `height`, otherwise 40px).
   */
  shape?: 'text' | 'rect' | 'circle';
  /**
   * Number of text bars to render (`shape="text"` only). The last bar is 60%
   * wide so the block reads as a paragraph.
   */
  lines?: number;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
}

const toCss = (value: number | string) => (typeof value === 'number' ? `${value}px` : value);

/** 원은 지름 하나로 정해진다. 기본 폭(100%)을 그대로 쓰면 부모 폭만 한 원이 된다. */
const CIRCLE_DEFAULT = 40;

export const Skeleton = forwardRef<HTMLSpanElement, SkeletonProps>(
  ({ width, height, shape = 'text', lines, className, style, ...rest }, ref) => {
    const lineCount = shape === 'text' && lines !== undefined ? Math.max(1, Math.floor(lines)) : 1;

    // 불러오는 중이라는 사실은 이 조각이 아니라 감싸는 영역(aria-busy)이 알린다.
    // 그래서 기본은 숨기되, 호출자가 덮어쓸 수 있게 rest 보다 앞에 둔다.
    const common = { ref, 'aria-hidden': true as const, ...rest };

    if (lineCount > 1) {
      const classNames = [styles.lines, className ?? ''].filter(Boolean).join(' ');
      const barClassNames = [styles.skeleton, styles.text].join(' ');
      return (
        <span {...common} className={classNames} style={{ width: toCss(width ?? '100%'), ...style }}>
          {Array.from({ length: lineCount }, (_, i) => (
            <span
              key={i}
              className={barClassNames}
              style={{
                width: i === lineCount - 1 ? '60%' : '100%',
                height: toCss(height ?? '1em'),
              }}
            />
          ))}
        </span>
      );
    }

    let w = toCss(width ?? '100%');
    let h = toCss(height ?? '1em');
    if (shape === 'circle') {
      w = h = toCss(width ?? height ?? CIRCLE_DEFAULT);
    }

    const classNames = [styles.skeleton, styles[shape], className ?? ''].filter(Boolean).join(' ');

    return <span {...common} className={classNames} style={{ width: w, height: h, ...style }} />;
  },
);

Skeleton.displayName = 'Skeleton';
