import type { Column, SortDirection, SortState, Tone } from './types';

/** 점 표기 경로로 중첩 값을 읽는다. 중간이 없으면 undefined 를 낸다. */
export function getNestedValue(obj: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<any>((acc, part) => (acc == null ? undefined : acc[part]), obj);
}

/**
 * 서식이 붙은 문자열에서도 부호를 읽어낸다 — "+15.73%", "-3,584,000" 처럼
 * 이미 사람이 읽을 형태로 들어온 값이 흔하기 때문이다.
 */
function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return Number.NaN;
  const cleaned = value.replace(/[^0-9.+\-]/g, '');
  return cleaned === '' ? Number.NaN : Number(cleaned);
}

export function toneOf<T>(col: Column<T>, row: T): Tone {
  const tone = col.tone;
  if (!tone || tone === 'none') return 'neutral';
  const value = getNestedValue(row, col.key);
  if (typeof tone === 'function') return tone(value, row);
  const n = toNumber(value);
  if (!Number.isFinite(n) || n === 0) return 'neutral';
  return n > 0 ? 'rise' : 'fall';
}

/** 빈 값은 방향과 무관하게 뒤로 보낸다 — 정렬을 뒤집어도 빈 칸이 위로 올라오지 않는다. */
export function compareValues(a: unknown, b: unknown): number {
  const aEmpty = a == null;
  const bEmpty = b == null;
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1;
  if (bEmpty) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
}

export function sortRows<T>(rows: T[], key: string | null, direction: SortDirection): T[] {
  if (!key || !direction) return rows;
  const sign = direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = getNestedValue(a, key);
    const bv = getNestedValue(b, key);
    // 빈 값은 방향과 무관하게 뒤에 남아야 하므로 sign 을 곱하기 전에 걸러낸다.
    if (av == null || bv == null) return compareValues(av, bv);
    return sign * compareValues(av, bv);
  });
}

/** 오름차순 → 내림차순 → 해제의 3단 순환. */
export function nextSortState(prev: SortState, key: string): SortState {
  if (prev.key !== key) return { key, direction: 'asc' };
  if (prev.direction === 'asc') return { key, direction: 'desc' };
  return { key: null, direction: null };
}

/**
 * 목록에서 열을 골라 정렬할 때의 규칙. 머리의 3단 순환(nextSortState)과 달리
 * 해제 단계가 없다 — 고른 항목을 다시 눌렀을 때 정렬이 사라지면 시트에서는
 * 무엇이 일어났는지 읽히지 않는다. 해제는 별도 항목이 맡는다.
 */
export function nextSortSelection(prev: SortState, key: string): SortState {
  if (prev.key !== key) return { key, direction: 'asc' };
  return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
}
