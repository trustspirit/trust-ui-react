import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Field, fieldSurfaceClassName } from '../Field';
import { useTouchDevice } from '../../hooks/touch/useTouchDevice';
import styles from './TimeInput.module.css';

type NativeInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange' | 'min' | 'max' | 'step' | 'size' | 'type'
>;

export interface TimeInputProps extends NativeInputProps {
  /** Controlled value as 24-hour `'HH:mm'`. `null` means empty. */
  value?: string | null;
  /** Initial value (uncontrolled), 24-hour `'HH:mm'` */
  defaultValue?: string | null;
  /** Called with `'HH:mm'` once both hour and minute are set and within `min`/`max`; `null` while incomplete. */
  onChange?: (value: string | null) => void;
  /** Earliest allowed time, `'HH:mm'` */
  min?: string;
  /** Latest allowed time, `'HH:mm'` */
  max?: string;
  /** Minute increment used by the arrow keys and the native picker */
  step?: number;
  /** 12-hour (AM/PM) or 24-hour clock. Defaults to the convention of `locale`. */
  hourCycle?: 12 | 24;
  /** Locale used to pick the hour cycle and the AM/PM names */
  locale?: string;
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
  /** Accessible name of the hour segment */
  hourLabel?: string;
  /** Accessible name of the minute segment */
  minuteLabel?: string;
  /** Accessible name of the AM/PM segment */
  periodLabel?: string;
  /** Value text announced for a segment that has not been filled in */
  emptyValueText?: string;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

type Segment = 'hour' | 'minute' | 'period';

/**
 * 편집 중인 상태. hour 는 항상 24시간 기준이다. pm 은 hour 가 비어 있을 때만 쓰인다 —
 * 시를 정하기 전에 고른 AM/PM 을 기억해야 하기 때문이다.
 */
interface Draft {
  hour: number | null;
  minute: number | null;
  pm: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');

function parseTime(value: string | null | undefined): { hour: number; minute: number } | null {
  if (!value) return null;
  // 네이티브 입력은 step 에 따라 'HH:mm:ss' 를 줄 수 있다. 앞의 시·분만 읽는다.
  const match = /^([01]\d|2[0-3]):([0-5]\d)/.exec(value);
  return match ? { hour: Number(match[1]), minute: Number(match[2]) } : null;
}

function toDraft(value: string | null | undefined): Draft {
  const parsed = parseTime(value);
  return parsed
    ? { hour: parsed.hour, minute: parsed.minute, pm: parsed.hour >= 12 }
    : { hour: null, minute: null, pm: false };
}

const serialize = (draft: Draft): string | null =>
  draft.hour !== null && draft.minute !== null ? `${pad(draft.hour)}:${pad(draft.minute)}` : null;

/** 'HH:mm' 은 사전순 비교가 곧 시간순 비교다. */
function clampTime(time: string, min?: string, max?: string): string {
  if (min && time < min) return min;
  if (max && time > max) return max;
  return time;
}

function resolveHourCycle(locale: string | undefined): 12 | 24 {
  try {
    // hourCycle 은 ES2020 lib 에만 타입이 있다. 프로젝트 lib 설정과 무관하게 읽는다.
    const resolved = new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
    }).resolvedOptions() as Intl.ResolvedDateTimeFormatOptions & { hourCycle?: string };
    const cycle = resolved.hourCycle;
    return cycle === 'h11' || cycle === 'h12' ? 12 : 24;
  } catch {
    return 24;
  }
}

/** 로케일의 오전/오후 이름과, 그것이 시 앞에 오는지(한국어: "오후 3:00"). */
function resolvePeriod(locale: string | undefined): { am: string; pm: string; first: boolean } {
  try {
    const format = new Intl.DateTimeFormat(locale, { hour: 'numeric', hour12: true, timeZone: 'UTC' });
    const partsAt = (hour: number) => format.formatToParts(new Date(Date.UTC(2020, 0, 1, hour)));
    const name = (hour: number) => partsAt(hour).find((part) => part.type === 'dayPeriod')?.value;
    const types = partsAt(9).map((part) => part.type);
    const am = name(9);
    const pm = name(15);
    if (!am || !pm) throw new Error('no dayPeriod');
    return { am, pm, first: types.indexOf('dayPeriod') < types.indexOf('hour') };
  } catch {
    return { am: 'AM', pm: 'PM', first: false };
  }
}

