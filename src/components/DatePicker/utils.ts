/**
 * Pure date utility functions (no external library dependency).
 */

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function formatDate(date: Date, format: string): string {
  const yyyy = String(date.getFullYear());
  const MM = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  let result = format;
  result = result.replace('yyyy', yyyy);
  result = result.replace('MM', MM);
  result = result.replace('dd', dd);
  return result;
}

export function parseDate(str: string, format: string): Date | null {
  const yearIndex = format.indexOf('yyyy');
  const monthIndex = format.indexOf('MM');
  const dayIndex = format.indexOf('dd');

  if (yearIndex === -1 || monthIndex === -1 || dayIndex === -1) return null;

  const yearStr = str.substring(yearIndex, yearIndex + 4);
  const monthStr = str.substring(monthIndex, monthIndex + 2);
  const dayStr = str.substring(dayIndex, dayIndex + 2);

  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > getDaysInMonth(year, month - 1)) return null;

  return new Date(year, month - 1, day);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isDateInRange(date: Date, min?: Date, max?: Date): boolean {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  if (min) {
    const minTime = new Date(min.getFullYear(), min.getMonth(), min.getDate()).getTime();
    if (d < minTime) return false;
  }
  if (max) {
    const maxTime = new Date(max.getFullYear(), max.getMonth(), max.getDate()).getTime();
    if (d > maxTime) return false;
  }
  return true;
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
}

export function getCalendarDays(year: number, month: number): CalendarDay[] {
  const days: CalendarDay[] = [];
  const firstDay = getFirstDayOfWeek(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const prevMonthDays = getDaysInMonth(
    month === 0 ? year - 1 : year,
    month === 0 ? 11 : month - 1,
  );

  // Fill in days from previous month
  for (let i = firstDay - 1; i >= 0; i--) {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    days.push({
      date: new Date(prevYear, prevMonth, prevMonthDays - i),
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({
      date: new Date(year, month, d),
      isCurrentMonth: true,
    });
  }

  // Fill remaining cells (up to 42 = 6 rows x 7 columns)
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    days.push({
      date: new Date(nextYear, nextMonth, d),
      isCurrentMonth: false,
    });
  }

  return days;
}

/** Returns short day-of-week labels based on locale */
export function getDayLabels(locale: string): string[] {
  if (locale.startsWith('ko')) {
    return ['일', '월', '화', '수', '목', '금', '토'];
  }
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
}

/** Returns month name for display */
export function getMonthLabel(month: number, locale: string): string {
  const date = new Date(2000, month, 1);
  return date.toLocaleString(locale, { month: 'long' });
}

/** Check if a date falls between start and end (inclusive) */
export function isDateBetween(date: Date, start: Date, end: Date): boolean {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  const min = Math.min(s, e);
  const max = Math.max(s, e);
  return d >= min && d <= max;
}
