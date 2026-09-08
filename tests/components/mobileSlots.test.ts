import { describe, it, expect } from 'vitest';
import { resolveMobileSlots } from '../../src/components/Table/mobileSlots';
import type { Column } from '../../src/components/Table/types';

const c = (key: string, over: Partial<Column<any>> = {}): Column<any> => ({
  key,
  header: key,
  ...over,
});

/** 스펙 9장의 예시 표 — 국내 증권 잔고. */
const portfolio: Column<any>[] = [
  c('name'),
  c('qty', { numeric: true }),
  c('avg', { numeric: true }),
  c('price', { numeric: true }),
  c('pnl', { numeric: true, tone: 'auto' }),
  c('rate', { numeric: true, tone: 'auto' }),
];

const keys = (cols: Column<any>[]) => cols.map((x) => x.key);

describe('resolveMobileSlots — 추론', () => {
  it('스펙 9장의 그림과 같은 배치를 낸다', () => {
    const l = resolveMobileSlots(portfolio);
    expect(l.primary?.key).toBe('name');
    expect(l.value?.key).toBe('price');
    expect(keys(l.secondary)).toEqual(['qty', 'avg']);
    expect(keys(l.delta)).toEqual(['pnl', 'rate']);
  });

  it('수치 열이 하나도 없으면 마지막 열이 value 가 된다', () => {
    const l = resolveMobileSlots([c('name'), c('dept'), c('title'), c('joined')]);
    expect(l.primary?.key).toBe('name');
    expect(l.value?.key).toBe('joined');
    expect(keys(l.secondary)).toEqual(['dept', 'title']);
    expect(keys(l.delta)).toEqual([]);
  });

  it('비수치 열이 하나도 없으면 첫 열이 primary 가 된다', () => {
    const l = resolveMobileSlots([c('a', { numeric: true }), c('b', { numeric: true })]);
    expect(l.primary?.key).toBe('a');
    expect(l.value?.key).toBe('b');
  });

  it('열이 하나뿐이면 primary 만 채운다', () => {
    const l = resolveMobileSlots([c('only')]);
    expect(l.primary?.key).toBe('only');
    expect(l.value).toBeUndefined();
    expect(l.secondary).toEqual([]);
    expect(l.delta).toEqual([]);
  });

  it('열이 없으면 빈 배치를 낸다', () => {
    const l = resolveMobileSlots([]);
    expect(l.primary).toBeUndefined();
    expect(l.value).toBeUndefined();
    expect(l.secondary).toEqual([]);
    expect(l.delta).toEqual([]);
  });

  it('그룹 슬롯은 최대 2개까지만 받고 나머지는 감춘다', () => {
    const many = [c('name'), c('a'), c('b'), c('d'), c('e'), c('last')];
    const l = resolveMobileSlots(many);
    expect(l.primary?.key).toBe('name');
    expect(l.value?.key).toBe('last');
    expect(keys(l.secondary)).toEqual(['a', 'b']);
    // d 와 e 는 어느 슬롯에도 들어가지 않는다
    expect(keys(l.secondary).concat(keys(l.delta))).not.toContain('d');
  });

  it('tone 이 있어도 numeric 이 아니면 delta 로 가지 않는다', () => {
    const l = resolveMobileSlots([c('name'), c('status', { tone: 'auto' }), c('n', { numeric: true })]);
    expect(keys(l.delta)).toEqual([]);
    expect(l.value?.key).toBe('n');
  });
});

describe('resolveMobileSlots — 명시적 지정', () => {
  it('명시적 지정이 추론을 이긴다', () => {
    const l = resolveMobileSlots([
      c('name'),
      c('qty', { numeric: true }),
      c('price', { numeric: true, mobileSlot: 'primary' }),
    ]);
    expect(l.primary?.key).toBe('price');
    // name 은 primary 를 뺏겼으므로 남은 규칙을 타고 secondary 로 간다
    expect(l.value?.key).toBe('qty');
    expect(keys(l.secondary)).toEqual(['name']);
  });

  it("'hidden' 으로 표시한 열은 어느 슬롯에도 들어가지 않는다", () => {
    const l = resolveMobileSlots([
      c('name'),
      c('secret', { mobileSlot: 'hidden' }),
      c('price', { numeric: true }),
    ]);
    const all = [l.primary, l.value, ...l.secondary, ...l.delta].filter(Boolean);
    expect(keys(all as Column<any>[])).not.toContain('secret');
  });

  it('일부만 지정하면 나머지는 추론이 채운다', () => {
    const l = resolveMobileSlots([
      c('name'),
      c('note', { mobileSlot: 'hidden' }),
      c('qty', { numeric: true }),
      c('price', { numeric: true }),
    ]);
    expect(l.primary?.key).toBe('name');
    expect(l.value?.key).toBe('price');
    expect(keys(l.secondary)).toEqual(['qty']);
  });

  it('primary 를 둘 지정하면 먼저 온 것만 쓴다', () => {
    const l = resolveMobileSlots([
      c('a', { mobileSlot: 'primary' }),
      c('b', { mobileSlot: 'primary' }),
    ]);
    expect(l.primary?.key).toBe('a');
    // b 는 primary 를 못 얻었으니 추론에서 제외된다 — 명시한 사람의 뜻을 되돌리지 않는다
    expect(l.value).toBeUndefined();
    expect(keys(l.secondary)).toEqual([]);
  });

  it('명시적 그룹 슬롯도 최대 2개까지만 받는다', () => {
    const l = resolveMobileSlots([
      c('a', { mobileSlot: 'delta' }),
      c('b', { mobileSlot: 'delta' }),
      c('d', { mobileSlot: 'delta' }),
    ]);
    expect(keys(l.delta)).toEqual(['a', 'b']);
  });
});
