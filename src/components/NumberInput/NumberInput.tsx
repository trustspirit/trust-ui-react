import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { Field, fieldSurfaceClassName } from '../Field';
import { useTouchDevice } from '../../hooks/touch/useTouchDevice';
import styles from './NumberInput.module.css';

type NativeInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange' | 'size' | 'min' | 'max' | 'step' | 'type' | 'role'
>;

export interface NumberInputProps extends NativeInputProps {
  /** Controlled value. `null` means empty. */
  value?: number | null;
  /** Initial value (uncontrolled) */
  defaultValue?: number | null;
  /** Called with the parsed number while typing, and with the clamped, rounded number on blur and stepping. `null` when empty. */
  onChange?: (value: number | null) => void;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Amount added or removed by the arrow keys and stepper buttons */
  step?: number;
  /** Number of decimal places kept. Defaults to the decimal places of `step`. */
  precision?: number;
  /** Label displayed above the input */
  label: ReactNode;
  /** Hides the label visually. It remains the accessible name. */
  hideLabel?: boolean;
  /** Helper text displayed below the input */
  helperText?: ReactNode;
  /** Whether the field is in error state */
  error?: boolean;
  /** Error message displayed below the input */
  errorMessage?: ReactNode;
  /** Whether the field is required (shows an asterisk) */
  required?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Whether the value can be read but not changed */
  readOnly?: boolean;
  /** Size of the field */
  size?: 'sm' | 'md' | 'lg';
  /** Visual variant */
  variant?: 'outlined' | 'filled';
  /** Stretches the field to fill its container */
  fullWidth?: boolean;
  /** Unit shown after the number (e.g. "kg") */
  units?: ReactNode;
  /** Shows the stepper buttons. Defaults to true; always hidden on touch devices. */
  showSteppers?: boolean;
  /** Formats the value while the input is not focused. The raw number is shown while editing. */
  formatOptions?: Intl.NumberFormatOptions;
  /** Locale used with `formatOptions` */
  locale?: string;
  /** Accessible name of the increment button */
  incrementLabel?: string;
  /** Accessible name of the decrement button */
  decrementLabel?: string;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

/** 소수 자릿수. 1e-7 같은 지수 표기도 센다. */
function decimalsOf(n: number): number {
  const s = String(n);
  const [mantissa, exponent] = s.split('e-');
  const fraction = mantissa.split('.')[1]?.length ?? 0;
  return exponent ? fraction + Number(exponent) : fraction;
}

/** toFixed 를 거쳐 0.1 + 0.2 = 0.30000000000000004 같은 꼬리를 잘라 낸다. */
function roundTo(value: number, precision: number): number {
  return Number(value.toFixed(Math.min(Math.max(precision, 0), 20)));
}

/** 편집용 문자열. 지수 표기(1e-7)는 사람이 고칠 수 없으니 풀어 쓴다. */
function toEditString(value: number | null, precision: number): string {
  if (value === null) return '';
  const s = String(value);
  return s.includes('e') ? value.toFixed(Math.min(Math.max(precision, 0), 20)) : s;
}

/** "-", "1.", "" 처럼 아직 숫자가 아닌 문자열은 null. */
function parseText(text: string): number | null {
  const normalized = text.replace(',', '.');
  if (!/\d/.test(normalized)) return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

// 누르고 있을 때의 반복: 첫 반복 전에는 길게 쉬어 한 번 누르기와 구분한다.
const REPEAT_DELAY = 400;
const REPEAT_INTERVAL = 60;

function StepIcon({ up }: { up: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points={up ? '6 15 12 9 18 15' : '6 9 12 15 18 9'} />
    </svg>
  );
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value: controlledValue,
      defaultValue = null,
      onChange,
      min,
      max,
      step = 1,
      precision: precisionProp,
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
      units,
      showSteppers = true,
      formatOptions,
      locale,
      incrementLabel = 'Increase',
      decrementLabel = 'Decrease',
      className,
      style,
      id,
      name,
      onFocus,
      onBlur,
      onKeyDown,
      ...rest
    },
    ref,
  ) => {
    const isTouch = useTouchDevice();
    const precision = precisionProp ?? decimalsOf(step);

    const [internalValue, setInternalValue] = useState<number | null>(defaultValue);
    const isControlled = controlledValue !== undefined;
    const current = isControlled ? controlledValue : internalValue;

    const [focused, setFocused] = useState(false);
    const [text, setText] = useState('');

    // 타이머(누르고 있기)에서 읽는 최신 값.
    const currentRef = useRef(current);
    currentRef.current = current;

    const formatter = useMemo(
      () => (formatOptions ? new Intl.NumberFormat(locale, formatOptions) : null),
      [locale, formatOptions],
    );
    const formatted =
      current === null ? '' : formatter ? formatter.format(current) : toEditString(current, precision);

    const clamp = useCallback(
      (n: number) => {
        let next = n;
        if (min !== undefined && next < min) next = min;
        if (max !== undefined && next > max) next = max;
        return next;
      },
      [min, max],
    );

    const commit = (next: number | null) => {
      if (!isControlled) setInternalValue(next);
      if (next !== currentRef.current) onChange?.(next);
    };

    // 편집 중에 값이 밖에서 바뀌면(제어 모드) 글자도 따라간다. 단, 지금 글자가 이미
    // 그 값을 뜻하면("1." 과 1) 건드리지 않는다 — 입력 중인 문자열을 지우게 된다.
    useEffect(() => {
      if (!focused) return;
      setText((prev) => (parseText(prev) === current ? prev : toEditString(current, precision)));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current]);

    const stepBy = (direction: 1 | -1, multiplier = 1) => {
      if (disabled || readOnly) return;
      const base = currentRef.current;
      // 빈 칸에서 시작하면 0(범위 밖이면 가장 가까운 끝)에 놓는다.
      const next =
        base === null ? clamp(0) : clamp(roundTo(base + direction * step * multiplier, precision));
      setText(toEditString(next, precision));
      commit(next);
    };
    const stepByRef = useRef(stepBy);
    stepByRef.current = stepBy;

    const jumpTo = (target: number) => {
      setText(toEditString(target, precision));
      commit(target);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const nextText = e.target.value;
      // 숫자로 가는 길에 있는 문자열만 받는다: 부호, 숫자, 소수점 하나.
      // 쉼표는 소수점으로 본다 — 일부 로케일의 숫자 키패드에는 쉼표만 있다.
      const pattern = precision > 0 ? /^-?\d*(?:[.,]\d*)?$/ : /^-?\d*$/;
      if (!pattern.test(nextText)) return;
      setText(nextText);
      commit(parseText(nextText));
    };

    const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      setText(toEditString(currentRef.current, precision));
      onFocus?.(e);
    };

