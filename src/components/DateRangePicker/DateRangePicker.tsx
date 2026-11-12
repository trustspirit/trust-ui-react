import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';
import styles from './DateRangePicker.module.css';
import { Calendar } from '../DatePicker/Calendar';
import { formatDate, getMonthLabel, parseDateInputValue } from '../DatePicker/utils';
import { useTouchDevice } from '../../hooks/touch/useTouchDevice';
import { Dialog } from '../Dialog';
import { useAnchoredLayer } from '../../hooks/useAnchoredLayer';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface DateRangePickerProps {
  /** Controlled selected range */
  value?: DateRange;
  /** Default selected range (uncontrolled) */
  defaultValue?: DateRange;
  /** Callback when range changes */
  onChange?: (range: DateRange) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Visual variant */
  variant?: 'outlined' | 'filled';
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  /** Locale for day/month labels */
  locale?: string;
  /** Date format string */
  dateFormat?: string;
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
  /** Disabled state */
  disabled?: boolean;
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Label displayed above the input */
  label?: string;
  /** Whether the field is required (shows red asterisk) */
  required?: boolean;
  /** Preset ranges */
  presets?: Array<{ label: string; range: DateRange }>;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
  /**
   * Mobile rendering strategy.
   * 'modal' (default): fullscreen Dialog with a 2-step (start → end) flow.
   * 'native': two HTML <input type="date"> elements stacked vertically.
   */
  mobileVariant?: 'modal' | 'native';
  /** Renders the calendar popover open on mount (uncontrolled). 표면 자체를 캡처하는 스토리용. */
  defaultOpen?: boolean;
}

