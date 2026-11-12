import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CompositionEvent,
  type CSSProperties,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import { Field, fieldSurfaceClassName } from '../Field';
import { VisuallyHidden } from '../VisuallyHidden';
import styles from './TextArea.module.css';

type NativeTextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'value' | 'defaultValue' | 'onChange' | 'rows' | 'maxLength' | 'size'
>;

export interface TextAreaProps extends NativeTextareaProps {
  /** Controlled value */
  value?: string;
  /** Initial value (uncontrolled) */
  defaultValue?: string;
  /** Native change event handler */
  onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  /** Called with the new text */
  onValueChange?: (value: string) => void;
  /** Label displayed above the textarea */
  label: ReactNode;
  /** Hides the label visually. It remains the accessible name. */
  hideLabel?: boolean;
  /** Helper text displayed below the textarea */
  helperText?: ReactNode;
  /** Whether the field is in error state */
  error?: boolean;
  /** Error message displayed below the textarea */
  errorMessage?: ReactNode;
  /** Whether the field is required (shows an asterisk) */
  required?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Whether the text can be read but not changed */
  readOnly?: boolean;
  /** Size of the field */
  size?: 'sm' | 'md' | 'lg';
  /** Visual variant */
  variant?: 'outlined' | 'filled';
  /** Stretches the field to fill its container */
  fullWidth?: boolean;
  /** Number of visible text lines when empty (the minimum height) */
  rows?: number;
  /**
   * Grows with the content up to `maxRows`, then scrolls.
   * When false the user can resize the textarea vertically.
   */
  autoResize?: boolean;
  /** Maximum number of lines before the textarea scrolls (with `autoResize`) */
  maxRows?: number;
  /** Maximum number of characters */
  maxLength?: number;
  /** Shows the character counter. Defaults to true when `maxLength` is set. */
  showCount?: boolean;
  /**
   * Text announced to assistive technology when the count is close to or over the limit.
   * Receives the current count and the limit.
   */
  countAnnouncement?: (count: number, max: number) => string;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
}

// 서버에는 레이아웃이 없다. useLayoutEffect 를 그대로 쓰면 React 18 이 SSR 에서 경고한다.
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const defaultCountAnnouncement = (count: number, max: number) => {
  const remaining = max - count;
  if (remaining < 0) return `${-remaining} ${remaining === -1 ? 'character' : 'characters'} over the limit`;
  return `${remaining} ${remaining === 1 ? 'character' : 'characters'} remaining`;
};

