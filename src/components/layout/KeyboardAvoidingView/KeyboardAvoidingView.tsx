import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { useVisualViewport } from '../../../hooks/touch/useVisualViewport';
import styles from './KeyboardAvoidingView.module.css';

export interface KeyboardAvoidingViewProps extends HTMLAttributes<HTMLDivElement> {
  /** Additional bottom padding (px) added on top of keyboard height when keyboard is open. Default 0. */
  offset?: number;
  children?: ReactNode;
}

/**
 * Container that adds bottom padding equal to the on-screen keyboard height
 * when the keyboard is open. Useful for chat input rows, multi-step forms,
 * and any layout that must stay visible above the keyboard.
 *
 * Uses Visual Viewport API. In unsupported environments, no-op (no padding
 * adjustment) — apps should provide alternative layout strategy.
 */
export const KeyboardAvoidingView = forwardRef<HTMLDivElement, KeyboardAvoidingViewProps>(
  function KeyboardAvoidingView({ offset = 0, className, style, children, ...rest }, ref) {
    const { keyboardOpen, height } = useVisualViewport();

    const keyboardHeight =
      keyboardOpen && typeof window !== 'undefined' ? window.innerHeight - height : 0;

    const cls = [styles.container, className].filter(Boolean).join(' ');

    return (
      <div
        ref={ref}
        className={cls}
        style={{
          paddingBottom: keyboardHeight + offset,
          ...style,
        }}
        {...rest}
      >
        {children}
      </div>
    );
  },
);
