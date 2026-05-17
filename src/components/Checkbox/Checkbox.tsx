import {
  forwardRef,
  useEffect,
  useState,
  useRef,
  useCallback,
  type InputHTMLAttributes,
} from 'react';
import styles from './Checkbox.module.css';

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Whether the checkbox is checked (controlled) */
  checked?: boolean;
  /** Initial checked state (uncontrolled) */
  defaultChecked?: boolean;
  /** Whether the checkbox shows an indeterminate state */
  indeterminate?: boolean;
  /** Change handler */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Color variant */
  variant?: 'primary' | 'secondary';
  /** Text label */
  label?: string;
  /** Whether the field is required (shows red asterisk) */
  required?: boolean;
  /** Whether the checkbox is disabled */
  disabled?: boolean;
  /** Whether the field is in error state */
  error?: boolean;
  /** Error message displayed below the checkbox */
  errorMessage?: string;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function DashIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      checked,
      defaultChecked,
      indeterminate = false,
      onChange,
      variant = 'primary',
      label,
      required = false,
      disabled = false,
      error = false,
      errorMessage,
      className,
      style,
      ...rest
    },
    ref,
  ) => {
    const internalRef = useRef<HTMLInputElement>(null);

    const mergedRef = useCallback(
      (node: HTMLInputElement | null) => {
        (internalRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
        }
      },
      [ref],
    );

    const isControlled = checked !== undefined;
    const [internalChecked, setInternalChecked] = useState(defaultChecked ?? false);
    // User-interaction clears indeterminate locally (matches native UX where
    // clicking a mixed-state checkbox commits a definite value). Parent can
    // re-assert mixed state by toggling the `indeterminate` prop.
    const [internalIndeterminate, setInternalIndeterminate] = useState(indeterminate);

    useEffect(() => {
      setInternalIndeterminate(indeterminate);
    }, [indeterminate]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setInternalIndeterminate(false);
        if (!isControlled) {
          setInternalChecked(e.target.checked);
        }
        onChange?.(e);
      },
      [isControlled, onChange],
    );

    // Sync the indeterminate property on the underlying input (HTML doesn't
    // expose it as an attribute, only as a DOM property)
    useEffect(() => {
      if (internalRef.current) {
        internalRef.current.indeterminate = internalIndeterminate;
      }
    }, [internalIndeterminate]);

    const isChecked = isControlled ? checked : internalChecked;
    const isError = error || !!errorMessage;

    const containerClassNames = [
      styles.container,
      disabled ? styles.disabled : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    const indicatorClassNames = [
      styles.indicator,
      styles[variant],
      internalIndeterminate ? styles.indeterminate : '',
      !internalIndeterminate && isChecked ? styles.checked : '',
      isError ? styles.errorState : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <span className={styles.wrapper} style={style}>
        <label className={containerClassNames}>
          <input
            ref={mergedRef}
            type="checkbox"
            className={styles.hiddenInput}
            checked={isControlled ? checked : undefined}
            defaultChecked={isControlled ? undefined : defaultChecked}
            onChange={handleChange}
            disabled={disabled}
            aria-invalid={isError || undefined}
            {...rest}
          />
          <span className={indicatorClassNames}>
            <span className={styles.checkIcon}>
              <CheckIcon />
            </span>
            <span className={styles.dashIcon}>
              <DashIcon />
            </span>
          </span>
          {label && (
            <span className={styles.label}>
              {label}
              {required && <span className={styles.requiredAsterisk}> *</span>}
            </span>
          )}
        </label>
        {errorMessage && (
          <p className={styles.errorMessage} role="alert">
            {errorMessage}
          </p>
        )}
      </span>
    );
  },
);

Checkbox.displayName = 'Checkbox';
