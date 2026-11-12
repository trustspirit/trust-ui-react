import { forwardRef, type ElementType, type HTMLAttributes } from 'react';
import styles from './VisuallyHidden.module.css';

export interface VisuallyHiddenProps extends HTMLAttributes<HTMLElement> {
  /** Element to render. Defaults to `span`. */
  as?: ElementType;
  /** Target control id when rendered as a `label`. */
  htmlFor?: string;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

/**
 * 화면에는 보이지 않지만 접근성 트리에는 남는 텍스트.
 * display:none / visibility:hidden 은 보조 기술에서도 사라지므로 쓸 수 없다.
 */
export const VisuallyHidden = forwardRef<HTMLElement, VisuallyHiddenProps>(
  ({ as: Component = 'span', className, ...rest }, ref) => (
    <Component
      ref={ref}
      className={[styles.visuallyHidden, className ?? ''].filter(Boolean).join(' ')}
      {...rest}
    />
  ),
);

VisuallyHidden.displayName = 'VisuallyHidden';
