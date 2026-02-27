import { useMemo, type ReactNode } from 'react';
import styles from './Calendar.module.css';
import {
  getCalendarDays,
  getDayLabels,
  isSameDay,
  isDateInRange,
  isDateBetween,
} from './utils';

export interface CalendarProps {
  currentMonth: number; // 0-indexed
  currentYear: number;
  selectedDate?: Date | null;
  selectedRange?: { start: Date | null; end: Date | null };
  hoverDate?: Date | null;
  minDate?: Date;
  maxDate?: Date;
  onDateClick: (date: Date) => void;
  onDateHover?: (date: Date) => void;
  locale?: string;
  className?: string;
}

export function Calendar({
  currentMonth,
  currentYear,
  selectedDate,
  selectedRange,
  hoverDate,
  minDate,
  maxDate,
  onDateClick,
  onDateHover,
  locale = 'ko-KR',
  className,
}: CalendarProps) {
  const days = useMemo(
    () => getCalendarDays(currentYear, currentMonth),
    [currentYear, currentMonth],
  );
  const dayLabels = useMemo(() => getDayLabels(locale), [locale]);
  const today = useMemo(() => new Date(), []);

  const classNames = [styles.calendar, className].filter(Boolean).join(' ');

  // Determine effective range for highlighting
  const effectiveRange = useMemo(() => {
    if (!selectedRange) return null;
    const { start, end } = selectedRange;
    if (start && end) return { start, end };
    if (start && hoverDate) return { start, end: hoverDate };
    return null;
  }, [selectedRange, hoverDate]);

  const getDayClassNames = (
    date: Date,
    isCurrentMonth: boolean,
  ): { cellClass: string; dayClass: string } => {
    const disabled = !isDateInRange(date, minDate, maxDate);
    const isToday = isSameDay(date, today);
    const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;

    // Range logic
    let isRangeStart = false;
    let isRangeEnd = false;
    let isInRange = false;

    if (effectiveRange && effectiveRange.start && effectiveRange.end) {
      isRangeStart = isSameDay(date, effectiveRange.start);
      isRangeEnd = isSameDay(date, effectiveRange.end);
      // If start > end, swap for comparison
      isInRange = isDateBetween(date, effectiveRange.start, effectiveRange.end);
      // Re-check start/end after potential swap
      const s = effectiveRange.start.getTime();
      const e = effectiveRange.end.getTime();
      if (s > e) {
        isRangeStart = isSameDay(date, effectiveRange.end);
        isRangeEnd = isSameDay(date, effectiveRange.start);
      }
    }

    const dayClasses = [
      styles.day,
      !isCurrentMonth ? styles.dayOutside : '',
      isToday && !isSelected && !isRangeStart && !isRangeEnd ? styles.dayToday : '',
      isSelected ? styles.daySelected : '',
      isRangeStart ? styles.dayRangeStart : '',
      isRangeEnd && !isRangeStart ? styles.dayRangeEnd : '',
      isInRange && !isRangeStart && !isRangeEnd ? styles.dayInRange : '',
      disabled ? styles.dayDisabled : '',
    ]
      .filter(Boolean)
      .join(' ');

    const isSingleRange = isRangeStart && isRangeEnd;
    const cellClasses = [
      styles.dayCell,
      isInRange && !isRangeStart && !isRangeEnd ? styles.dayCellRangeMiddle : '',
      isRangeStart && !isSingleRange && isInRange ? styles.dayCellRangeStart : '',
      isRangeEnd && !isSingleRange && isInRange ? styles.dayCellRangeEnd : '',
      isSingleRange ? styles.dayCellRangeStartEnd : '',
    ]
      .filter(Boolean)
      .join(' ');

    return { cellClass: cellClasses, dayClass: dayClasses };
  };

  const rows: ReactNode[] = [];
  for (let row = 0; row < 6; row++) {
    const cells: ReactNode[] = [];
    for (let col = 0; col < 7; col++) {
      const idx = row * 7 + col;
      const { date, isCurrentMonth } = days[idx];
      const disabled = !isDateInRange(date, minDate, maxDate);
      const { cellClass, dayClass } = getDayClassNames(date, isCurrentMonth);

      cells.push(
        <div key={idx} className={cellClass}>
          <div
            className={dayClass}
            onClick={() => {
              if (!disabled) onDateClick(date);
            }}
            onMouseEnter={() => {
              if (!disabled) onDateHover?.(date);
            }}
            role="gridcell"
            aria-disabled={disabled || undefined}
            aria-selected={
              selectedDate ? isSameDay(date, selectedDate) : undefined
            }
            tabIndex={-1}
          >
            {date.getDate()}
          </div>
        </div>,
      );
    }
    rows.push(
      <div key={row} className={styles.daysGrid} role="row">
        {cells}
      </div>,
    );
  }

  return (
    <div className={classNames} role="grid" aria-label="Calendar">
      <div className={styles.weekHeader} role="row">
        {dayLabels.map((label) => (
          <div key={label} className={styles.weekLabel} role="columnheader">
            {label}
          </div>
        ))}
      </div>
      {rows}
    </div>
  );
}

Calendar.displayName = 'Calendar';
