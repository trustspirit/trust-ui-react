import {
  cloneElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useTouchDevice } from '../../hooks/touch/useTouchDevice';
import { useLongPress } from '../../hooks/touch/useLongPress';
import styles from './Tooltip.module.css';

export type TooltipMobileVariant = 'tap' | 'longpress' | 'inline' | 'hidden';

export interface TooltipProps {
  /** Content to display inside the tooltip */
  content: ReactNode;
  /** Placement relative to the trigger (default: 'top') */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Visual variant (default: 'dark') */
  variant?: 'dark' | 'light';
  /** Delay in milliseconds before showing on hover/focus (default: 200) */
  delay?: number;
  /** Maximum width in pixels (default: 250) */
  maxWidth?: number;
  /** Trigger element */
  children: ReactElement;
  /** Additional CSS class name */
  className?: string;

  /**
   * Mobile behavior mode. Overrides auto-default detection.
   * - 'tap': single tap toggles tooltip; auto-dismiss after mobileAutoDismiss ms
   * - 'longpress': hold for 500ms to show; release dismisses
   * - 'inline': render content as helper text below trigger
   * - 'hidden': don't show on mobile
   * Auto-default: button/link → 'longpress', input/textarea/select → 'inline', else → 'tap'.
   */
  mobileVariant?: TooltipMobileVariant;
  /** Auto-dismiss duration (ms) in tap mode. Default 4000. Set 0 to disable. */
  mobileAutoDismiss?: number;
  /** Show a visual indicator (dotted underline) on the trigger to hint that a tooltip exists. */
  mobileIndicator?: boolean;
  /** Override maxWidth on mobile (default falls back to maxWidth prop). */
  mobileMaxWidth?: number;
}

function detectAutoMobileVariant(child: ReactElement): TooltipMobileVariant {
  const type = child.type;
  const props = child.props as Record<string, unknown>;
  if (typeof type === 'string') {
    if (type === 'input' || type === 'textarea' || type === 'select') return 'inline';
    if (type === 'button' || type === 'a') return 'longpress';
  }
  if (props.role === 'button') return 'longpress';
  return 'tap';
}

