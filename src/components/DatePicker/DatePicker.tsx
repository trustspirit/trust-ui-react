import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import styles from './DatePicker.module.css';
import { Calendar } from './Calendar';
import { formatDate, getMonthLabel, parseDate } from './utils';

export interface DatePickerProps {
  /** Controlled selected date */
  value?: Date | null;
  /** Default selected date (uncontrolled) */
  defaultValue?: Date | null;
  /** Callback when date changes */
  onChange?: (date: Date | null) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Visual variant */
  variant?: 'outlined' | 'filled';
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  /** Locale for day/month labels (default: 'ko-KR') */
  locale?: string;
  /** Date format string (default: 'yyyy.MM.dd') */
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

export const DatePicker = forwardRef<HTMLDivElement, DatePickerProps>(
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
      className,
      style,
    },
    ref,
  ) => {
    const isControlled = controlledValue !== undefined;
    const [internalValue, setInternalValue] = useState<Date | null>(
      defaultValue ?? null,
    );

    const selectedDate = isControlled ? controlledValue : internalValue;

    const [isOpen, setIsOpen] = useState(false);
    const [showYearGrid, setShowYearGrid] = useState(false);

    // Calendar navigation state
    const now = useMemo(() => new Date(), []);
    const [viewMonth, setViewMonth] = useState(
      selectedDate ? selectedDate.getMonth() : now.getMonth(),
    );
    const [viewYear, setViewYear] = useState(
      selectedDate ? selectedDate.getFullYear() : now.getFullYear(),
    );
    const [yearRangeStart, setYearRangeStart] = useState(
      Math.floor((selectedDate?.getFullYear() ?? now.getFullYear()) / 12) * 12,
    );

    const triggerRef = useRef<HTMLDivElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [popupStyle, setPopupStyle] = useState<CSSProperties>({});

    const isError = error || !!errorMessage;

    const displayText = useMemo(() => {
      if (!selectedDate) return '';
      return formatDate(selectedDate, dateFormat);
    }, [selectedDate, dateFormat]);

    const effectivePlaceholder = placeholder ?? dateFormat;

    // Positioning
    const updatePosition = useCallback(() => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const popupHeight = 340;
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
      setShowYearGrid(false);
      // Sync view to selected date or now
      const d = selectedDate ?? new Date();
      setViewMonth(d.getMonth());
      setViewYear(d.getFullYear());
    }, [disabled, updatePosition, selectedDate]);

    const closePopup = useCallback(() => {
      setIsOpen(false);
      setShowYearGrid(false);
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

    // Keyboard
    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        closePopup();
        inputRef.current?.focus();
      }
      if (e.key === 'Enter' && !isOpen) {
        e.preventDefault();
        openPopup();
      }
    };

    // Navigation
    const goToPrevMonth = useCallback(() => {
      setViewMonth((m) => {
        if (m === 0) {
          setViewYear((y) => y - 1);
          return 11;
        }
        return m - 1;
      });
    }, []);

    const goToNextMonth = useCallback(() => {
      setViewMonth((m) => {
        if (m === 11) {
          setViewYear((y) => y + 1);
          return 0;
        }
        return m + 1;
      });
    }, []);

    // Date selection
    const handleDateClick = useCallback(
      (date: Date) => {
        if (!isControlled) {
          setInternalValue(date);
        }
        onChange?.(date);
        closePopup();
      },
      [isControlled, onChange, closePopup],
    );

    // Year grid
    const handleYearClick = useCallback(
      (year: number) => {
        setViewYear(year);
        setShowYearGrid(false);
      },
      [],
    );

    // Input change (manual typing)
    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (!val) {
          if (!isControlled) setInternalValue(null);
          onChange?.(null);
          return;
        }
        const parsed = parseDate(val, dateFormat);
        if (parsed) {
          if (!isControlled) setInternalValue(parsed);
          onChange?.(parsed);
        }
      },
      [isControlled, onChange, dateFormat],
    );

    const monthYearLabel = `${viewYear}${locale.startsWith('ko') ? '년 ' : ' '}${getMonthLabel(viewMonth, locale)}`;

    // Year grid range (12 years per view)
    const yearGridYears = useMemo(() => {
      const years: number[] = [];
      for (let i = 0; i < 12; i++) {
        years.push(yearRangeStart + i);
      }
      return years;
    }, [yearRangeStart]);

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
          onKeyDown={handleKeyDown}
          tabIndex={disabled ? -1 : 0}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-disabled={disabled || undefined}
        >
          <input
            ref={inputRef}
            className={styles.input}
            type="text"
            value={displayText}
            placeholder={effectivePlaceholder}
            disabled={disabled}
            readOnly
            onChange={handleInputChange}
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
              aria-label="Date picker"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  closePopup();
                  triggerRef.current?.focus();
                }
              }}
            >
              <div className={styles.navHeader}>
                <button
                  type="button"
                  className={styles.navButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (showYearGrid) {
                      setYearRangeStart((s) => s - 12);
                    } else {
                      goToPrevMonth();
                    }
                  }}
                  aria-label="Previous"
                >
                  <ChevronLeftIcon />
                </button>
                <button
                  type="button"
                  className={styles.monthYearLabel}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowYearGrid(!showYearGrid);
                    setYearRangeStart(
                      Math.floor(viewYear / 12) * 12,
                    );
                  }}
                >
                  {showYearGrid
                    ? `${yearRangeStart} - ${yearRangeStart + 11}`
                    : monthYearLabel}
                </button>
                <button
                  type="button"
                  className={styles.navButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (showYearGrid) {
                      setYearRangeStart((s) => s + 12);
                    } else {
                      goToNextMonth();
                    }
                  }}
                  aria-label="Next"
                >
                  <ChevronRightIcon />
                </button>
              </div>

              {showYearGrid ? (
                <div className={styles.yearGrid}>
                  {yearGridYears.map((year) => {
                    const isSelected = year === viewYear;
                    const cellClass = [
                      styles.yearCell,
                      isSelected ? styles.yearCellSelected : '',
                    ]
                      .filter(Boolean)
                      .join(' ');
                    return (
                      <button
                        key={year}
                        type="button"
                        className={cellClass}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleYearClick(year);
                        }}
                      >
                        {year}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <Calendar
                  currentMonth={viewMonth}
                  currentYear={viewYear}
                  selectedDate={selectedDate}
                  minDate={minDate}
                  maxDate={maxDate}
                  onDateClick={handleDateClick}
                  locale={locale}
                />
              )}
            </div>,
            document.body,
          )}
      </div>
    );
  },
);

DatePicker.displayName = 'DatePicker';
