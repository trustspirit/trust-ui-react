import {
  cloneElement,
  forwardRef,
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
import { useAnchoredLayer } from '../../hooks/useAnchoredLayer';
import { useTouchDevice } from '../../hooks/touch/useTouchDevice';
import { BottomSheet } from '../BottomSheet';
import styles from './Popover.module.css';

// 팝오버 안에서 Tab 경계를 판단할 때만 쓴다. useFocusTrap 의 목록은 비공개라 같은 기준을 옮겨 적었다.
const FOCUSABLE_SELECTOR = [
  'a[href]:not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]:not([contenteditable="false"]):not([tabindex="-1"])',
].join(', ');

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.closest('[inert]'),
  );
}

export interface PopoverProps {
  /** Content shown inside the popover. */
  content: ReactNode;
  /** The trigger element. It receives the ref, click handler and ARIA attributes. */
  children: ReactElement;
  /** Preferred side of the trigger. Flips to the opposite side when it does not fit. Default 'bottom'. */
  placement?: 'bottom' | 'top' | 'left' | 'right';
  /** Alignment along the trigger's edge. Default 'start'. */
  align?: 'start' | 'center' | 'end';
  /** Whether the popover is open (controlled). */
  open?: boolean;
  /** Initial open state (uncontrolled). Default false. */
  defaultOpen?: boolean;
  /** Called whenever the popover wants to open or close. */
  onOpenChange?: (open: boolean) => void;
  /** Accessible name of the popover. Falls back to the trigger's text via `aria-labelledby`. */
  label?: string;
  /**
   * How the popover is presented. 'adaptive' (default) uses a BottomSheet on touch devices and an
   * anchored popover otherwise; 'popover' and 'sheet' force one of the two.
   */
  presentation?: 'popover' | 'sheet' | 'adaptive';
  /** Close when the user presses outside the popover (or taps the sheet backdrop). Default true. */
  closeOnOutsideClick?: boolean;
  /** Close when Escape is pressed. Default true. */
  closeOnEscape?: boolean;
  /** Additional CSS class name for the popover surface. */
  className?: string;
  /** Additional inline styles for the popover surface. */
  style?: CSSProperties;
}

/**
 * Click-triggered, non-modal overlay anchored to its trigger. Positioning, flipping and the portal
 * target come from `useAnchoredLayer`; on touch devices the same content is shown in a BottomSheet.
 */
