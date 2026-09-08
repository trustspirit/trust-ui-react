import { test, expect, type Page, type Locator } from '@playwright/test';

/**
 * 터치 환경을 흉내 낸다. 이 파일의 모든 단언은 pointer: coarse 분기가
 * 실제로 켜져 있다는 전제 위에 있다 — Step 2의 가드가 그것을 증명한다.
 */
test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

const MIN_TARGET = 44;

/**
 * Table 스토리는 autodocs 태그가 붙어 있어(Table.stories.tsx), Storybook이
 * 사이드바/검색 인덱스를 준비하려고 `#storybook-root` 바깥에 숨은
 * ArgsTable 프리뷰(.sb-preparing-docs)를 함께 그려 넣는다. 그 미리보기 안에도
 * 진짜 표와 구조가 같은 `<thead>`/`<tbody><td>` 가 들어 있어, 스코프 없는
 * `page.locator('thead')` 등이 실제 스토리가 아니라 그쪽까지 집어버린다
 * (interaction.spec.ts 의 ROOT 와 같은 문제 — 이미 한 번 겪은 함정이다).
 * 검사 대상을 `#storybook-root` 안으로 명시적으로 좁힌다.
 */
const ROOT = '#storybook-root';

async function open(page: Page, id: string) {
  await page.goto(`/iframe.html?id=${id}&globals=theme:light;density:compact`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);

  // 가드 — coarse 분기가 켜졌는지 값으로 확인한다. 흉내가 먹히지 않으면
  // density.css 의 오버라이드가 적용되지 않아 row-height 가 46px 로 남고,
  // 그러면 이 파일의 모든 측정이 조용히 데스크톱 분기를 재는 셈이 된다.
  // compact 를 고른 것은 이 구별이 가장 크게 벌어지기 때문이다(46 vs 64).
  const rowHeight = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--tui-row-height').trim(),
  );
  expect(rowHeight, 'pointer: coarse 흉내가 먹히지 않았다').toBe('64px');
}

/** 요소가 실제로 차지하는 사각형. 없으면 던진다 — 조용히 넘어가지 않는다. */
async function hitRect(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error(`측정 대상을 찾지 못했다: ${locator}`);
  return box;
}

test('정렬 머리 버튼은 44px 이상이다', async ({ page }) => {
  await open(page, 'components-table--mobile-scroll');

  const buttons = page.locator(`${ROOT} thead th button`);
  const count = await buttons.count();
  // 대상이 0개면 통과해 버리는 검사가 되므로 개수부터 단언한다.
  expect(count, '정렬 가능한 열이 하나도 없다').toBeGreaterThan(0);

  const heights: number[] = [];
  for (let i = 0; i < count; i += 1) {
    heights.push((await hitRect(buttons.nth(i))).height);
  }
  expect(heights.every((h) => h >= MIN_TARGET), `높이: ${heights.join(', ')}`).toBe(true);
});

test('이웃한 정렬 버튼의 히트 영역이 겹치지 않는다', async ({ page }) => {
  await open(page, 'components-table--mobile-scroll');

  const buttons = page.locator(`${ROOT} thead th button`);
  const count = await buttons.count();
  // 대상이 0개면 이중 루프가 아예 돌지 않아 overlaps 가 빈 배열로 남고,
  // 아무것도 재지 않은 채 통과해 버린다 — 개수부터 단언한다.
  expect(count, '정렬 가능한 열이 하나도 없다 — 겹침을 잴 대상이 없다').toBeGreaterThan(0);
  const rects = [];
  for (let i = 0; i < count; i += 1) rects.push(await hitRect(buttons.nth(i)));

  const overlaps: string[] = [];
  for (let i = 0; i < rects.length; i += 1) {
    for (let j = i + 1; j < rects.length; j += 1) {
      const a = rects[i];
      const b = rects[j];
      const dx = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
      const dy = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
      if (dx > 0 && dy > 0) overlaps.push(`${i}×${j}: ${dx.toFixed(2)}×${dy.toFixed(2)}px`);
    }
  }
  expect(overlaps).toEqual([]);
});