export function Tooltip({
  content,
  placement = 'top',
  variant = 'dark',
  delay = 200,
  maxWidth = 250,
  children,
  className,
  mobileVariant,
  mobileAutoDismiss = 4000,
  mobileIndicator = false,
  mobileMaxWidth,
}: TooltipProps) {
  const isTouch = useTouchDevice();
  const effectiveMobileVariant = useMemo(
    () => mobileVariant ?? detectAutoMobileVariant(children),
    [mobileVariant, children],
  );

  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const autoDismissTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
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
        left = triggerRect.left + scrollX + triggerRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + scrollY + gap;
        left = triggerRect.left + scrollX + triggerRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'left':
        top = triggerRect.top + scrollY + triggerRect.height / 2 - tooltipRect.height / 2;
        left = triggerRect.left + scrollX - tooltipRect.width - gap;
        break;
      case 'right':
        top = triggerRect.top + scrollY + triggerRect.height / 2 - tooltipRect.height / 2;
        left = triggerRect.right + scrollX + gap;
        break;
    }
    setPosition({ top, left });
  }, [placement]);

  const showWithDelay = useCallback(() => {
    timerRef.current = setTimeout(() => setVisible(true), delay);
  }, [delay]);

  const showImmediate = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current);
    setVisible(false);
  }, []);

  // Only attach the 5 pointer listeners when longpress mode is actually
  // active. Switching ref identity between triggerRef and noopRef causes
  // useLongPress's effect to re-run, attaching/detaching listeners on demand.
  const longPressEnabled = isTouch && effectiveMobileVariant === 'longpress';
  const noopRef = useRef<HTMLElement | null>(null);
  useLongPress(
    longPressEnabled ? (triggerRef as React.RefObject<HTMLElement | null>) : noopRef,
    showImmediate,
    { delay: 500 },
  );

  useEffect(() => {
    if (!visible || !isTouch || effectiveMobileVariant !== 'tap') return;
    const onClickOutside = (e: PointerEvent) => {
      if (triggerRef.current?.contains(e.target as Node)) return;
      if (tooltipRef.current?.contains(e.target as Node)) return;
      hide();
    };
    document.addEventListener('pointerdown', onClickOutside);
    return () => document.removeEventListener('pointerdown', onClickOutside);
  }, [visible, isTouch, effectiveMobileVariant, hide]);

  useEffect(() => {
    if (!visible || !isTouch || effectiveMobileVariant !== 'tap' || mobileAutoDismiss === 0) return;
    autoDismissTimerRef.current = setTimeout(hide, mobileAutoDismiss);
    return () => {
      if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current);
    };
  }, [visible, isTouch, effectiveMobileVariant, mobileAutoDismiss, hide]);

  useEffect(() => {
    if (!visible || !isTouch || effectiveMobileVariant !== 'longpress') return;
    const onUp = () => hide();
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
    return () => {
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
    };
  }, [visible, isTouch, effectiveMobileVariant, hide]);

  useEffect(() => {
    if (visible) {
      const frame = requestAnimationFrame(() => updatePosition());
      return () => cancelAnimationFrame(frame);
    }
  }, [visible, updatePosition]);

  useEffect(() => {
    if (!visible) return;
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [visible, updatePosition]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current);
    };
  }, []);

  if (isTouch && effectiveMobileVariant === 'inline') {
    return (
      <div className={styles.inlineContainer}>
        {children}
        <span className={styles.inlineHint} id={tooltipId}>
          {content}
        </span>
      </div>
    );
  }

  if (isTouch && effectiveMobileVariant === 'hidden') {
    return children;
  }

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
    maxWidth: isTouch && mobileMaxWidth ? mobileMaxWidth : maxWidth,
  };

  const childProps = children.props as Record<string, unknown>;

  const onMouseEnter = (e: React.MouseEvent) => {
    if (!isTouch) showWithDelay();
    (childProps.onMouseEnter as ((e: React.MouseEvent) => void) | undefined)?.(e);
  };
  const onMouseLeave = (e: React.MouseEvent) => {
    if (!isTouch) hide();
    (childProps.onMouseLeave as ((e: React.MouseEvent) => void) | undefined)?.(e);
  };
  const onFocus = (e: React.FocusEvent) => {
    if (!isTouch) showWithDelay();
    (childProps.onFocus as ((e: React.FocusEvent) => void) | undefined)?.(e);
  };
  const onBlur = (e: React.FocusEvent) => {
    if (!isTouch) hide();
    (childProps.onBlur as ((e: React.FocusEvent) => void) | undefined)?.(e);
  };
  const onClick = (e: React.MouseEvent) => {
    if (isTouch && effectiveMobileVariant === 'tap') {
      e.preventDefault();
      setVisible((v) => !v);
    }
    (childProps.onClick as ((e: React.MouseEvent) => void) | undefined)?.(e);
  };

  const childExistingClassName = (childProps.className as string | undefined) ?? '';
  const triggerClassName =
    isTouch && mobileIndicator
      ? `${childExistingClassName} ${styles.indicatorDottedTrigger}`.trim()
      : childExistingClassName;

  const triggerElement = cloneElement(children, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      const childRef = (children as { ref?: React.Ref<HTMLElement> }).ref;
      if (typeof childRef === 'function') childRef(node);
      else if (childRef && typeof childRef === 'object') {
        (childRef as React.MutableRefObject<HTMLElement | null>).current = node;
      }
    },
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    onClick,
    className: triggerClassName,
    'aria-describedby': visible ? tooltipId : undefined,
  } as Record<string, unknown>);

  return (
    <>
      {triggerElement}
      {typeof document !== 'undefined' &&
        visible &&
        createPortal(
          <div
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            aria-live="polite"
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
