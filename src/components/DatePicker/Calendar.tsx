import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
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
  /**
   * The date that should hold keyboard focus. When it changes to a date in the
   * displayed month, that cell is focused. Parents use this to carry focus
   * across a month change.
   */
  focusedDate?: Date | null;
  /**
   * Called when keyboard navigation moves to another date. If the date is
   * outside the displayed month, the parent is expected to change the view
   * and pass the date back as `focusedDate`.
   */
  onFocusedDateChange?: (date: Date) => void;
  locale?: string;
  className?: string;
}

const dateKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

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
  focusedDate,
  onFocusedDateChange,
  locale = 'ko-KR',
  className,
}: CalendarProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  // 부모가 focusedDate 를 관리하지 않을 때 쓰는 내부 포커스 위치.
  const [internalFocus, setInternalFocus] = useState<Date | null>(null);
  const inMonth = (d: Date | null | undefined): d is Date =>
    !!d && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  const days = useMemo(
    () => getCalendarDays(currentYear, currentMonth),
    [currentYear, currentMonth],
  );
  const dayLabels = useMemo(() => getDayLabels(locale), [locale]);
  const today = useMemo(() => new Date(), []);

  const classNames = [styles.calendar, className].filter(Boolean).join(' ');

  const fullDateFormat = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: 'full' }),
    [locale],
  );

  // Tab 으로 들어올 수 있는 칸은 하나다(roving tabindex).
  // 우선순위: 키보드로 옮긴 위치 → 선택된 날짜 → 범위 시작 → 오늘 → 1일.
  const tabStop =
    [focusedDate, internalFocus, selectedDate, selectedRange?.start, today].find(inMonth) ??
    new Date(currentYear, currentMonth, 1);

  const focusCell = (date: Date) => {
    gridRef.current
      ?.querySelector<HTMLElement>(`[data-date="${dateKey(date)}"][data-in-month]`)
      ?.focus();
  };

  // 부모가 넘긴 focusedDate 가 이 달에 들어오면 그 칸으로 포커스를 옮긴다.
  const focusedKey = focusedDate ? dateKey(focusedDate) : null;
  useEffect(() => {
    if (inMonth(focusedDate)) focusCell(focusedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedKey, currentMonth, currentYear]);

  const moveFocus = (next: Date) => {
    onFocusedDateChange?.(next);
    if (inMonth(next)) {
      setInternalFocus(next);
      focusCell(next);
    }
    // 달 밖이면 부모가 보기를 바꾸고 focusedDate 로 되돌려 줄 때까지 기다린다.
    // 부모가 관리하지 않으면 제자리에 머문다.
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>, date: Date, disabled: boolean) => {
    const shift = (days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
    const shiftMonths = (months: number) => {
      // 31일에서 한 달 뒤가 없는 날이면 그 달의 말일로 맞춘다.
      const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
      const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
      target.setDate(Math.min(date.getDate(), lastDay));
      return target;
    };

    let next: Date | null = null;
    switch (e.key) {
      case 'ArrowLeft': next = shift(-1); break;
      case 'ArrowRight': next = shift(1); break;
      case 'ArrowUp': next = shift(-7); break;
      case 'ArrowDown': next = shift(7); break;
      case 'Home': next = shift(-date.getDay()); break;
      case 'End': next = shift(6 - date.getDay()); break;
      case 'PageUp': next = shiftMonths(e.shiftKey ? -12 : -1); break;
      case 'PageDown': next = shiftMonths(e.shiftKey ? 12 : 1); break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!disabled) onDateClick(date);
        return;
      default:
        return;
    }
    e.preventDefault();
    moveFocus(next);
  };

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
            onKeyDown={(e) => handleKeyDown(e, date, disabled)}
            role="gridcell"
            aria-label={fullDateFormat.format(date)}
            aria-current={isSameDay(date, today) ? 'date' : undefined}
            aria-disabled={disabled || undefined}
            aria-selected={
              selectedDate ? isSameDay(date, selectedDate) : undefined
            }
            data-date={dateKey(date)}
            data-in-month={isCurrentMonth ? '' : undefined}
            tabIndex={isCurrentMonth && isSameDay(date, tabStop) ? 0 : -1}
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
    <div ref={gridRef} className={classNames} role="grid" aria-label="Calendar">
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