    const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      const parsed = parseText(text);
      commit(parsed === null ? null : clamp(roundTo(parsed, precision)));
      onBlur?.(e);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(e);
      if (e.defaultPrevented) return;
      // IME 조합 중의 keydown 은 조합기가 소비한다. 여기서 처리하면 조합이 끝난 뒤
      // 같은 키가 한 번 더 와서 두 번 움직인다.
      if (e.nativeEvent.isComposing || e.keyCode === 229) return;
      if (disabled || readOnly) return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          stepBy(1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          stepBy(-1);
          break;
        case 'PageUp':
          e.preventDefault();
          stepBy(1, 10);
          break;
        case 'PageDown':
          e.preventDefault();
          stepBy(-1, 10);
          break;
        // 범위가 없으면 갈 곳이 없다. 가로채지 않고 캐럿 이동으로 남긴다.
        case 'Home':
          if (min === undefined) break;
          e.preventDefault();
          jumpTo(min);
          break;
        case 'End':
          if (max === undefined) break;
          e.preventDefault();
          jumpTo(max);
          break;
      }
    };

    // ── 스테퍼 버튼: 누르고 있으면 반복 ──
    const repeatTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    // pointerdown 에서 이미 한 스텝 움직였으면 뒤따르는 click 은 건너뛴다.
    const pressedByPointer = useRef(false);

    const stopRepeat = useCallback(() => {
      if (repeatTimer.current !== null) {
        clearTimeout(repeatTimer.current);
        repeatTimer.current = null;
      }
    }, []);

    const startRepeat = (direction: 1 | -1) => (e: PointerEvent<HTMLButtonElement>) => {
      if (e.button > 0) return; // 주 버튼만
      pressedByPointer.current = true;
      stepByRef.current(direction);
      stopRepeat();
      const tick = () => {
        stepByRef.current(direction);
        repeatTimer.current = setTimeout(tick, REPEAT_INTERVAL);
      };
      repeatTimer.current = setTimeout(tick, REPEAT_DELAY);
    };

    const handleStepClick = (direction: 1 | -1) => () => {
      // 포인터 없이 온 click(스크린 리더의 활성화 등)만 여기서 처리한다.
      if (pressedByPointer.current) {
        pressedByPointer.current = false;
        return;
      }
      stepBy(direction);
    };

    const atMax = current !== null && max !== undefined && current >= max;
    const atMin = current !== null && min !== undefined && current <= min;

    // 한계에 닿아 버튼이 비활성화되면 pointerup 이 오지 않는다. 반복을 직접 멈춘다.
    useEffect(() => {
      if (atMax || atMin || disabled || readOnly) stopRepeat();
    }, [atMax, atMin, disabled, readOnly, stopRepeat]);
    useEffect(() => stopRepeat, [stopRepeat]);

    const steppersVisible = showSteppers && !isTouch;

    const valueText =
      current !== null && (formatter || typeof units === 'string')
        ? typeof units === 'string'
          ? `${formatted} ${units}`
          : formatted
        : undefined;

    const stepperProps = (direction: 1 | -1) => ({
      type: 'button' as const,
      // 키보드 사용자는 입력 칸에서 화살표 키를 쓴다. 탭 정지점을 늘리지 않는다.
      tabIndex: -1,
      className: styles.stepper,
      onPointerDown: startRepeat(direction),
      onPointerUp: stopRepeat,
      onPointerLeave: stopRepeat,
      onPointerCancel: stopRepeat,
      // 버튼을 눌러도 입력 칸의 포커스(와 편집 상태)를 빼앗지 않는다.
      onMouseDown: (e: React.MouseEvent) => e.preventDefault(),
      onClick: handleStepClick(direction),
    });

    return (
      <Field
        label={label}
        hideLabel={hideLabel}
        helperText={helperText}
        error={error}
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
            <input
              autoComplete="off"
              {...rest}
              {...control}
              ref={ref}
              className={styles.input}
              type="text"
              // 숫자 키패드. 소수 자리가 없으면 소수점 없는 키패드를 요청한다.
              inputMode={rest.inputMode ?? (precision > 0 ? 'decimal' : 'numeric')}
              role="spinbutton"
              aria-valuenow={current ?? undefined}
              aria-valuemin={min}
              aria-valuemax={max}
              aria-valuetext={valueText}
              readOnly={readOnly}
              value={focused ? text : formatted}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
            />
            {/* 보이는 칸은 서식된 글자를 담는다. 폼에는 서식 없는 숫자를 낸다. */}
            {name && <input type="hidden" name={name} value={current ?? ''} disabled={disabled} />}
            {units !== undefined && units !== null && <span className={styles.units}>{units}</span>}
            {steppersVisible && (
              <span className={styles.steppers}>
                <button
                  {...stepperProps(1)}
                  aria-label={incrementLabel}
                  disabled={disabled || readOnly || atMax}
                >
                  <StepIcon up />
                </button>
                <button
                  {...stepperProps(-1)}
                  aria-label={decrementLabel}
                  disabled={disabled || readOnly || atMin}
                >
                  <StepIcon up={false} />
                </button>
              </span>
            )}
          </div>
        )}
      </Field>
    );
  },
);

NumberInput.displayName = 'NumberInput';