test('모바일 요약 행은 64px 이상이다', async ({ page }) => {
  await open(page, 'components-table--mobile-summary');

  const cells = page.locator(`${ROOT} tbody td[colspan]`);
  const count = await cells.count();
  expect(count, '요약 셀이 렌더링되지 않았다').toBeGreaterThan(0);

  const heights: number[] = [];
  for (let i = 0; i < count; i += 1) heights.push((await hitRect(cells.nth(i))).height);
  expect(heights.every((h) => h >= 64), `높이: ${heights.join(', ')}`).toBe(true);
});

test('요약 모드에서 데스크톱 칸은 그려지지 않는다', async ({ page }) => {
  await open(page, 'components-table--mobile-summary');

  // evaluateAll 은 빈 노드 집합을 조용히 받아들인다(.evaluate() 와 달리 던지지
  // 않는다) — 데스크톱 칸이 DOM 에 아예 없어도 visibleCells 가 0이 되어
  // "감춰짐"과 "안 그려짐"을 구분하지 못한 채 통과해 버린다. 가시성을 재기
  // 전에 대상이 실제로 존재하는지부터 단언한다.
  const totalCells = await page.locator(`${ROOT} tbody td:not([colspan])`).count();
  expect(totalCells, '데스크톱 칸이 DOM 에 아예 없다 — 감춰진 것이 아니라 안 그려진 것이다').toBeGreaterThan(0);

  // 같은 내용을 두 벌 렌더링하므로, 좁은 화면에서 한쪽이 확실히 감춰져야
  // 스크린 리더가 중복해 읽지 않는다.
  const visibleCells = await page.locator(`${ROOT} tbody td:not([colspan])`).evaluateAll(
    (nodes) => nodes.filter((n) => getComputedStyle(n).display !== 'none').length,
  );
  expect(visibleCells).toBe(0);

  const headerDisplay = await page
    .locator(`${ROOT} thead`)
    .evaluate((n) => getComputedStyle(n).display);
  expect(headerDisplay).toBe('none');
});

test('scroll 모드는 좁은 화면에서도 열을 유지한다', async ({ page }) => {
  await open(page, 'components-table--mobile-scroll');

  const headerDisplay = await page
    .locator(`${ROOT} thead`)
    .evaluate((n) => getComputedStyle(n).display);
  expect(headerDisplay).not.toBe('none');

  const summaryCells = await page.locator(`${ROOT} tbody td[colspan]`).count();
  expect(summaryCells).toBe(0);
});

test('scroll 모드의 첫 열은 스크롤해도 왼쪽에 남는다', async ({ page }) => {
  await open(page, 'components-table--mobile-scroll');

  const firstCell = page.locator(`${ROOT} tbody tr:first-child td:first-child`);
  const before = (await hitRect(firstCell)).x;

  // 오른쪽 끝까지 민다. 고정되지 않았다면 뷰포트 밖으로 밀려나 x 가 크게 준다.
  const wrapper = page.locator(`${ROOT} table`).locator('xpath=..');
  await wrapper.evaluate((n) => { n.scrollLeft = n.scrollWidth; });
  await page.waitForTimeout(100);

  const scrolled = await wrapper.evaluate((n) => n.scrollLeft);
  expect(scrolled, '가로로 스크롤되지 않아 고정 여부를 확인할 수 없다').toBeGreaterThan(0);

  const after = (await hitRect(firstCell)).x;
  expect(Math.abs(after - before), `x: ${before} → ${after}`).toBeLessThan(1);
});

test('내용이 성긴 요약 행도 64px 로 지탱된다 — 바닥이 실제로 일한다', async ({ page }) => {
  await open(page, 'components-table--mobile-summary-sparse');

  const cells = page.locator(`${ROOT} tbody td[colspan]`);
  const count = await cells.count();
  expect(count, '요약 셀이 렌더링되지 않았다').toBeGreaterThan(0);

  const heights: number[] = [];
  for (let i = 0; i < count; i += 1) heights.push((await hitRect(cells.nth(i))).height);
  expect(heights.every((h) => h >= 64), `높이: ${heights.join(', ')}`).toBe(true);
});
