import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import styles from './StickyFooter.module.css';

export interface StickyFooterProps extends HTMLAttributes<HTMLDivElement> {
  /** Apply heavier shadow for visual lift. Default false. */
  elevated?: boolean;
  children?: ReactNode;
}

/**
 * Sticky bottom container with thumb-zone-safe padding. Useful for primary CTAs
 * in mobile forms (e.g. "Continue" at the bottom of a multi-step screen),
 * always reachable by the thumb. Respects `env(safe-area-inset-bottom)` via
 * --tui-thumb-safe-bottom token.
 */
export const StickyFooter = forwardRef<HTMLDivElement, StickyFooterProps>(
  function StickyFooter({ elevated = false, className, children, ...rest }, ref) {
    const cls = [styles.container, elevated && styles.elevated, className]
      .filter(Boolean)
      .join(' ');
    return (
      <div ref={ref} className={cls} {...rest}>
        {children}
      </div>
    );
  },
);
