import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import styles from './SafeAreaView.module.css';

export type SafeAreaEdge = 'top' | 'right' | 'bottom' | 'left';

export interface SafeAreaViewProps extends HTMLAttributes<HTMLDivElement> {
  /** Which edges should respect safe-area-inset. Default: all four. */
  edges?: SafeAreaEdge[];
  children?: ReactNode;
}

/**
 * Container that applies `env(safe-area-inset-*)` padding to its edges.
 * Useful at the root of mobile-fullscreen screens, modal/sheet containers,
 * and any element near the top of the viewport (notch) or bottom (home
 * indicator) on iOS.
 *
 * Unsupported browsers (most Android Chrome) fall back to 0px insets — the
 * CSS env() fallback declared in tokens.css handles this transparently.
 */
export const SafeAreaView = forwardRef<HTMLDivElement, SafeAreaViewProps>(
  function SafeAreaView(
    { edges = ['top', 'right', 'bottom', 'left'], className, children, ...rest },
    ref,
  ) {
    const cls = [styles.container, className];
    for (const edge of edges) {
      cls.push(styles[edge]);
    }
    return (
      <div ref={ref} className={cls.filter(Boolean).join(' ')} {...rest}>
        {children}
      </div>
    );
  },
);
