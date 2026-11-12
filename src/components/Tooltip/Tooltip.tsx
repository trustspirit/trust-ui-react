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
import { useAnchoredLayer } from '../../hooks/useAnchoredLayer';
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
  /** Renders the tooltip visible on mount without hover/focus (uncontrolled). 표면 자체를 캡처하는 스토리용. */
  defaultVisible?: boolean;
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
  defaultVisible = false,
}: TooltipProps) {
  const isTouch = useTouchDevice();
  const effectiveMobileVariant = useMemo(
    () => mobileVariant ?? detectAutoMobileVariant(children),
    [mobileVariant, children],
  );

  const [visible, setVisible] = useState(defaultVisible);
  const triggerRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const autoDismissTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const tooltipId = useId();

  // 위치·화면 충돌 처리. 가장자리에서는 반대편으로 뒤집고 화면 안으로 당긴다.
  const layer = useAnchoredLayer({
    open: visible,
    anchorRef: triggerRef,
    layerRef: tooltipRef,
    placement,
    align: 'center',
    offset: 8,
  });

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

  // Escape 로 닫을 수 있어야 한다(WCAG 1.4.13). 포커스가 어디에 있든 듣는다.
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') hide();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [visible, hide]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current);
    };
  }, []);

  const childProps = children.props as Record<string, unknown>;
  const existingDescribedBy = childProps['aria-describedby'] as string | undefined;
  /** 자식이 이미 가진 설명 id 를 지우지 않고 뒤에 덧붙인다. */
  const describedBy = (extra: string | undefined) =>
    [existingDescribedBy, extra].filter(Boolean).join(' ') || undefined;

  if (isTouch && effectiveMobileVariant === 'inline') {
    return (
      <div className={styles.inlineContainer}>
        {cloneElement(children, { 'aria-describedby': describedBy(tooltipId) } as Record<string, unknown>)}
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
    // 뒤집혔다면 화살표도 실제로 놓인 쪽을 따른다.
    styles[layer.placement],
    visible ? styles.visible : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const tooltipStyle: CSSProperties = {
    ...layer.style,
    maxHeight: undefined,
    maxWidth: isTouch && mobileMaxWidth ? mobileMaxWidth : maxWidth,
  };

  const onMouseEnter = (e: React.MouseEvent) => {
    if (!isTouch) showWithDelay();
    (childProps.onMouseEnter as ((e: React.MouseEvent) => void) | undefined)?.(e);
  };
  const onMouseLeave = (e: React.MouseEvent) => {
    if (!isTouch) hide();
    (childProps.onMouseLeave as ((e: React.MouseEvent) => void) | undefined)?.(e);
  };
  const onFocus = (e: React.FocusEvent) => {
    // 터치 기기라도 키보드를 붙여 쓰는 경우가 있다. 키보드 포커스에는 보여 준다.
    let keyboardFocus = false;
    try {
      keyboardFocus = (e.target as Element).matches(':focus-visible');
    } catch {
      /* :focus-visible 을 모르는 환경 */
    }
    if (!isTouch || keyboardFocus) showWithDelay();
    (childProps.onFocus as ((e: React.FocusEvent) => void) | undefined)?.(e);
  };
  const onBlur = (e: React.FocusEvent) => {
    if (!isTouch || effectiveMobileVariant !== 'tap') hide();
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
      // React 19 는 ref 를 props 로 넘긴다. element.ref 접근은 경고를 낸다.
      const childRef =
        (childProps.ref as React.Ref<HTMLElement> | undefined) ??
        (children as { ref?: React.Ref<HTMLElement> }).ref;
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
    'aria-describedby': describedBy(visible ? tooltipId : undefined),
  } as Record<string, unknown>);

  return (
    <>
      {triggerElement}
      {visible &&
        layer.container &&
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
          layer.container,
        )}
    </>
  );
}

Tooltip.displayName = 'Tooltip';
