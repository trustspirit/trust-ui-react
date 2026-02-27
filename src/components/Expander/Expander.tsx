import {
  createContext,
  useCallback,
  useContext,
  useId,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import styles from './Expander.module.css';

/* ── Context ── */

interface ExpanderContextValue {
  openItems: string[];
  toggle: (value: string) => void;
  variant: 'default' | 'bordered' | 'separated';
  baseId: string;
}

const ExpanderContext = createContext<ExpanderContextValue | null>(null);

function useExpanderContext() {
  const ctx = useContext(ExpanderContext);
  if (!ctx) {
    throw new Error(
      'Expander compound components must be used within <Expander>',
    );
  }
  return ctx;
}

interface ItemContextValue {
  value: string;
  isOpen: boolean;
  disabled: boolean;
}

const ItemContext = createContext<ItemContextValue | null>(null);

function useItemContext() {
  const ctx = useContext(ItemContext);
  if (!ctx) {
    throw new Error(
      'Expander.Trigger/Content must be used within <Expander.Item>',
    );
  }
  return ctx;
}

/* ── Expander Root ── */

export interface ExpanderProps {
  /** Single (accordion) or multiple items open at once */
  type?: 'single' | 'multiple';
  /** Initially open item(s) (uncontrolled) */
  defaultValue?: string | string[];
  /** Controlled open item(s) */
  value?: string | string[];
  /** Callback when open items change */
  onChange?: (value: string | string[]) => void;
  /** Visual variant */
  variant?: 'default' | 'bordered' | 'separated';
  /** Children */
  children: ReactNode;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
}

function normalizeValue(val: string | string[] | undefined): string[] {
  if (val === undefined) return [];
  if (Array.isArray(val)) return val;
  return [val];
}

function ExpanderRoot({
  type = 'single',
  defaultValue,
  value: controlledValue,
  onChange,
  variant = 'default',
  children,
  className,
  style,
}: ExpanderProps) {
  const [internalOpen, setInternalOpen] = useState<string[]>(
    normalizeValue(defaultValue),
  );
  const baseId = useId();

  const isControlled = controlledValue !== undefined;
  const openItems = isControlled
    ? normalizeValue(controlledValue)
    : internalOpen;

  const toggle = useCallback(
    (itemValue: string) => {
      let newOpen: string[];
      const isCurrentlyOpen = openItems.includes(itemValue);

      if (type === 'single') {
        newOpen = isCurrentlyOpen ? [] : [itemValue];
      } else {
        newOpen = isCurrentlyOpen
          ? openItems.filter((v) => v !== itemValue)
          : [...openItems, itemValue];
      }

      if (!isControlled) {
        setInternalOpen(newOpen);
      }

      // For single type, emit string; for multiple, emit array
      if (type === 'single') {
        onChange?.(newOpen.length > 0 ? newOpen[0] : '');
      } else {
        onChange?.(newOpen);
      }
    },
    [type, openItems, isControlled, onChange],
  );

  const variantClass =
    variant === 'bordered'
      ? styles.variantBordered
      : variant === 'separated'
        ? styles.variantSeparated
        : styles.variantDefault;

  const classNames = [styles.expander, variantClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <ExpanderContext.Provider value={{ openItems, toggle, variant, baseId }}>
      <div className={classNames} style={style}>
        {children}
      </div>
    </ExpanderContext.Provider>
  );
}

ExpanderRoot.displayName = 'Expander';

/* ── Expander.Item ── */

interface ExpanderItemProps {
  /** Unique value identifying this item */
  value: string;
  /** Disabled state */
  disabled?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Children (Trigger + Content) */
  children: ReactNode;
}

function ExpanderItem({
  value,
  disabled = false,
  className,
  children,
}: ExpanderItemProps) {
  const { openItems } = useExpanderContext();
  const isOpen = openItems.includes(value);

  const classNames = [
    styles.item,
    disabled ? styles.itemDisabled : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <ItemContext.Provider value={{ value, isOpen, disabled }}>
      <div className={classNames} data-state={isOpen ? 'open' : 'closed'}>
        {children}
      </div>
    </ItemContext.Provider>
  );
}

ExpanderItem.displayName = 'Expander.Item';

/* ── Expander.Trigger ── */

interface ExpanderTriggerProps {
  /** Trigger label */
  children: ReactNode;
  /** Additional CSS class */
  className?: string;
}

function ChevronIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ExpanderTrigger({ children, className }: ExpanderTriggerProps) {
  const { toggle, baseId } = useExpanderContext();
  const { value, isOpen, disabled } = useItemContext();

  const triggerId = `${baseId}-trigger-${value}`;
  const contentId = `${baseId}-content-${value}`;

  const classNames = [styles.trigger, className].filter(Boolean).join(' ');
  const chevronClassNames = [styles.chevron, isOpen ? styles.chevronOpen : '']
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      id={triggerId}
      className={classNames}
      onClick={() => {
        if (!disabled) toggle(value);
      }}
      aria-expanded={isOpen}
      aria-controls={contentId}
      disabled={disabled}
    >
      <span className={styles.triggerContent}>{children}</span>
      <span className={chevronClassNames}>
        <ChevronIcon />
      </span>
    </button>
  );
}

ExpanderTrigger.displayName = 'Expander.Trigger';

/* ── Expander.Content ── */

interface ExpanderContentProps {
  /** Content */
  children: ReactNode;
  /** Additional CSS class */
  className?: string;
}

function ExpanderContent({ children, className }: ExpanderContentProps) {
  const { baseId } = useExpanderContext();
  const { value, isOpen } = useItemContext();

  const triggerId = `${baseId}-trigger-${value}`;
  const contentId = `${baseId}-content-${value}`;

  const wrapperClassNames = [
    styles.contentWrapper,
    isOpen ? styles.contentWrapperOpen : '',
  ]
    .filter(Boolean)
    .join(' ');

  const contentClassNames = [styles.content, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      id={contentId}
      className={wrapperClassNames}
      role="region"
      aria-labelledby={triggerId}
      hidden={!isOpen ? true : undefined}
    >
      <div className={styles.contentInner}>
        <div className={contentClassNames}>{children}</div>
      </div>
    </div>
  );
}

ExpanderContent.displayName = 'Expander.Content';

/* ── Export as compound component ── */

export const Expander = Object.assign(ExpanderRoot, {
  Item: ExpanderItem,
  Trigger: ExpanderTrigger,
  Content: ExpanderContent,
});
