import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MutableRefObject,
  type ReactNode,
} from 'react';
import styles from './Tabs.module.css';

/* ── Context ── */

interface TabsContextValue {
  activeValue: string;
  setActiveValue: (value: string) => void;
  variant: 'underline' | 'pill';
  baseId: string;
  triggerRefs: MutableRefObject<Map<string, HTMLButtonElement>>;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) {
    throw new Error('Tabs compound components must be used within <Tabs>');
  }
  return ctx;
}

/* ── Tabs Root ── */

export interface TabsProps {
  /** Initial active tab (uncontrolled mode) */
  defaultValue?: string;
  /** Active tab value (controlled mode) */
  value?: string;
  /** Callback when active tab changes */
  onChange?: (value: string) => void;
  /** Visual variant (default: 'underline') */
  variant?: 'underline' | 'pill' | 'segmented';
  /** Children */
  children: ReactNode;
  /** Additional CSS class name */
  className?: string;
  /** Additional inline styles */
  style?: CSSProperties;
}

function TabsRoot({
  defaultValue,
  value,
  onChange,
  variant = 'underline',
  children,
  className,
  style,
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const baseId = useId();
  const triggerRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const isControlled = value !== undefined;
  const activeValue = isControlled ? value : internalValue;

  // Normalize 'segmented' to 'pill' for internal use
  const normalizedVariant: 'underline' | 'pill' =
    variant === 'segmented' ? 'pill' : variant;

  const setActiveValue = useCallback(
    (newValue: string) => {
      if (!isControlled) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    },
    [isControlled, onChange],
  );

  const classNames = [styles.tabs, className].filter(Boolean).join(' ');

  return (
    <TabsContext.Provider
      value={{ activeValue, setActiveValue, variant: normalizedVariant, baseId, triggerRefs }}
    >
      <div className={classNames} style={style}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

TabsRoot.displayName = 'Tabs';

/* ── Tabs.List ── */

interface TabsListProps {
  /** Tab triggers */
  children: ReactNode;
  /** Additional CSS class name */
  className?: string;
}

function TabsList({ children, className }: TabsListProps) {
  const { variant, activeValue, triggerRefs } = useTabsContext();
  const listRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });

  const updateIndicator = useCallback(() => {
    if (variant !== 'underline') return;
    const activeTrigger = triggerRefs.current.get(activeValue);
    const list = listRef.current;
    if (!activeTrigger || !list) return;
    const listRect = list.getBoundingClientRect();
    const triggerRect = activeTrigger.getBoundingClientRect();
    setIndicatorStyle({
      left: triggerRect.left - listRect.left,
      width: triggerRect.width,
    });
  }, [variant, activeValue, triggerRefs]);

  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  useEffect(() => {
    if (variant !== 'underline' || typeof window === 'undefined') return;
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [variant, updateIndicator]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    const list = listRef.current;
    if (!list) return;

    const triggers = Array.from(
      list.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])'),
    );
    const currentIndex = triggers.findIndex((t) => t === document.activeElement);
    if (currentIndex === -1) return;

    let nextIndex: number | null = null;

    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % triggers.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + triggers.length) % triggers.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = triggers.length - 1;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      triggers[nextIndex].focus();
    }
  }, []);

  const classNames = [
    styles.list,
    variant === 'underline' ? styles.listUnderline : styles.listPill,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={listRef}
      role="tablist"
      className={classNames}
      onKeyDown={handleKeyDown}
    >
      {children}
      {variant === 'underline' && (
        <span
          className={styles.indicator}
          style={{
            transform: `translateX(${indicatorStyle.left}px)`,
            width: indicatorStyle.width,
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

TabsList.displayName = 'Tabs.List';

/* ── Tabs.Trigger ── */

interface TabsTriggerProps {
  /** Value that identifies this tab */
  value: string;
  /** Disable the trigger */
  disabled?: boolean;
  /** Trigger label */
  children: ReactNode;
  /** Additional CSS class name */
  className?: string;
}

function TabsTrigger({ value, disabled = false, children, className }: TabsTriggerProps) {
  const { activeValue, setActiveValue, variant, baseId, triggerRefs } = useTabsContext();
  const isActive = activeValue === value;

  const triggerId = `${baseId}-trigger-${value}`;
  const panelId = `${baseId}-panel-${value}`;

  const classNames = [
    styles.trigger,
    variant === 'underline' ? styles.triggerUnderline : styles.triggerPill,
    isActive ? styles.triggerActive : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      id={triggerId}
      role="tab"
      className={classNames}
      aria-selected={isActive}
      aria-controls={panelId}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={() => setActiveValue(value)}
      ref={(el) => {
        if (el) triggerRefs.current.set(value, el);
        else triggerRefs.current.delete(value);
      }}
    >
      {children}
    </button>
  );
}

TabsTrigger.displayName = 'Tabs.Trigger';

/* ── Tabs.Content ── */

interface TabsContentProps {
  /** Value that identifies which tab this content belongs to */
  value: string;
  /** Panel content */
  children: ReactNode;
  /** Additional CSS class name */
  className?: string;
}

function TabsContent({ value, children, className }: TabsContentProps) {
  const { activeValue, baseId } = useTabsContext();
  const isActive = activeValue === value;

  if (!isActive) return null;

  const triggerId = `${baseId}-trigger-${value}`;
  const panelId = `${baseId}-panel-${value}`;

  const classNames = [styles.content, className].filter(Boolean).join(' ');

  return (
    <div
      id={panelId}
      role="tabpanel"
      className={classNames}
      aria-labelledby={triggerId}
      tabIndex={0}
    >
      {children}
    </div>
  );
}

TabsContent.displayName = 'Tabs.Content';

/* ── Export as compound component ── */

export const Tabs = Object.assign(TabsRoot, {
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
});
