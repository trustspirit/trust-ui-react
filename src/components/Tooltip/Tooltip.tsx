import {
  cloneElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import styles from './Tooltip.module.css';

export interface TooltipProps {
  /** Content to display inside the tooltip */
  content: ReactNode;
  /** Placement relative to the trigger (default: 'top') */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Visual variant (default: 'dark') */
  variant?: 'dark' | 'light';
  /** Delay in milliseconds before showing (default: 200) */
  delay?: number;
  /** Maximum width in pixels (default: 250) */
  maxWidth?: number;
  /** Trigger element */
  children: ReactElement;
  /** Additional CSS class name */
  className?: string;
}

export function Tooltip({
  content,
  placement = 'top',
  variant = 'dark',
  delay = 200,
  maxWidth = 250,
  children,
  className,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const triggerRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const tooltipId = useId();

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;
    if (!trigger || !tooltip) return;

    const triggerRect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const gap = 8;

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = triggerRect.top + scrollY - tooltipRect.height - gap;
        left =
          triggerRect.left +
          scrollX +
          triggerRect.width / 2 -
          tooltipRect.width / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + scrollY + gap;
        left =
          triggerRect.left +
          scrollX +
          triggerRect.width / 2 -
          tooltipRect.width / 2;
        break;
      case 'left':
        top =
          triggerRect.top +
          scrollY +
          triggerRect.height / 2 -
          tooltipRect.height / 2;
        left = triggerRect.left + scrollX - tooltipRect.width - gap;
        break;
      case 'right':
        top =
          triggerRect.top +
          scrollY +
          triggerRect.height / 2 -
          tooltipRect.height / 2;
        left = triggerRect.right + scrollX + gap;
        break;
    }

    setPosition({ top, left });
  }, [placement]);

  const show = useCallback(() => {
    timerRef.current = setTimeout(() => {
      setVisible(true);
    }, delay);
  }, [delay]);

  const hide = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setVisible(false);
  }, []);

  useEffect(() => {
    if (visible) {
      // Use requestAnimationFrame to ensure tooltip is rendered before measuring
      const frame = requestAnimationFrame(() => {
        updatePosition();
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [visible, updatePosition]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const tooltipClassNames = [
    styles.tooltip,
    styles[variant],
    styles[placement],
    visible ? styles.visible : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const tooltipStyle: CSSProperties = {
    top: position.top,
    left: position.left,
    maxWidth,
  };

  const childProps = children.props as Record<string, unknown>;

  const triggerElement = cloneElement(children, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      // Preserve the child's ref if it has one
      const childRef = (children as { ref?: React.Ref<HTMLElement> }).ref;
      if (typeof childRef === 'function') {
        childRef(node);
      } else if (childRef && typeof childRef === 'object') {
        (childRef as React.MutableRefObject<HTMLElement | null>).current = node;
      }
    },
    onMouseEnter: (e: React.MouseEvent) => {
      show();
      (childProps.onMouseEnter as ((e: React.MouseEvent) => void) | undefined)?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      hide();
      (childProps.onMouseLeave as ((e: React.MouseEvent) => void) | undefined)?.(e);
    },
    onFocus: (e: React.FocusEvent) => {
      show();
      (childProps.onFocus as ((e: React.FocusEvent) => void) | undefined)?.(e);
    },
    onBlur: (e: React.FocusEvent) => {
      hide();
      (childProps.onBlur as ((e: React.FocusEvent) => void) | undefined)?.(e);
    },
    'aria-describedby': visible ? tooltipId : undefined,
  } as Record<string, unknown>);

  return (
    <>
      {triggerElement}
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            className={tooltipClassNames}
            style={tooltipStyle}
          >
            {content}
            <span className={styles.arrow} aria-hidden="true" />
          </div>,
          document.body,
        )}
    </>
  );
}

Tooltip.displayName = 'Tooltip';