export const TimeInput = forwardRef<HTMLDivElement, TimeInputProps>(
  (
    {
      value: controlledValue,
      defaultValue = null,
      onChange,
      min,
      max,
      step = 1,
      hourCycle: hourCycleProp,
      locale,
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
      hourLabel = 'Hour',
      minuteLabel = 'Minute',
      periodLabel = 'AM/PM',
      emptyValueText = 'Empty',
      className,
      style,
      id,
      name,
      onBlur,
      ...rest
    },
    ref,
  ) => {
    const useNative = useTouchDevice();

    const hourCycle = useMemo(() => hourCycleProp ?? resolveHourCycle(locale), [hourCycleProp, locale]);
    const periodNames = useMemo(() => resolvePeriod(locale), [locale]);
    const is12 = hourCycle === 12;

    const [internalValue, setInternalValue] = useState<string | null>(defaultValue);
    const isControlled = controlledValue !== undefined;
    const current = isControlled ? controlledValue : internalValue;
    const currentRef = useRef(current);
    currentRef.current = current;

    const [draft, setDraft] = useState<Draft>(() => toDraft(current));
    const draftRef = useRef(draft);
    draftRef.current = draft;

    // 값이 밖에서 바뀌면 조각도 따라간다. 단, 부분 입력(시만 있음) 중에 우리가 내보낸
    // null 이 되돌아온 것이라면 입력한 조각을 지우지 않는다.
    useEffect(() => {
      const mine = serialize(draftRef.current);
      if (current === mine) return;
      if (current === null && mine === null) return;
      // 범위 밖이라 내보내지 않은 편집은 current 를 바꾸지 않으므로 여기 오지 않는다.
      setDraft(toDraft(current));
    }, [current]);

    const emit = (next: string | null) => {
      if (next === currentRef.current) return;
      currentRef.current = next;
      if (!isControlled) setInternalValue(next);
      onChange?.(next);
    };

    const inRange = (time: string) => clampTime(time, min, max) === time;

    const update = (next: Draft) => {
      draftRef.current = next;
      setDraft(next);
      const time = serialize(next);
      // 범위 밖 값은 내보내지 않는다. 편집 도중 거쳐 가는 값일 수 있으므로(09 를 치려고 0 부터)
      // 조각은 그대로 두고 invalid 로만 표시한다. 나갈 때 가장 가까운 값으로 당긴다.
      if (time === null || inRange(time)) emit(time);
    };

    const settle = () => {
      buffer.current = { segment: null, text: '' };
      const time = serialize(draftRef.current);
      if (time === null || inRange(time)) return;
      const nearest = clampTime(time, min, max);
      update(toDraft(nearest));
    };

    const draftTime = serialize(draft);
    const outOfRange = draftTime !== null && !inRange(draftTime);

    // ── 조각 ──
    const isPm = draft.hour !== null ? draft.hour >= 12 : draft.pm;
    const hourDisplay = draft.hour === null ? null : is12 ? draft.hour % 12 || 12 : draft.hour;
    const bounds: Record<'hour' | 'minute', { min: number; max: number }> = {
      hour: is12 ? { min: 1, max: 12 } : { min: 0, max: 23 },
      minute: { min: 0, max: 59 },
    };
    const minuteStep = step >= 1 && step < 60 ? Math.round(step) : 1;

    const order: Segment[] = is12
      ? periodNames.first
        ? ['period', 'hour', 'minute']
        : ['hour', 'minute', 'period']
      : ['hour', 'minute'];

    const segmentRefs = useRef<Record<Segment, HTMLSpanElement | null>>({
      hour: null,
      minute: null,
      period: null,
    });
    // 숫자를 이어 치는 중인 조각과 지금까지 친 글자.
    const buffer = useRef<{ segment: Segment | null; text: string }>({ segment: null, text: '' });

    const focusSibling = (segment: Segment, direction: 1 | -1) => {
      const target = order[order.indexOf(segment) + direction];
      if (target) segmentRefs.current[target]?.focus();
    };

    /** 화면에 보이는 숫자(12시간제면 1–12)로 조각 값을 정한다. */
    const setNumber = (segment: 'hour' | 'minute', shown: number | null) => {
      const now = draftRef.current;
      if (segment === 'minute') {
        update({ ...now, minute: shown });
        return;
      }
      if (shown === null) {
        // 시를 비워도 AM/PM 은 기억한다.
        update({ ...now, hour: null, pm: now.hour !== null ? now.hour >= 12 : now.pm });
        return;
      }
      const pm = now.hour !== null ? now.hour >= 12 : now.pm;
      update({ ...now, hour: is12 ? (shown % 12) + (pm ? 12 : 0) : shown, pm });
    };

    const setPeriod = (pm: boolean) => {
      const now = draftRef.current;
      update({ ...now, pm, hour: now.hour === null ? null : (now.hour % 12) + (pm ? 12 : 0) });
    };

    const stepNumber = (segment: 'hour' | 'minute', direction: 1 | -1) => {
      const { min: low, max: high } = bounds[segment];
      const shown = segment === 'hour' ? hourDisplay : draftRef.current.minute;
      const size = segment === 'minute' ? minuteStep : 1;
      let next: number;
      if (shown === null) {
        next = direction === 1 ? low : high - (high % size);
      } else if (direction === 1) {
        // step 의 배수에 맞춰 올라간다(07 → 15). 끝을 넘으면 처음으로 돈다.
        next = Math.floor(shown / size) * size + size;
        if (next > high) next = low;
      } else {
        next = Math.ceil(shown / size) * size - size;
        if (next < low) next = high - (high % size);
      }
      setNumber(segment, next);
    };

    const typeDigit = (segment: 'hour' | 'minute', digit: string) => {
      const { min: low, max: high } = bounds[segment];
      let typed = buffer.current.segment === segment ? buffer.current.text + digit : digit;
      // 이어 붙인 수가 범위를 넘으면 새로 치기 시작한 것으로 본다.
      if (typed.length > 2 || Number(typed) > high) typed = digit;
      const n = Number(typed);
      buffer.current = { segment, text: typed };
      // 12시간제의 0 은 값이 아니다. 다음 자리(01–09)를 기다린다.
      if (n >= low) setNumber(segment, n);
      // 두 자리를 채웠거나, 어떤 숫자를 더 붙여도 범위를 넘으면 다음 조각으로 간다.
      if (typed.length === 2 || n * 10 > high) {
        buffer.current = { segment: null, text: '' };
        focusSibling(segment, 1);
      }
    };

    const handleSegmentKeyDown = (segment: Segment) => (e: KeyboardEvent<HTMLSpanElement>) => {
      // IME 조합 중의 keydown 은 조합기가 소비한다(한글 자판 상태에서 숫자를 치는 경우 포함).
      if (e.nativeEvent.isComposing || e.keyCode === 229) return;
      if (disabled) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      // 이동 키는 readOnly 에서도 동작한다 — 읽으려면 조각 사이를 옮길 수 있어야 한다.
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        buffer.current = { segment: null, text: '' };
        focusSibling(segment, e.key === 'ArrowRight' ? 1 : -1);
        return;
      }
      if (readOnly) return;

      if (segment === 'period') {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          setPeriod(!isPm);
        } else if (e.key.toLowerCase() === 'a') {
          e.preventDefault();
          setPeriod(false);
        } else if (e.key.toLowerCase() === 'p') {
          e.preventDefault();
          setPeriod(true);
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          focusSibling(segment, -1);
        }
        return;
      }

      if (/^\d$/.test(e.key)) {
        e.preventDefault();
        typeDigit(segment, e.key);
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowDown':
          e.preventDefault();
          buffer.current = { segment: null, text: '' };
          stepNumber(segment, e.key === 'ArrowUp' ? 1 : -1);
          break;
        case 'Home':
        case 'End':
          e.preventDefault();
          buffer.current = { segment: null, text: '' };
          setNumber(segment, e.key === 'Home' ? bounds[segment].min : bounds[segment].max);
          break;
        case ':':
          e.preventDefault();
          buffer.current = { segment: null, text: '' };
          focusSibling(segment, 1);
          break;
        case 'Backspace':
        case 'Delete': {
          e.preventDefault();
          buffer.current = { segment: null, text: '' };
          const empty = (segment === 'hour' ? draftRef.current.hour : draftRef.current.minute) === null;
          // 이미 비어 있으면 Backspace 는 앞 조각으로 간다 — 글자를 지우며 거슬러 올라가는 감각.
          if (empty && e.key === 'Backspace') focusSibling(segment, -1);
          else setNumber(segment, null);
          break;
        }
      }
    };

    const handleGroupBlur = (e: FocusEvent<HTMLDivElement>) => {
      // 조각 사이를 옮기는 중이면 아직 편집 중이다.
      if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
      settle();
    };

    const handleNativeChange = (e: ChangeEvent<HTMLInputElement>) => {
      update(toDraft(e.target.value));
    };

    const renderSegment = (segment: Segment, invalid: boolean) => {
      const common = {
        ref: (node: HTMLSpanElement | null) => {
          segmentRefs.current[segment] = node;
        },
        role: 'spinbutton',
        tabIndex: disabled ? -1 : 0,
        'aria-disabled': disabled || undefined,
        'aria-readonly': readOnly || undefined,
        'aria-invalid': invalid || undefined,
        'aria-required': required || undefined,
        onKeyDown: handleSegmentKeyDown(segment),
        onFocus: () => {
          buffer.current = { segment: null, text: '' };
        },
      } as const;

      if (segment === 'period') {
        const text = isPm ? periodNames.pm : periodNames.am;
        return (
          <span
            key="period"
            {...common}
            className={styles.segment}
            aria-label={periodLabel}
            aria-valuenow={isPm ? 1 : 0}
            aria-valuemin={0}
            aria-valuemax={1}
            aria-valuetext={text}
          >
            {text}
          </span>
        );
      }

      const shown = segment === 'hour' ? hourDisplay : draft.minute;
      const valueText =
        shown === null
          ? emptyValueText
          : segment === 'hour' && is12
            ? `${shown} ${isPm ? periodNames.pm : periodNames.am}`
            : pad(shown);
      return (
        <span
          key={segment}
          {...common}
          className={[styles.segment, shown === null ? styles.segmentEmpty : ''].filter(Boolean).join(' ')}
          aria-label={segment === 'hour' ? hourLabel : minuteLabel}
          aria-valuenow={shown ?? undefined}
          aria-valuemin={bounds[segment].min}
          aria-valuemax={bounds[segment].max}
          aria-valuetext={valueText}
        >
          {shown === null ? '--' : pad(shown)}
        </span>
      );
    };

    return (
      <Field
        ref={ref}
        label={label}
        hideLabel={hideLabel}
        helperText={helperText}
        error={error}
        errorMessage={errorMessage}
        required={required}
        disabled={disabled}
        fullWidth={fullWidth}
        // 조각 여러 개로 된 컨트롤은 <label for> 로 가리킬 수 없다. group + aria-labelledby 로 잇는다.
        group={!useNative}
        id={id}
        className={className}
        style={style}
      >
        {(control, meta) => {
          const invalid = meta.invalid || outOfRange;
          const surface = [
            fieldSurfaceClassName({ variant, error: invalid, disabled }),
            styles[size],
          ].join(' ');

          if (useNative) {
            // 터치에서는 OS 의 시간 피커가 가장 낫다.
            return (
              <div className={surface}>
                <input
                  {...rest}
                  {...control}
                  aria-invalid={invalid || undefined}
                  className={styles.native}
                  type="time"
                  name={name}
                  readOnly={readOnly}
                  value={draftTime ?? ''}
                  min={min}
                  max={max}
                  // 네이티브 step 은 초 단위다.
                  step={step * 60}
                  onChange={handleNativeChange}
                  onBlur={(e) => {
                    // iOS 피커는 min/max 를 강제하지 않는다. 나갈 때 직접 당긴다.
                    settle();
                    onBlur?.(e);
                  }}
                />
              </div>
            );
          }

          return (
            <>
              <div
                role="group"
                id={control.id}
                aria-labelledby={control['aria-labelledby']}
                aria-describedby={control['aria-describedby']}
                className={[surface, styles.segments].join(' ')}
                onBlur={handleGroupBlur}
                onMouseDown={(e) => {
                  // 조각 사이 빈 곳을 눌러도 입력 칸을 누른 것처럼 첫 조각으로 들어간다.
                  if (e.target !== e.currentTarget || disabled) return;
                  e.preventDefault();
                  segmentRefs.current[order[0]]?.focus();
                }}
              >
                {order.map((segment) =>
                  segment === 'minute' ? (
                    [
                      <span key="separator" className={styles.separator} aria-hidden="true">
                        :
                      </span>,
                      renderSegment(segment, invalid),
                    ]
                  ) : (
                    renderSegment(segment, invalid)
                  ),
                )}
              </div>
              {name && <input type="hidden" name={name} value={current ?? ''} disabled={disabled} />}
            </>
          );
        }}
      </Field>
    );
  },
);

TimeInput.displayName = 'TimeInput';