export const Popover = forwardRef<HTMLDivElement, PopoverProps>(function Popover(
  {
    content,
    children,
    placement = 'bottom',
    align = 'start',
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    label,
    presentation = 'adaptive',
    closeOnOutsideClick = true,
    closeOnEscape = true,
    className,
    style,
  },
  ref,
) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;

  const isTouch = useTouchDevice();
  const asSheet = presentation === 'sheet' || (presentation === 'adaptive' && isTouch);

  const triggerRef = useRef<HTMLElement | null>(null);
  const layerRef = useRef<HTMLDivElement | null>(null);
  const generatedId = useId();
  const popoverId = `${generatedId}-popover`;
  const childProps = children.props as Record<string, unknown>;
  const triggerId = (childProps.id as string | undefined) ?? `${generatedId}-trigger`;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const layer = useAnchoredLayer({
    open: open && !asSheet,
    anchorRef: triggerRef,
    layerRef,
    placement,
    align,
    offset: 8,
  });
  // 훅은 첫 측정 전까지 레이어를 visibility:hidden 으로 둔다. 숨겨진 요소는 포커스를 받지 못한다.
  const positioned = layer.style.visibility === 'visible';

  // 열리면 포커스를 안으로 옮긴다. 한 번 열릴 때 한 번만 — 위치 재계산마다 포커스를 되가져오지 않는다.
  const focusedOnOpenRef = useRef(false);
  useEffect(() => {
    if (!open || asSheet) {
      focusedOnOpenRef.current = false;
      return;
    }
    if (!positioned || focusedOnOpenRef.current) return;
    const node = layerRef.current;
    if (!node) return;
    focusedOnOpenRef.current = true;
    // 내용이 autoFocus 로 이미 포커스를 가져갔다면 그대로 둔다.
    if (node.contains(document.activeElement)) return;
    const target = node.querySelector<HTMLElement>('[autofocus]') ?? getFocusable(node)[0] ?? node;
    target.focus();
  }, [open, asSheet, positioned]);

  // 닫히면서 포커스가 갈 곳을 잃었을 때(팝오버 안에 있던 요소가 사라짐)만 트리거로 돌려준다.
  // 사용자가 바깥의 다른 컨트롤을 눌러 닫았다면 그 포커스를 빼앗지 않는다.
  // 시트 표현에서는 BottomSheet 의 포커스 트랩이 복구를 맡는다.
  const wasOpenRef = useRef(open && !asSheet);
  useEffect(() => {
    const isOpenAnchored = open && !asSheet;
    if (wasOpenRef.current && !open) {
      const active = document.activeElement;
      if (!active || active === document.body) triggerRef.current?.focus();
    }
    wasOpenRef.current = isOpenAnchored;
  }, [open, asSheet]);

  // 팝오버가 body 로 포털한 자식 레이어(Select 목록, Menu 등)는 DOM 상으로는 바깥이지만
  // React 트리에서는 안쪽이다. React 이벤트는 포털을 따라 올라오므로 그 사실을 여기서 기록한다.
  const pressedInsideRef = useRef(false);

  useEffect(() => {
    if (!open || asSheet || !closeOnOutsideClick) return;
    const onPointerDown = (e: PointerEvent) => {
      if (pressedInsideRef.current) {
        pressedInsideRef.current = false;
        return;
      }
      const target = e.target as Node | null;
      if (!target) return;
      if (layerRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, asSheet, closeOnOutsideClick, setOpen]);

  const handleLayerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const node = layerRef.current;
    if (!node) return;

    if (e.key === 'Escape') {
      // 안쪽 위젯(열린 Select 등)이 이미 이 Escape 를 썼다.
      if (!closeOnEscape || e.defaultPrevented) return;
      // 바깥의 Dialog·시트가 같은 키로 함께 닫히지 않게 한다.
      e.preventDefault();
      triggerRef.current?.focus();
      setOpen(false);
      return;
    }

    if (e.key === 'Tab') {
      const active = document.activeElement as HTMLElement | null;
      // 포털된 자식 레이어 안에서 온 Tab 은 그 레이어의 몫이다.
      if (!active || !node.contains(active)) return;
      const focusable = getFocusable(node);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (!first || active === first || active === node) {
          e.preventDefault();
          triggerRef.current?.focus();
          setOpen(false);
        }
      } else if (!last || active === last) {
        // 레이어는 body 끝에 포털되어 있어, 그대로 두면 Tab 이 문서 끝으로 빠진다.
        // 트리거로 먼저 옮겨 기본 Tab 동작이 트리거의 다음 요소로 가게 한다.
        triggerRef.current?.focus();
        setOpen(false);
      }
    }
  };

  const trigger = cloneElement(children, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      // React 19 는 ref 를 props 로 넘긴다. element.ref 접근은 경고를 낸다.
      const childRef =
        (childProps.ref as React.Ref<HTMLElement> | undefined) ??
        (children as { ref?: React.Ref<HTMLElement> }).ref;
      if (typeof childRef === 'function') {
        childRef(node);
      } else if (childRef && typeof childRef === 'object') {
        (childRef as React.MutableRefObject<HTMLElement | null>).current = node;
      }
    },
    onClick: (e: React.MouseEvent) => {
      (childProps.onClick as ((e: React.MouseEvent) => void) | undefined)?.(e);
      if (!e.defaultPrevented) setOpen(!open);
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      (childProps.onKeyDown as ((e: React.KeyboardEvent) => void) | undefined)?.(e);
      // 포커스가 트리거에 남아 있는 채로 열려 있을 때(closeOnOutsideClick={false} 등).
      if (e.key === 'Escape' && open && !asSheet && closeOnEscape && !e.defaultPrevented) {
        e.preventDefault();
        setOpen(false);
      }
    },
    id: triggerId,
    'aria-haspopup': 'dialog',
    'aria-expanded': open,
    'aria-controls': open ? popoverId : undefined,
  } as Record<string, unknown>);

  const naming = label ? { 'aria-label': label } : { 'aria-labelledby': triggerId };

  let overlay: ReactNode = null;
  if (asSheet) {
    overlay = (
      <BottomSheet
        ref={ref}
        id={popoverId}
        open={open}
        onClose={() => setOpen(false)}
        closeOnBackdrop={closeOnOutsideClick}
        closeOnEscape={closeOnEscape}
        {...naming}
      >
        <div className={[styles.sheetContent, className].filter(Boolean).join(' ')} style={style}>
          {content}
        </div>
      </BottomSheet>
    );
  } else if (open && layer.container) {
    overlay = createPortal(
      <div
        ref={(node) => {
          layerRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        id={popoverId}
        role="dialog"
        {...naming}
        // 포커스 가능한 내용이 없을 때 팝오버 자신이 포커스를 받는다. Tab 순서에는 들어가지 않는다.
        tabIndex={-1}
        data-placement={layer.placement}
        className={[styles.popover, className].filter(Boolean).join(' ')}
        style={{ ...style, ...layer.style }}
        onKeyDown={handleLayerKeyDown}
        onPointerDown={() => {
          pressedInsideRef.current = true;
        }}
      >
        {content}
      </div>,
      layer.container,
    );
  }

  return (
    <>
      {trigger}
      {overlay}
    </>
  );
});

Popover.displayName = 'Popover';
