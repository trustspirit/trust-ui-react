import { describe, it, expect } from 'vitest';
import { computeAnchoredPosition } from '../../src/utils/anchoredPosition';

const viewport = { width: 400, height: 800 };
const rect = (left: number, top: number, width: number, height: number) => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
});

describe('computeAnchoredPosition', () => {
  it('기본은 앵커 아래, 시작 가장자리에 맞춘다', () => {
    const result = computeAnchoredPosition({
      anchor: rect(100, 100, 120, 40),
      layer: { width: 200, height: 150 },
      viewport,
    });
    expect(result).toMatchObject({ top: 144, left: 100, placement: 'bottom' });
  });

  it('아래 공간이 모자라고 위가 더 넓으면 위로 뒤집는다', () => {
    const result = computeAnchoredPosition({
      anchor: rect(100, 700, 120, 40),
      layer: { width: 200, height: 150 },
      viewport,
    });
    expect(result.placement).toBe('top');
    expect(result.top).toBe(700 - 4 - 150);
  });

  it('양쪽 다 모자라면 더 넓은 쪽에 두고 높이를 그 공간으로 제한한다', () => {
    const result = computeAnchoredPosition({
      anchor: rect(100, 300, 120, 40),
      layer: { width: 200, height: 900 },
      viewport,
    });
    // 아래: 800 - 340 = 460, 위: 300 → 아래에 둔다
    expect(result.placement).toBe('bottom');
    expect(result.maxHeight).toBe(800 - 340 - 4 - 8);
  });

  it('오른쪽으로 넘치면 화면 안으로 당긴다', () => {
    const result = computeAnchoredPosition({
      anchor: rect(300, 100, 80, 40),
      layer: { width: 200, height: 100 },
      viewport,
    });
    expect(result.left).toBe(400 - 200 - 8);
  });

  it('왼쪽으로 넘치면 화면 안으로 당긴다', () => {
    const result = computeAnchoredPosition({
      anchor: rect(10, 100, 40, 40),
      layer: { width: 200, height: 100 },
      viewport,
      align: 'end',
    });
    expect(result.left).toBe(8);
  });

  it('align="end" 는 끝 가장자리에, "center" 는 가운데에 맞춘다', () => {
    const base = { anchor: rect(150, 100, 100, 40), layer: { width: 60, height: 50 }, viewport };
    expect(computeAnchoredPosition({ ...base, align: 'end' }).left).toBe(250 - 60);
    expect(computeAnchoredPosition({ ...base, align: 'center' }).left).toBe(200 - 30);
  });

  it('placement="right" 는 옆에 두고, 공간이 없으면 왼쪽으로 뒤집는다', () => {
    const fits = computeAnchoredPosition({
      anchor: rect(50, 100, 40, 40),
      layer: { width: 100, height: 30 },
      viewport,
      placement: 'right',
      align: 'center',
    });
    expect(fits).toMatchObject({ placement: 'right', left: 94, top: 120 - 15 });

    const flipped = computeAnchoredPosition({
      anchor: rect(340, 100, 40, 40),
      layer: { width: 100, height: 30 },
      viewport,
      placement: 'right',
    });
    expect(flipped.placement).toBe('left');
    expect(flipped.left).toBe(340 - 4 - 100);
  });

  it('레이어가 화면보다 넓어도 왼쪽 여백은 지킨다', () => {
    const result = computeAnchoredPosition({
      anchor: rect(100, 100, 40, 40),
      layer: { width: 500, height: 100 },
      viewport,
    });
    expect(result.left).toBe(8);
  });

  it('RTL 에서는 start 가 오른쪽 가장자리, end 가 왼쪽 가장자리다', () => {
    const base = { anchor: rect(150, 100, 100, 40), layer: { width: 60, height: 50 }, viewport, rtl: true };
    expect(computeAnchoredPosition({ ...base, align: 'start' }).left).toBe(250 - 60);
    expect(computeAnchoredPosition({ ...base, align: 'end' }).left).toBe(150);
  });
});
