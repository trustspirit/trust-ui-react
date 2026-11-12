import {
  forwardRef,
  useState,
  useCallback,
  useId,
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
  /** Shape of the input border */
  shape?: 'square' | 'rounded' | 'pill';
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
  /** Whether the field is required (shows red asterisk) */
  required?: boolean;
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
      shape = 'square',
      label,
      placeholder,
      helperText,
      error = false,
      errorMessage,
      required = false,
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
      id: idProp,
      ...rest
    },
    ref,
  ) => {
    const uid = useId();
    // 사용자가 id를 직접 넘기면 그 값을 쓴다. label의 htmlFor와 항상 같은 값을 참조해야 하므로
    // rest 스프레드가 뒤에서 덮어쓰지 못하도록 여기서 미리 구조분해해 둔다.
    const inputId = idProp ?? `${uid}-input`;
    const errorId = `${uid}-error`;
    const helperId = `${uid}-helper`;

    const [showPassword, setShowPassword] = useState(false);
    // defaultValue 는 타입상 number 도 허용된다. 서식 함수는 문자열만 받는다.
    const [internalValue, setInternalValue] = useState<string>(
      defaultValue === undefined || defaultValue === null ? '' : String(defaultValue),
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

    // 서식을 다시 입힌 뒤 캐럿을 되돌릴 위치. 렌더가 끝난 뒤에 적용한다.
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
        const input = e.target as HTMLInputElement;
        const selStart = input.selectionStart ?? newValue.length;
        const isSignificant = (ch: string) =>
          /\d/.test(ch) || (format === 'decimal' && ch === '.');

        let edited = newValue;
        // 캐럿 왼쪽에 있는 "의미 있는 글자"(숫자, 소수점) 수. 서식 후에도 이 수를 유지한다.
        let significantBefore = [...newValue.slice(0, selStart)].filter(isSignificant).length;

        // 구분자(쉼표·하이픈) 하나만 지워진 경우: 그대로 두면 같은 값으로 다시
        // 서식되어 아무것도 지워지지 않는다. 사용자의 의도는 그 앞 글자를 지우는 것이다.
        const previous = renderedValue;
        const removedOne = newValue.length === previous.length - 1;
        if (
          removedOne &&
          previous.slice(0, selStart) === newValue.slice(0, selStart) &&
          !isSignificant(previous[selStart]) &&
          previous.slice(selStart + 1) === newValue.slice(selStart) &&
          selStart > 0
        ) {
          edited = newValue.slice(0, selStart - 1) + newValue.slice(selStart);
          significantBefore = Math.max(0, significantBefore - 1);
        }

        const raw = getRawValue(edited);
        const formatted = getFormattedValue(raw);

        // 서식된 문자열에서 같은 수의 의미 있는 글자가 왼쪽에 오는 위치를 찾는다.
        let position = 0;
        for (let seen = 0; position < formatted.length && seen < significantBefore; position++) {
          if (isSignificant(formatted[position])) seen++;
        }
        cursorRef.current = position;

        if (!isControlled) {
          setInternalValue(formatted);
        }
        onValueChange?.(raw);

        // 이벤트를 복제하지 않는다. 스프레드 복제는 DOM 요소의 프로토타입
        // 접근자(name, id …)와 이벤트 메서드를 잃는다. 실제 input 의 값을
        // 서식된 값으로 맞춘 뒤 원본 이벤트를 그대로 넘긴다.
        input.value = formatted;
        onChange?.(e as ChangeEvent<HTMLInputElement>);
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

    // type 을 text 로 바꾸면 모바일이 일반 키보드를 띄운다. 서식에 맞는 키보드를 요청한다.
    const defaultInputMode: InputHTMLAttributes<HTMLInputElement>['inputMode'] =
      type === 'tel'
        ? 'tel'
        : format === 'decimal'
          ? 'decimal'
          : format === 'currency'
            ? 'numeric'
            : undefined;

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
      styles[`shape_${shape}`],
      isError ? styles.error : '',
      disabled ? styles.disabled : '',
      multiline ? styles.inputWrapperMultiline : '',
    ]
      .filter(Boolean)
      .join(' ');

    // 서식 있는 숫자 입력은 자릿수 정렬을 위해 등폭 클래스를 붙인다.
    const inputClassNames = [styles.input, format ? styles.numeric : '']
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
          aria-label="Show password"
          aria-pressed={showPassword}
        >
          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      ) : null;

    const effectiveSuffix = suffix ?? passwordSuffix;

    return (
      <div className={containerClassNames} style={style}>
        {label && (
          <label className={labelClassNames} htmlFor={inputId}>
            {label}
            {required && <span className={styles.requiredAsterisk}> *</span>}
          </label>
        )}
        <div className={wrapperClassNames}>
          {prefix && <span className={styles.prefix}>{prefix}</span>}
          {multiline ? (
            <textarea
              ref={ref as React.Ref<HTMLTextAreaElement>}
              id={inputId}
              className={styles.textarea}
              placeholder={placeholder}
              disabled={disabled}
              required={required}
              rows={rows}
              maxLength={maxLength}
              value={isControlled ? displayValue : internalValue}
              onChange={handleChange as (e: ChangeEvent<HTMLTextAreaElement>) => void}
              aria-invalid={isError || undefined}
              aria-describedby={
                errorMessage ? errorId : helperText ? helperId : undefined
              }
              {...(rest as TextareaBaseProps)}
            />
          ) : (
            <input
              ref={mergedRef}
              id={inputId}
              className={inputClassNames}
              type={inputType}
              placeholder={placeholder}
              disabled={disabled}
              required={required}
              inputMode={defaultInputMode}
              autoComplete={type === 'tel' ? 'tel' : undefined}
              maxLength={
                needsFormatting
                  ? undefined
                  : maxLength
              }
              value={renderedValue}
              onChange={handleChange as (e: ChangeEvent<HTMLInputElement>) => void}
              aria-invalid={isError || undefined}
              aria-describedby={
                errorMessage ? errorId : helperText ? helperId : undefined
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
              <p className={styles.errorMessage} id={errorId} role="alert">
                {errorMessage}
              </p>
            )}
            {!errorMessage && helperText && (
              <p className={styles.helperText} id={helperId}>
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
