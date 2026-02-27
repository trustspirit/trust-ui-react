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
import { formatDate, getMonthLabel } from '../DatePicker/utils';

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
  /** Preset ranges */
  presets?: Array<{ label: string; range: DateRange }>;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
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
      presets,
      className,
      style,
    },
    ref,
  ) => {
    const isControlled = controlledValue !== undefined;
    const [internalValue, setInternalValue] = useState<DateRange>(
      defaultValue ?? { start: null, end: null },
    );

    const selectedRange = isControlled ? controlledValue : internalValue;

    const [isOpen, setIsOpen] = useState(false);
    const [hoverDate, setHoverDate] = useState<Date | null>(null);
    const [selectingStart, setSelectingStart] = useState(true); // true = next click picks start

    // Calendar navigation
    const now = useMemo(() => new Date(), []);
    const [leftMonth, setLeftMonth] = useState(
      selectedRange.start ? selectedRange.start.getMonth() : now.getMonth(),
    );
    const [leftYear, setLeftYear] = useState(
      selectedRange.start ? selectedRange.start.getFullYear() : now.getFullYear(),
    );

    // Right month is always leftMonth + 1
    const rightMonth = leftMonth === 11 ? 0 : leftMonth + 1;
    const rightYear = leftMonth === 11 ? leftYear + 1 : leftYear;

    const triggerRef = useRef<HTMLDivElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const [popupStyle, setPopupStyle] = useState<CSSProperties>({});

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

    // Positioning
    const updatePosition = useCallback(() => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const popupHeight = 380;
      const top =
        spaceBelow > popupHeight ? rect.bottom + 4 : rect.top - popupHeight - 4;
      setPopupStyle({
        position: 'fixed',
        top,
        left: rect.left,
        zIndex: 'var(--tui-z-dropdown)' as unknown as number,
      });
    }, []);

    const openPopup = useCallback(() => {
      if (disabled) return;
      updatePosition();
      setIsOpen(true);
      setSelectingStart(true);
      setHoverDate(null);
      // Sync view to selected range
      const d = selectedRange.start ?? new Date();
      setLeftMonth(d.getMonth());
      setLeftYear(d.getFullYear());
    }, [disabled, updatePosition, selectedRange.start]);

    const closePopup = useCallback(() => {
      setIsOpen(false);
      setHoverDate(null);
    }, []);

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

    // Reposition on scroll/resize
    useEffect(() => {
      if (!isOpen) return;
      const handle = () => updatePosition();
      window.addEventListener('scroll', handle, true);
      window.addEventListener('resize', handle);
      return () => {
        window.removeEventListener('scroll', handle, true);
        window.removeEventListener('resize', handle);
      };
    }, [isOpen, updatePosition]);

    // Navigation
    const goToPrevMonth = useCallback(() => {
      setLeftMonth((m) => {
        if (m === 0) {
          setLeftYear((y) => y - 1);
          return 11;
        }
        return m - 1;
      });
    }, []);

    const goToNextMonth = useCallback(() => {
      setLeftMonth((m) => {
        if (m === 11) {
          setLeftYear((y) => y + 1);
          return 0;
        }
        return m + 1;
      });
    }, []);

    // Date selection
    const handleDateClick = useCallback(
      (date: Date) => {
        if (selectingStart) {
          // First click: set start, clear end
          const newRange: DateRange = { start: date, end: null };
          if (!isControlled) setInternalValue(newRange);
          onChange?.(newRange);
          setSelectingStart(false);
        } else {
          // Second click: set end
          const start = selectedRange.start!;
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

    return (
      <div ref={ref} className={containerClassNames} style={style}>
        {label && <label className={labelClassNames}>{label}</label>}

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
            if (e.key === 'Enter' && !isOpen) {
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
                    locale={locale}
                  />
                </div>
              </div>
            </div>,
            document.body,
          )}
      </div>
    );
  },
);

DateRangePicker.displayName = 'DateRangePicker';
