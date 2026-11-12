import {
  Children,
  Fragment,
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useTouchDevice } from '../../hooks/touch/useTouchDevice';
import { ActionSheet } from '../ActionSheet';
import { useAnchoredLayer } from '../../hooks/useAnchoredLayer';
import styles from './Menu.module.css';

/** Fragment 로 묶인 자식까지 한 겹으로 펼친다. */
function flattenChildren(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap((child) =>
    isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment
      ? flattenChildren(child.props.children)
      : [child],
  );
}

/* ── Context ── */

interface MenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  triggerId: string;
  mobileVariant: 'dropdown' | 'sheet';
}

const MenuContext = createContext<MenuContextValue | null>(null);

function useMenuContext() {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('Menu compound components must be used within a Menu');
  }
  return context;
}

/* ── Menu (root) ── */

export interface MenuProps {
  /** Menu children (Trigger, Content) */
  children: ReactNode;
  /**
   * Mobile-specific rendering. 'dropdown' (default) = same as desktop.
   * 'sheet' = renders as ActionSheet on viewports with coarse pointer.
   */
  mobileVariant?: 'dropdown' | 'sheet';
  /**
   * 내부 open 상태의 초기값. 트리거를 거치지 않고 이미 열린 메뉴를 렌더링하고
   * 싶은 소비자를 위한 것 — 시각 회귀 스토리 전용 탈출구가 아니다. 이후에도
   * 계속 비제어(uncontrolled)로 남으며, 이 prop 은 최초 상태만 정할 뿐이다.
   */
  defaultOpen?: boolean;
}

function MenuRoot({ children, mobileVariant = 'dropdown', defaultOpen = false }: MenuProps) {
  const [open, setOpen] = useState(defaultOpen);
  const triggerRef = useRef<HTMLElement | null>(null);
  const triggerId = useId();

  return (
    <MenuContext.Provider value={{ open, setOpen, triggerRef, triggerId, mobileVariant }}>
      <div className={styles.menu}>{children}</div>
    </MenuContext.Provider>
  );
}

MenuRoot.displayName = 'Menu';

/* ── Menu.Trigger ── */

interface MenuTriggerProps {
  /** Trigger element */
  children: ReactElement;
}

function MenuTrigger({ children }: MenuTriggerProps) {
  const { open, setOpen, triggerRef, triggerId } = useMenuContext();

  const handleClick = useCallback(() => {
    setOpen(!open);
  }, [open, setOpen]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(true);
      }
    },
    [setOpen],
  );

  const childProps = children.props as Record<string, unknown>;

  return cloneElement(children, {
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
      handleClick();
      (childProps.onClick as ((e: React.MouseEvent) => void) | undefined)?.(e);
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      handleKeyDown(e);
      (childProps.onKeyDown as ((e: React.KeyboardEvent) => void) | undefined)?.(e);
    },
    id: triggerId,
    'aria-haspopup': 'menu',
    'aria-expanded': open,
  } as Record<string, unknown>);
}

MenuTrigger.displayName = 'Menu.Trigger';

/* ── Menu.Content ── */

interface MenuContentProps {
  /** Additional CSS class name */
  className?: string;
  /** Additional inline styles */
  style?: CSSProperties;
  /** Alignment relative to trigger (default: 'start') */
  align?: 'start' | 'end';
  /** Content children (MenuItem, MenuDivider) */
  children: ReactNode;
}