const px = (value: string) => {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
};

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      value: controlledValue,
      defaultValue = '',
      onChange,
      onValueChange,
      label,
      hideLabel,
      helperText,
      error = false,
      errorMessage,
      required = false,
      disabled = false,
      readOnly = false,
      size = 'md',
      variant = 'outlined',
      fullWidth = false,
      rows = 3,
      autoResize = true,
      maxRows = 8,
      maxLength,
      showCount,
      countAnnouncement = defaultCountAnnouncement,
      className,
      style,
      id,
      onCompositionStart,
      onCompositionEnd,
      'aria-describedby': describedByProp,
      ...rest
    },
    ref,
  ) => {
    const counterId = `${useId()}-count`;

    const [internalValue, setInternalValue] = useState(defaultValue);
    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : internalValue;

    const innerRef = useRef<HTMLTextAreaElement | null>(null);
    const setRefs = useCallback(
      (node: HTMLTextAreaElement | null) => {
        innerRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );

    /* ── 자동 높이 ── */

    const measure = useCallback(() => {
      const el = innerRef.current;
      if (!el) return;
      const cs = window.getComputedStyle(el);
      const lineHeight = px(cs.lineHeight) || px(cs.fontSize) * 1.5;
      const chrome =
        px(cs.paddingTop) +
        px(cs.paddingBottom) +
        (cs.boxSizing === 'border-box' ? px(cs.borderTopWidth) + px(cs.borderBottomWidth) : 0);
      const limit = lineHeight > 0 ? lineHeight * maxRows + chrome : Infinity;

      // auto 로 풀어야 줄어든 내용의 높이도 잰다. 읽기(scrollHeight)는 이 한 번뿐이다.
      el.style.height = 'auto';
      const content = el.scrollHeight;
      el.style.height = `${Math.min(content, limit)}px`;
      // 한계 안에서는 스크롤 막대가 깜빡이지 않게 숨긴다.
      el.style.overflowY = content > limit ? 'auto' : 'hidden';
    }, [maxRows]);

    useIsomorphicLayoutEffect(() => {
      const el = innerRef.current;
      if (!el) return;
      if (!autoResize) {
        // 켰다가 끈 경우: 우리가 넣은 값만 치운다.
        el.style.height = '';
        el.style.overflowY = '';
        return;
      }
      measure();
    }, [autoResize, measure, value, rows, size]);

    // 폭이 바뀌면 줄바꿈이 달라진다. 높이만 바뀐 알림은 우리가 방금 바꾼 것이므로 건너뛴다.
    useEffect(() => {
      const el = innerRef.current;
      if (!autoResize || !el || typeof ResizeObserver === 'undefined') return;
      let width = el.clientWidth;
      const observer = new ResizeObserver(() => {
        const next = el.clientWidth;
        if (next === width) return;
        width = next;
        measure();
      });
      observer.observe(el);
      return () => observer.disconnect();
    }, [autoResize, measure]);

    /* ── 글자 수 ── */

    // 조합 중에는 자모가 바뀔 때마다 길이가 오르내린다. 조합이 끝날 때까지 직전 값을 보여 준다.
    const [frozenCount, setFrozenCount] = useState<number | null>(null);
    const count = frozenCount ?? value.length;

    const counterVisible = maxLength !== undefined && (showCount ?? true);
    const over = maxLength !== undefined && count > maxLength;
    const remaining = maxLength !== undefined ? maxLength - count : Infinity;
    // 매 글자를 읽어 주면 시끄럽다. 한계에 가까워졌을 때와 넘었을 때만 알린다.
    const nearLimit =
      maxLength !== undefined && remaining <= Math.min(10, Math.ceil(maxLength * 0.2));

    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      if (!isControlled) setInternalValue(e.target.value);
      onValueChange?.(e.target.value);
      onChange?.(e);
    };

    const handleCompositionStart = (e: CompositionEvent<HTMLTextAreaElement>) => {
      setFrozenCount(value.length);
      onCompositionStart?.(e);
    };

    const handleCompositionEnd = (e: CompositionEvent<HTMLTextAreaElement>) => {
      setFrozenCount(null);
      onCompositionEnd?.(e);
    };

    return (
      <Field
        label={label}
        hideLabel={hideLabel}
        helperText={helperText}
        error={error || over}
        errorMessage={errorMessage}
        required={required}
        disabled={disabled}
        fullWidth={fullWidth}
        id={id}
        className={className}
        style={style}
      >
        {(control, meta) => (
          <div
            className={[
              fieldSurfaceClassName({ variant, error: meta.invalid, disabled }),
              styles[size],
            ].join(' ')}
          >
            <div className={styles.inner}>
              <textarea
                {...rest}
                {...control}
                ref={setRefs}
                className={[styles.textarea, autoResize ? styles.autoResize : styles.manualResize].join(' ')}
                rows={rows}
                maxLength={maxLength}
                readOnly={readOnly}
                // 제어 여부는 처음 정해진 대로 둔다. 둘 다 넘기면 React 가 경고한다.
                {...(isControlled ? { value } : { defaultValue })}
                aria-describedby={
                  [describedByProp, control['aria-describedby'], counterVisible ? counterId : undefined]
                    .filter(Boolean)
                    .join(' ') || undefined
                }
                onChange={handleChange}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
              />
              {counterVisible && (
                <>
                  <span id={counterId} className={styles.counter} data-over={over || undefined}>
                    {count}/{maxLength}
                  </span>
                  {/* 요소는 항상 DOM 에 둔다. 라이브 영역은 이미 있던 요소의 내용이 바뀔 때 읽힌다. */}
                  <VisuallyHidden role="status" aria-live="polite">
                    {nearLimit ? countAnnouncement(count, maxLength as number) : ''}
                  </VisuallyHidden>
                </>
              )}
            </div>
          </div>
        )}
      </Field>
    );
  },
);

TextArea.displayName = 'TextArea';
