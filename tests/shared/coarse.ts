import { expect, type Page } from '@playwright/test';

/**
 * 가드 — coarse 흉내(hasTouch: true)가 실제로 먹혔는지 값으로 확인한다.
 * setViewportSize 만으로는 폭만 좁아질 뿐 (pointer: coarse) 는 성립하지
 * 않는다. 흉내가 먹히지 않으면 density.css 의 coarse 오버라이드(행 높이
 * 64px 등)가 적용되지 않아 --tui-row-height 가 46px(데스크톱 분기)로 남고,
 * 그 아래 모든 측정·스냅샷이 조용히 데스크톱 분기를 담는 셈이 된다.
 * table-geometry.spec.ts 와 visual.spec.ts 가 이 가드를 공유한다.
 */
export async function assertCoarsePointerActive(page: Page): Promise<void> {
  const rowHeight = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--tui-row-height').trim(),
  );
  expect(rowHeight, 'pointer: coarse 흉내가 먹히지 않았다').toBe('64px');
}