function MenuContent({
  className,
  style,
  align = 'start',
  children,
}: MenuContentProps) {
  const { open, setOpen, triggerRef, triggerId, mobileVariant } = useMenuContext();
  const isTouch = useTouchDevice();
  const contentRef = useRef<HTMLDivElement>(null);
  // 위치·포털 대상·화면 충돌 처리는 공용 훅이 맡는다.
  const layer = useAnchoredLayer({
    open: open && !(mobileVariant === 'sheet' && isTouch),
    anchorRef: triggerRef,
    layerRef: contentRef,
    placement: 'bottom',
    align,
  });

  // Close on click outside
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      const content = contentRef.current;
      const trigger = triggerRef.current;
      if (
        content &&
        !content.contains(e.target as Node) &&
        trigger &&
        !trigger.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, setOpen, triggerRef]);

  // Focus first item when opened
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      const content = contentRef.current;
      if (!content) return;
      const firstItem = content.querySelector<HTMLElement>(
        '[role="menuitem"]:not([aria-disabled="true"])',
      );
      firstItem?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const content = contentRef.current;
      if (!content) return;

      const items = Array.from(
        content.querySelectorAll<HTMLElement>(
          '[role="menuitem"]:not([aria-disabled="true"])',
        ),
      );
      const currentIndex = items.indexOf(document.activeElement as HTMLElement);

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
          items[nextIndex]?.focus();
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
          items[prevIndex]?.focus();
          break;
        }
        case 'Home': {
          e.preventDefault();
          items[0]?.focus();
          break;
        }
        case 'End': {
          e.preventDefault();
          items[items.length - 1]?.focus();
          break;
        }
        case 'Escape': {
          e.preventDefault();
          setOpen(false);
          triggerRef.current?.focus();
          break;
        }
        case 'Tab': {
          // 포커스를 가진 항목이 언마운트되면 탐색이 문서 처음에서 다시 시작된다.
          // 트리거로 먼저 옮겨, 기본 Tab 동작이 트리거의 다음 요소로 가게 한다.
          triggerRef.current?.focus();
          setOpen(false);
          break;
        }
      }
    },
    [setOpen, triggerRef],
  );

  // Action-sheet variant: render as bottom sheet on touch devices
  if (mobileVariant === 'sheet' && isTouch) {
    const actions = flattenChildren(children)
      .filter((child): child is ReactElement<MenuItemProps> => {
        return isValidElement(child) && child.type === MenuItem;
      })
      .map((child) => ({
        // 문자열로 바꾸지 않는다. "{name} 삭제" 같은 여러 조각이나 요소도 그대로 보여 준다.
        label: child.props.children,
        onClick: () => {
          child.props.onClick?.();
          setOpen(false);
        },
        destructive: child.props.danger,
        disabled: child.props.disabled,
      }));

    return (
      <ActionSheet
        open={open}
        onClose={() => setOpen(false)}
        actions={actions}
        cancelLabel="Cancel"
      />
    );
  }

  if (!open) return null;

  const classNames = [styles.content, className].filter(Boolean).join(' ');

  const contentStyle: CSSProperties = { ...style, ...layer.style };

  return layer.container
    ? createPortal(
        <div
          ref={contentRef}
          role="menu"
          aria-labelledby={triggerId}
          className={classNames}
          style={contentStyle}
          onKeyDown={handleKeyDown}
        >
          {children}
        </div>,
        layer.container,
      )
    : null;
}

MenuContent.displayName = 'Menu.Content';

/* ── Menu.Item ── */

export interface MenuItemProps {
  /** Click handler */
  onClick?: () => void;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Render as a destructive action (red) */
  danger?: boolean;
  /** Icon before the label */
  startIcon?: ReactNode;
  /** Item content */
  children: ReactNode;
  /** Additional CSS class name */
  className?: string;
}

function MenuItem({
  onClick,
  disabled = false,
  danger = false,
  startIcon,
  children,
  className,
}: MenuItemProps) {
  const { setOpen, triggerRef } = useMenuContext();

  const handleClick = useCallback(() => {
    if (disabled) return;
    onClick?.();
    setOpen(false);
    // 고른 항목이 사라지면 포커스가 body 로 떨어진다. 트리거로 돌려준다.
    triggerRef.current?.focus();
  }, [disabled, onClick, setOpen, triggerRef]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick],
  );

  const classNames = [
    styles.item,
    danger ? styles.danger : '',
    disabled ? styles.disabled : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      className={classNames}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {startIcon && (
        <span className={styles.itemIcon} aria-hidden="true">
          {startIcon}
        </span>
      )}
      <span className={styles.itemLabel}>{children}</span>
    </div>
  );
}

MenuItem.displayName = 'Menu.Item';

/* ── Menu.Divider ── */

function MenuDivider() {
  return <hr className={styles.divider} />;
}

MenuDivider.displayName = 'Menu.Divider';

/* ── Export as compound component ── */

export const Menu = Object.assign(MenuRoot, {
  Trigger: MenuTrigger,
  Content: MenuContent,
  Item: MenuItem,
  Divider: MenuDivider,
});