function CalendarIcon() {
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
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ChevronLeftIcon() {
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
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon() {
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
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export const DateRangePicker = forwardRef<HTMLDivElement, DateRangePickerProps>(
  (
    {
      value: controlledValue,
      defaultValue,
      onChange,
      placeholder,
      variant = 'outlined',
      size = 'md',
      locale = 'ko-KR',
      dateFormat = 'yyyy.MM.dd',
      minDate,
      maxDate,
      disabled = false,
      error = false,
      errorMessage,
      label,
      required = false,
      presets,
      className,
      style,
      mobileVariant = 'modal',
      defaultOpen = false,
    },
    ref,
  ) => {
    const isTouch = useTouchDevice();
    const isControlled = controlledValue !== undefined;
    const [internalValue, setInternalValue] = useState<DateRange>(
      defaultValue ?? { start: null, end: null },
    );

    const selectedRange = isControlled ? controlledValue : internalValue;

    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [hoverDate, setHoverDate] = useState<Date | null>(null);
    const [selectingStart, setSelectingStart] = useState(true); // true = next click picks start

    // Mobile modal state
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mobileStep, setMobileStep] = useState<'start' | 'end'>('start');
    const [draftRange, setDraftRange] = useState<DateRange>({ start: null, end: null });

    // Mobile calendar navigation
    const now = useMemo(() => new Date(), []);
    const [mobileMonth, setMobileMonth] = useState(
      selectedRange.start ? selectedRange.start.getMonth() : now.getMonth(),
    );
    const [mobileYear, setMobileYear] = useState(
      selectedRange.start ? selectedRange.start.getFullYear() : now.getFullYear(),
    );

    // Calendar navigation
    const [leftMonth, setLeftMonth] = useState(
      selectedRange.start ? selectedRange.start.getMonth() : now.getMonth(),
    );
    const [leftYear, setLeftYear] = useState(
      selectedRange.start ? selectedRange.start.getFullYear() : now.getFullYear(),
    );

    // 키보드 포커스가 있어야 할 날짜. 두 달력이 함께 받아, 자기 달이면 포커스를 가져간다.
    const [focusDate, setFocusDate] = useState<Date | null>(null);

    // Right month is always leftMonth + 1
    const rightMonth = leftMonth === 11 ? 0 : leftMonth + 1;
    const rightYear = leftMonth === 11 ? leftYear + 1 : leftYear;

    const triggerRef = useRef<HTMLDivElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    // 위치·포털 대상·화면 충돌 처리는 공용 훅이 맡는다. 뷰포트 기준 fixed 좌표라
    // Dialog 안에서 열어도 dialog 의 overflow 에 잘리지 않는다.
    const layer = useAnchoredLayer({ open: isOpen, anchorRef: triggerRef, layerRef: popupRef });
    // 달력은 스크롤되는 내용이 아니므로 높이 제한은 쓰지 않는다.
    const popupStyle: CSSProperties = { ...layer.style, maxHeight: undefined };

    const isError = error || !!errorMessage;

    const displayText = useMemo(() => {
      const { start, end } = selectedRange;
      if (!start && !end) return '';
      const startStr = start ? formatDate(start, dateFormat) : '';
      const endStr = end ? formatDate(end, dateFormat) : '';
      if (startStr && endStr) return `${startStr} ~ ${endStr}`;
      if (startStr) return startStr;
      return '';
    }, [selectedRange, dateFormat]);

    const effectivePlaceholder =
      placeholder ?? `${dateFormat} ~ ${dateFormat}`;

    const openPopup = useCallback(() => {
      if (disabled) return;
      setIsOpen(true);
      setSelectingStart(true);
      setHoverDate(null);
      // Sync view to selected range
      const d = selectedRange.start ?? new Date();
      setLeftMonth(d.getMonth());
      setLeftYear(d.getFullYear());
      // 팝업은 문서 끝에 포털되므로 포커스를 직접 넣어 주지 않으면 키보드로 닿을 수 없다.
      setFocusDate(d);
    }, [disabled, selectedRange.start]);

    const closePopup = useCallback(() => {
      setIsOpen(false);
      setHoverDate(null);
      setFocusDate(null);
    }, []);

    // 키보드로 옮긴 날짜가 보이는 두 달 밖이면 보기를 그쪽으로 옮긴다.
    const handleFocusedDateChange = useCallback(
      (date: Date) => {
        setFocusDate(date);
        const monthIndex = date.getFullYear() * 12 + date.getMonth();
        const leftIndex = leftYear * 12 + leftMonth;
        if (monthIndex < leftIndex) {
          setLeftMonth(date.getMonth());
          setLeftYear(date.getFullYear());
        } else if (monthIndex > leftIndex + 1) {
          // 새 달이 오른쪽 달력에 오도록 한 달 앞을 왼쪽에 둔다.
          const left = new Date(date.getFullYear(), date.getMonth() - 1, 1);
          setLeftMonth(left.getMonth());
          setLeftYear(left.getFullYear());
        }
        // 범위 미리보기가 마우스 없이도 따라오게 한다.
        if (!selectingStart) setHoverDate(date);
      },
      [leftYear, leftMonth, selectingStart],
    );

    // Click outside
    useEffect(() => {
      if (!isOpen) return;
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as Node;
        if (
          triggerRef.current &&
          !triggerRef.current.contains(target) &&
          popupRef.current &&
          !popupRef.current.contains(target)
        ) {
          closePopup();
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, closePopup]);

    // Navigation
    // 한 setState 의 updater 안에서 다른 setState 를 부르지 않는다. StrictMode 는
    // updater 를 두 번 호출하므로 연도가 두 번 바뀐다.
    const shiftLeftMonth = useCallback(
      (delta: number) => {
        const next = new Date(leftYear, leftMonth + delta, 1);
        setLeftMonth(next.getMonth());
        setLeftYear(next.getFullYear());
      },
      [leftYear, leftMonth],
    );
    const goToPrevMonth = useCallback(() => shiftLeftMonth(-1), [shiftLeftMonth]);
    const goToNextMonth = useCallback(() => shiftLeftMonth(1), [shiftLeftMonth]);

    // Mobile calendar navigation
    const shiftMobileMonth = useCallback(
      (delta: number) => {
        const next = new Date(mobileYear, mobileMonth + delta, 1);
        setMobileMonth(next.getMonth());
        setMobileYear(next.getFullYear());
      },
      [mobileYear, mobileMonth],
    );
    const goToPrevMobileMonth = useCallback(() => shiftMobileMonth(-1), [shiftMobileMonth]);
    const goToNextMobileMonth = useCallback(() => shiftMobileMonth(1), [shiftMobileMonth]);

    // Date selection (desktop)
    const handleDateClick = useCallback(
      (date: Date) => {
        if (selectingStart) {
          // First click: set start, clear end
          const newRange: DateRange = { start: date, end: null };
          if (!isControlled) setInternalValue(newRange);
          onChange?.(newRange);
          setSelectingStart(false);
        } else {
          // Second click: set end (guard against null start in controlled mode)
          const start = selectedRange.start;
          if (!start) {
            // Parent may have reset start — restart selection
            const newRange: DateRange = { start: date, end: null };
            if (!isControlled) setInternalValue(newRange);
            onChange?.(newRange);
            return;
          }
          let newRange: DateRange;
          if (date.getTime() < start.getTime()) {
            // Swap if end < start
            newRange = { start: date, end: start };
          } else {
            newRange = { start, end: date };
          }
          if (!isControlled) setInternalValue(newRange);
          onChange?.(newRange);
          setSelectingStart(true);
          setHoverDate(null);
          closePopup();
          triggerRef.current?.focus();
        }
      },
      [selectingStart, selectedRange.start, isControlled, onChange, closePopup],
    );

    const handleDateHover = useCallback(
      (date: Date) => {
        if (!selectingStart) {
          setHoverDate(date);
        }
      },
      [selectingStart],
    );

    // Mobile date selection (2-step flow)
    const handleMobileDateClick = useCallback(
      (date: Date) => {
        if (mobileStep === 'start') {
          setDraftRange({ start: date, end: null });
          setMobileStep('end');
        } else {
          // 'end' step
          const start = draftRange.start;
          if (!start) {
            // Restart if no start
            setDraftRange({ start: date, end: null });
            setMobileStep('end');
            return;
          }
          let newRange: DateRange;
          if (date.getTime() < start.getTime()) {
            // Out-of-order: treat picked date as new start
            newRange = { start: date, end: start };
          } else {
            newRange = { start, end: date };
          }
          if (!isControlled) setInternalValue(newRange);
          onChange?.(newRange);
          setMobileOpen(false);
          setMobileStep('start');
          setDraftRange({ start: null, end: null });
        }
      },
      [mobileStep, draftRange, isControlled, onChange],
    );

    const openMobileModal = useCallback(() => {
      if (disabled) return;
      const d = selectedRange.start ?? new Date();
      setMobileMonth(d.getMonth());
      setMobileYear(d.getFullYear());
      // Initialize draftRange from current selection so pre-existing range
      // stays highlighted when reopening the modal to edit.
      setDraftRange({ start: selectedRange.start, end: selectedRange.end });
      // If both start and end already exist, default to editing the end date.
      setMobileStep(selectedRange.start && !selectedRange.end ? 'end' : 'start');
      setMobileOpen(true);
    }, [disabled, selectedRange.start, selectedRange.end]);

    const closeMobileModal = useCallback(() => {
      setMobileOpen(false);
      setMobileStep('start');
      setDraftRange({ start: null, end: null });
    }, []);

    // Preset selection
    const handlePresetClick = useCallback(
      (range: DateRange) => {
        if (!isControlled) setInternalValue(range);
        onChange?.(range);
        setSelectingStart(true);
        setHoverDate(null);
        closePopup();
      },
      [isControlled, onChange, closePopup],
    );

    const mobileMonthLabel = `${mobileYear}${locale.startsWith('ko') ? '년 ' : ' '}${getMonthLabel(mobileMonth, locale)}`;
    const leftMonthLabel = `${leftYear}${locale.startsWith('ko') ? '년 ' : ' '}${getMonthLabel(leftMonth, locale)}`;
    const rightMonthLabel = `${rightYear}${locale.startsWith('ko') ? '년 ' : ' '}${getMonthLabel(rightMonth, locale)}`;

    const containerClassNames = [
      styles.container,
      styles[variant],
      styles[size],
      isError ? styles.error : '',
      disabled ? styles.disabled : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    const wrapperClassNames = [
      styles.inputWrapper,
      isOpen ? styles.focused : '',
      isError ? styles.error : '',
      disabled ? styles.disabled : '',
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

    // Build the calendar range prop
    const calendarRange = useMemo(
      () => ({
        start: selectedRange.start,
        end: selectedRange.end,
      }),
      [selectedRange.start, selectedRange.end],
    );

    // ── Native mobile variant ──
    if (isTouch && mobileVariant === 'native') {
      const startStr = selectedRange.start
        ? formatDate(selectedRange.start, 'yyyy-MM-dd')
        : '';
      const endStr = selectedRange.end
        ? formatDate(selectedRange.end, 'yyyy-MM-dd')
        : '';
      return (
        <div ref={ref} className={containerClassNames} style={style}>
          {label && (
            <label className={labelClassNames}>
              {label}
              {required && <span className={styles.requiredAsterisk}> *</span>}
            </label>
          )}
          <div className={styles.nativeInputGroup}>
            <input
              type="date"
              className={styles.nativeInput}
              value={startStr}
              onChange={(e) => {
                const newRange: DateRange = {
                  start: e.target.value ? parseDateInputValue(e.target.value) : null,
                  end: selectedRange.end,
                };
                if (!isControlled) setInternalValue(newRange);
                onChange?.(newRange);
              }}
              disabled={disabled}
              aria-label="Start date"
            />
            <input
              type="date"
              className={styles.nativeInput}
              value={endStr}
              onChange={(e) => {
                const newRange: DateRange = {
                  start: selectedRange.start,
                  end: e.target.value ? parseDateInputValue(e.target.value) : null,
                };
                if (!isControlled) setInternalValue(newRange);
                onChange?.(newRange);
              }}
              disabled={disabled}
              aria-label="End date"
            />
          </div>
          {errorMessage && (
            <p className={styles.errorMessage} role="alert">
              {errorMessage}
            </p>
          )}
        </div>
      );
    }

    // ── Modal mobile variant ──
    if (isTouch && mobileVariant === 'modal') {
      return (
        <div ref={ref} className={containerClassNames} style={style}>
          {label && (
            <label className={labelClassNames}>
              {label}
              {required && <span className={styles.requiredAsterisk}> *</span>}
            </label>
          )}
          <button
            type="button"
            className={`${styles.mobileTrigger} ${wrapperClassNames}`}
            onClick={openMobileModal}
            disabled={disabled}
            aria-haspopup="dialog"
          >
            <input
              className={styles.input}
              type="text"
              value={displayText}
              placeholder={effectivePlaceholder}
              disabled={disabled}
              readOnly
              tabIndex={-1}
              aria-invalid={isError || undefined}
            />
            <span className={styles.calendarIcon}>
              <CalendarIcon />
            </span>
          </button>
          {errorMessage && (
            <p className={styles.errorMessage} role="alert">
              {errorMessage}
            </p>
          )}
          <Dialog
            open={mobileOpen}
            onClose={closeMobileModal}
            mobileVariant="fullscreen"
          >
            <div className={styles.stepHeader}>
              <span className={mobileStep === 'start' ? styles.stepActive : undefined}>
                Start
              </span>
              <span className={mobileStep === 'end' ? styles.stepActive : undefined}>
                End
              </span>
            </div>
            <div className={styles.mobileCalendarContainer}>
              <div className={styles.navHeader}>
                <button
                  type="button"
                  className={styles.navButton}
                  onClick={goToPrevMobileMonth}
                  aria-label="Previous month"
                >
                  <ChevronLeftIcon />
                </button>
                <span className={styles.monthYearLabel}>{mobileMonthLabel}</span>
                <button
                  type="button"
                  className={styles.navButton}
                  onClick={goToNextMobileMonth}
                  aria-label="Next month"
                >
                  <ChevronRightIcon />
                </button>
              </div>
              <p className={styles.mobileHint}>
                {mobileStep === 'start' ? 'Select start date' : 'Select end date'}
              </p>
              <Calendar
                currentMonth={mobileMonth}
                currentYear={mobileYear}
                selectedRange={draftRange}
                minDate={minDate}
                maxDate={maxDate}
                onDateClick={handleMobileDateClick}
                locale={locale}
              />
            </div>
            <div className={styles.mobileCalendarActions}>
              <button
                type="button"
                className={styles.mobileCancelButton}
                onClick={closeMobileModal}
              >
                Cancel
              </button>
            </div>
          </Dialog>
        </div>
      );
    }

    // ── Desktop (default) variant ──
    return (
      <div ref={ref} className={containerClassNames} style={style}>
        {label && (
          <label className={labelClassNames}>
            {label}
            {required && <span className={styles.requiredAsterisk}> *</span>}
          </label>
        )}

        <div
          ref={triggerRef}
          className={wrapperClassNames}
          onClick={() => {
            if (!disabled) {
              if (isOpen) closePopup();
              else openPopup();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && isOpen) {
              e.preventDefault();
              closePopup();
            }
            if ((e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') && !isOpen) {
              e.preventDefault();
              openPopup();
            }
          }}
          tabIndex={disabled ? -1 : 0}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-disabled={disabled || undefined}
        >
          <input
            className={styles.input}
            type="text"
            value={displayText}
            placeholder={effectivePlaceholder}
            disabled={disabled}
            readOnly
            tabIndex={-1}
            aria-invalid={isError || undefined}
          />
          <span className={styles.calendarIcon}>
            <CalendarIcon />
          </span>
        </div>

        {errorMessage && (
          <p className={styles.errorMessage} role="alert">
            {errorMessage}
          </p>
        )}

        {isOpen &&
          createPortal(
            <div
              ref={popupRef}
              className={styles.popup}
              style={popupStyle}
              role="dialog"
              aria-label="Date range picker"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  closePopup();
                  triggerRef.current?.focus();
                }
              }}
            >
              {presets && presets.length > 0 && (
                <div className={styles.presetsSidebar}>
                  {presets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      className={styles.presetButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePresetClick(preset.range);
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              )}

              <div className={styles.calendarsContainer}>
                {/* Left calendar */}
                <div className={styles.calendarColumn}>
                  <div className={styles.navHeader}>
                    <button
                      type="button"
                      className={styles.navButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        goToPrevMonth();
                      }}
                      aria-label="Previous month"
                    >
                      <ChevronLeftIcon />
                    </button>
                    <span className={styles.monthYearLabel}>
                      {leftMonthLabel}
                    </span>
                    <span
                      className={`${styles.navButton} ${styles.navButtonHidden}`}
                    />
                  </div>
                  <Calendar
                    currentMonth={leftMonth}
                    currentYear={leftYear}
                    selectedRange={calendarRange}
                    hoverDate={hoverDate}
                    minDate={minDate}
                    maxDate={maxDate}
                    onDateClick={handleDateClick}
                    onDateHover={handleDateHover}
                    focusedDate={focusDate}
                    onFocusedDateChange={handleFocusedDateChange}
                    locale={locale}
                  />
                </div>

                {/* Right calendar */}
                <div className={styles.calendarColumn}>
                  <div className={styles.navHeader}>
                    <span
                      className={`${styles.navButton} ${styles.navButtonHidden}`}
                    />
                    <span className={styles.monthYearLabel}>
                      {rightMonthLabel}
                    </span>
                    <button
                      type="button"
                      className={styles.navButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        goToNextMonth();
                      }}
                      aria-label="Next month"
                    >
                      <ChevronRightIcon />
                    </button>
                  </div>
                  <Calendar
                    currentMonth={rightMonth}
                    currentYear={rightYear}
                    selectedRange={calendarRange}
                    hoverDate={hoverDate}
                    minDate={minDate}
                    maxDate={maxDate}
                    onDateClick={handleDateClick}
                    onDateHover={handleDateHover}
                    focusedDate={focusDate}
                    onFocusedDateChange={handleFocusedDateChange}
                    locale={locale}
                  />
                </div>
              </div>
            </div>,
            layer.container ?? document.body,
          )}
      </div>
    );
  },
);

DateRangePicker.displayName = 'DateRangePicker';
