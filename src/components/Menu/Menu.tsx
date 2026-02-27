import {
  cloneElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import styles from './Menu.module.css';

/* ── Context ── */

interface MenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
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
}

function MenuRoot({ children }: MenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  return (
    <MenuContext.Provider value={{ open, setOpen, triggerRef }}>
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
  const { open, setOpen, triggerRef } = useMenuContext();

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
      const childRef = (children as { ref?: React.Ref<HTMLElement> }).ref;
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
  const { open, setOpen, triggerRef } = useMenuContext();
  const contentRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  // Position the menu below the trigger
  useEffect(() => {
    if (!open) return;

    const trigger = triggerRef.current;
    const content = contentRef.current;
    if (!trigger || !content) return;

    const triggerRect = trigger.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const gap = 4;

    let top = triggerRect.bottom + scrollY + gap;
    let left: number;

    if (align === 'end') {
      left = triggerRect.right + scrollX - contentRect.width;
    } else {
      left = triggerRect.left + scrollX;
    }

    // Prevent overflow right
    if (left + contentRect.width > window.innerWidth) {
      left = window.innerWidth - contentRect.width - 8;
    }
    // Prevent overflow left
    if (left < 0) {
      left = 8;
    }
    // Prevent overflow bottom
    if (top + contentRect.height > window.innerHeight + window.scrollY) {
      top = triggerRect.top + scrollY - contentRect.height - gap;
    }

    setPosition({ top, left });
  }, [open, align, triggerRef]);

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
        case 'Escape': {
          e.preventDefault();
          setOpen(false);
          triggerRef.current?.focus();
          break;
        }
        case 'Tab': {
          setOpen(false);
          break;
        }
      }
    },
    [setOpen, triggerRef],
  );

  if (!open) return null;

  const classNames = [styles.content, className].filter(Boolean).join(' ');

  const contentStyle: CSSProperties = {
    ...style,
    top: position.top,
    left: position.left,
  };

  return typeof document !== 'undefined'
    ? createPortal(
        <div
          ref={contentRef}
          role="menu"
          className={classNames}
          style={contentStyle}
          onKeyDown={handleKeyDown}
        >
          {children}
        </div>,
        document.body,
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
  const { setOpen } = useMenuContext();

  const handleClick = useCallback(() => {
    if (disabled) return;
    onClick?.();
    setOpen(false);
  }, [disabled, onClick, setOpen]);

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
