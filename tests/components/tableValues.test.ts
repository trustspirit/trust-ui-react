import { describe, it, expect } from 'vitest';
import {
  getNestedValue,
  toneOf,
  compareValues,
  sortRows,
  nextSortState,
} from '../../src/components/Table/values';
import type { Column, SortState } from '../../src/components/Table/types';

const col = (over: Partial<Column<any>> = {}): Column<any> => ({
  key: 'v',
  header: 'V',
  ...over,
});

describe('getNestedValue', () => {
  it('평평한 키를 읽는다', () => {
    expect(getNestedValue({ a: 1 }, 'a')).toBe(1);
  });

  it('점 표기로 중첩 값을 읽는다', () => {
    expect(getNestedValue({ price: { close: 82400 } }, 'price.close')).toBe(82400);
  });

  it('중간이 없으면 undefined 를 낸다 — 던지지 않는다', () => {
    expect(getNestedValue({ a: 1 }, 'price.close')).toBeUndefined();
  });
});

describe('toneOf', () => {
  it('tone 을 지정하지 않으면 neutral 이다', () => {
    expect(toneOf(col(), { v: 100 })).toBe('neutral');
  });

  it("'none' 은 값과 무관하게 neutral 이다", () => {
    expect(toneOf(col({ tone: 'none' }), { v: -100 })).toBe('neutral');
  });

  it("'auto' 는 부호로 판정한다", () => {
    expect(toneOf(col({ tone: 'auto' }), { v: 3584000 })).toBe('rise');
    expect(toneOf(col({ tone: 'auto' }), { v: -1200 })).toBe('fall');
    expect(toneOf(col({ tone: 'auto' }), { v: 0 })).toBe('neutral');
  });

  it("'auto' 는 서식이 붙은 문자열에서도 부호를 읽는다", () => {
    expect(toneOf(col({ tone: 'auto' }), { v: '+15.73%' })).toBe('rise');
    expect(toneOf(col({ tone: 'auto' }), { v: '-3,584,000' })).toBe('fall');
  });

  it("'auto' 는 숫자로 읽을 수 없으면 neutral 이다", () => {
    expect(toneOf(col({ tone: 'auto' }), { v: '거래정지' })).toBe('neutral');
    expect(toneOf(col({ tone: 'auto' }), { v: null })).toBe('neutral');
  });

  it('함수 tone 은 값과 행을 함께 받는다', () => {
    const c = col({ tone: (value: any, row: any) => (row.flag ? 'fall' : 'rise') });
    expect(toneOf(c, { v: 1, flag: true })).toBe('fall');
    expect(toneOf(c, { v: 1, flag: false })).toBe('rise');
  });
});

describe('compareValues', () => {
  it('숫자는 크기로 비교한다 — 문자열 비교로 흐르지 않는다', () => {
    expect(compareValues(9, 100)).toBeLessThan(0);
  });

  it('문자열은 로캘 순서로 비교한다', () => {
    expect(compareValues('가', '나')).toBeLessThan(0);
  });

  it('null 과 undefined 는 언제나 뒤로 간다', () => {
    expect(compareValues(null, 1)).toBeGreaterThan(0);
    expect(compareValues(1, undefined)).toBeLessThan(0);
    expect(compareValues(null, undefined)).toBe(0);
  });
});

describe('sortRows', () => {
  const rows = [{ n: 9 }, { n: 100 }, { n: 20 }];

  it('방향이 null 이면 원본을 그대로 낸다', () => {
    expect(sortRows(rows, 'n', null)).toBe(rows);
  });

  it('키가 null 이면 원본을 그대로 낸다', () => {
    expect(sortRows(rows, null, 'asc')).toBe(rows);
  });

  it('오름차순으로 정렬한다', () => {
    expect(sortRows(rows, 'n', 'asc').map((r) => r.n)).toEqual([9, 20, 100]);
  });

  it('내림차순으로 정렬한다', () => {
    expect(sortRows(rows, 'n', 'desc').map((r) => r.n)).toEqual([100, 20, 9]);
  });

  it('원본 배열을 변형하지 않는다', () => {
    sortRows(rows, 'n', 'asc');
    expect(rows.map((r) => r.n)).toEqual([9, 100, 20]);
  });

  it('null 은 방향과 무관하게 뒤에 남는다', () => {
    const withNull = [{ n: 5 }, { n: null }, { n: 1 }];
    expect(sortRows(withNull, 'n', 'asc').map((r) => r.n)).toEqual([1, 5, null]);
    expect(sortRows(withNull, 'n', 'desc').map((r) => r.n)).toEqual([5, 1, null]);
  });
});

describe('nextSortState', () => {
  const none: SortState = { key: null, direction: null };

  it('처음 누르면 오름차순이다', () => {
    expect(nextSortState(none, 'n')).toEqual({ key: 'n', direction: 'asc' });
  });

  it('같은 열을 다시 누르면 내림차순이다', () => {
    expect(nextSortState({ key: 'n', direction: 'asc' }, 'n')).toEqual({
      key: 'n',
      direction: 'desc',
    });
  });

  it('세 번째로 누르면 정렬이 풀린다', () => {
    expect(nextSortState({ key: 'n', direction: 'desc' }, 'n')).toEqual({
      key: null,
      direction: null,
    });
  });

  it('다른 열을 누르면 그 열의 오름차순부터 시작한다', () => {
    expect(nextSortState({ key: 'n', direction: 'desc' }, 'm')).toEqual({
      key: 'm',
      direction: 'asc',
    });
  });
});
