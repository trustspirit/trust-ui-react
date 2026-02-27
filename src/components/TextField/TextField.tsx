import {
  forwardRef,
  useState,
  useCallback,
  useRef,
  useEffect,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
  type ChangeEvent,
} from 'react';
import styles from './TextField.module.css';
import {
  formatTel,
  unformatTel,
  formatCurrency,
  unformatCurrency,
  formatDecimal,
  unformatDecimal,
} from './formatters';

type InputBaseProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size' | 'prefix' | 'type'
>;
type TextareaBaseProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'size' | 'prefix'
>;

export interface TextFieldProps extends InputBaseProps {
  /** Input type */
  type?: 'text' | 'tel' | 'password' | 'number' | 'email' | 'url' | 'search';
  /** Visual variant */
  variant?: 'outlined' | 'filled';
  /** Size of the field */
  size?: 'sm' | 'md' | 'lg';
  /** Label displayed above the input */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Helper text displayed below the input */
  helperText?: string;
  /** Whether the field is in error state */
  error?: boolean;
  /** Error message displayed below the input */
  errorMessage?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Stretches the field to fill its container */
  fullWidth?: boolean;
  /** Renders a textarea instead of input */
  multiline?: boolean;
  /** Number of rows for textarea */
  rows?: number;
  /** Auto-formatting for number type */
  format?: 'currency' | 'decimal';
  /** Callback with unformatted value */
  onValueChange?: (rawValue: string) => void;
  /** Content before the input */
  prefix?: ReactNode;
  /** Content after the input */
  suffix?: ReactNode;
  /** Maximum character count (shows counter) */
  maxLength?: number;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

function EyeIcon() {
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
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
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
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export const TextField = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  TextFieldProps
>(
  (
    {
      type = 'text',
      variant = 'outlined',
      size = 'md',
      label,
      placeholder,
      helperText,
      error = false,
      errorMessage,
      disabled = false,
      fullWidth = false,
      multiline = false,
      rows = 3,
      format,
      onValueChange,
      prefix,
      suffix,
      maxLength,
      className,
      style,
      value: controlledValue,
      defaultValue,
      onChange,
      ...rest
    },
    ref,
  ) => {
    const [focused, setFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [internalValue, setInternalValue] = useState<string>(
      (defaultValue as string) ?? '',
    );

    const isControlled = controlledValue !== undefined;
    const displayValue = isControlled ? String(controlledValue) : internalValue;

    const inputRef = useRef<HTMLInputElement>(null);
    const mergedRef = useCallback(
      (node: HTMLInputElement | null) => {
        (inputRef as React.MutableRefObject<HTMLInputElement | null>).current =
          node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (
            ref as React.MutableRefObject<HTMLInputElement | HTMLTextAreaElement | null>
          ).current = node;
        }
      },
      [ref],
    );

    // Determine if we need formatting
    const needsFormatting = type === 'tel' || format === 'currency' || format === 'decimal';

    const getFormattedValue = useCallback(
      (raw: string): string => {
        if (type === 'tel') return formatTel(raw);
        if (format === 'currency') return formatCurrency(raw);
        if (format === 'decimal') return formatDecimal(raw);
        return raw;
      },
      [type, format],
    );

    const getRawValue = useCallback(
      (formatted: string): string => {
        if (type === 'tel') return unformatTel(formatted);
        if (format === 'currency') return unformatCurrency(formatted);
        if (format === 'decimal') return unformatDecimal(formatted);
        return formatted;
      },
      [type, format],
    );

    // Maintain cursor position after formatting
    const cursorRef = useRef<number | null>(null);

    useEffect(() => {
      if (cursorRef.current !== null && inputRef.current && needsFormatting) {
        inputRef.current.setSelectionRange(cursorRef.current, cursorRef.current);
        cursorRef.current = null;
      }
    });

    const handleChange = (
      e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>,
    ) => {
      const newValue = e.target.value;

      if (needsFormatting && !multiline) {
        const raw = getRawValue(newValue);
        const formatted = getFormattedValue(raw);

        // Calculate new cursor position
        const input = e.target as HTMLInputElement;
        const selStart = input.selectionStart ?? 0;
        const diff = formatted.length - newValue.length;
        cursorRef.current = Math.max(0, selStart + diff);

        if (!isControlled) {
          setInternalValue(formatted);
        }
        onValueChange?.(raw);

        // Create a synthetic event with the formatted value
        const syntheticEvent = {
          ...e,
          target: { ...e.target, value: formatted },
        } as ChangeEvent<HTMLInputElement>;
        onChange?.(syntheticEvent);
      } else {
        if (!isControlled) {
          setInternalValue(newValue);
        }
        onValueChange?.(newValue);
        onChange?.(e as ChangeEvent<HTMLInputElement>);
      }
    };

    // Format the display value for formatted fields
    const renderedValue = needsFormatting && !multiline
      ? getFormattedValue(isControlled ? getRawValue(displayValue) : displayValue)
      : displayValue;

    // Format initial value
    useEffect(() => {
      if (!isControlled && needsFormatting && defaultValue) {
        setInternalValue(getFormattedValue(String(defaultValue)));
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const currentLength = (getRawValue(renderedValue) || '').length;

    // Determine effective input type
    const effectiveType =
      type === 'password' && showPassword ? 'text' : type === 'tel' ? 'text' : type;

    // For formatted number inputs, use text type
    const inputType = needsFormatting ? 'text' : effectiveType;

    const isError = error || !!errorMessage;

    const containerClassNames = [
      styles.container,
      fullWidth ? styles.fullWidth : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    const wrapperClassNames = [
      styles.inputWrapper,
      styles[variant],
      styles[size],
      focused ? styles.focused : '',
      isError ? styles.error : '',
      disabled ? styles.disabled : '',
      multiline ? styles.inputWrapperMultiline : '',
    ]
      .filter(Boolean)
      .join(' ');

    const labelClassNames = [
      styles.label,
      isError ? styles.labelError : '',
      disabled ? styles.labelDisabled : '',
    ]
      .filter(Boolean)
      .join(' ');

    const passwordSuffix =
      type === 'password' ? (
        <button
          type="button"
          className={styles.visibilityToggle}
          onClick={() => setShowPassword((prev) => !prev)}
          tabIndex={-1}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      ) : null;

    const effectiveSuffix = suffix ?? passwordSuffix;

    return (
      <div className={containerClassNames} style={style}>
        {label && <label className={labelClassNames}>{label}</label>}
        <div className={wrapperClassNames}>
          {prefix && <span className={styles.prefix}>{prefix}</span>}
          {multiline ? (
            <textarea
              ref={ref as React.Ref<HTMLTextAreaElement>}
              className={styles.textarea}
              placeholder={placeholder}
              disabled={disabled}
              rows={rows}
              maxLength={maxLength}
              value={isControlled ? displayValue : internalValue}
              onChange={handleChange as (e: ChangeEvent<HTMLTextAreaElement>) => void}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              aria-invalid={isError || undefined}
              aria-describedby={
                errorMessage ? 'error-msg' : helperText ? 'helper-text' : undefined
              }
              {...(rest as TextareaBaseProps)}
            />
          ) : (
            <input
              ref={mergedRef}
              className={styles.input}
              type={inputType}
              placeholder={placeholder}
              disabled={disabled}
              maxLength={
                needsFormatting
                  ? undefined
                  : maxLength
              }
              value={isControlled ? renderedValue : renderedValue}
              onChange={handleChange as (e: ChangeEvent<HTMLInputElement>) => void}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              aria-invalid={isError || undefined}
              aria-describedby={
                errorMessage ? 'error-msg' : helperText ? 'helper-text' : undefined
              }
              {...rest}
            />
          )}
          {effectiveSuffix && (
            <span className={styles.suffix}>{effectiveSuffix}</span>
          )}
        </div>
        <div className={styles.footer}>
          <div>
            {errorMessage && (
              <p className={styles.errorMessage} id="error-msg" role="alert">
                {errorMessage}
              </p>
            )}
            {!errorMessage && helperText && (
              <p className={styles.helperText} id="helper-text">
                {helperText}
              </p>
            )}
          </div>
          {maxLength !== undefined && (
            <span
              className={[
                styles.characterCount,
                currentLength > maxLength ? styles.characterCountOver : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  },
);

TextField.displayName = 'TextField';
