import { test, expect, type Page, type Locator } from '@playwright/test';

/**
 * F1/F2 회귀 가드.
 *
 * 스냅샷은 이 결함을 막아주지 못했다 — 오히려 결함이 든 렌더를 "정상"으로
 * 저장해 만들어 낸 쪽에 가깝다. 여기서는 실제로 계산된 테두리 색을 읽어
 * 위계 예산을 지킨다: 가장 진한 선(--tui-rule-strong)은 총계 행 위/아래와
 * 표를 닫는 자리, 이 둘에서만 나와야 하고 나머지는 --tui-rule 이어야 한다.
 *
 * 기대값은 하드코딩한 hex 가 아니라 같은 문서에서 실제로 계산된
 * --tui-rule / --tui-rule-strong 값이다 — 팔레트가 바뀌어도 무디고
 * 토큰이 잘못 배선되면 민감한 검사가 되게 하려는 것이다.
 *
 * Table 스토리는 autodocs 태그가 붙어 있어(Table.stories.tsx) Storybook 이
 * `#storybook-root` 바깥에 숨은 ArgsTable 프리뷰를 함께 그려 넣는다.
 * 그 프리뷰 안에도 표와 구조가 같은 마크업이 들어 있으므로 모든 검사 대상을
 * `#storybook-root` 안으로 명시적으로 좁힌다 (table-geometry.spec.ts 와 같은 함정).
 */

const ROOT = '#storybook-root';

async function open(page: Page, id: string) {
  await page.goto(`/iframe.html?id=${id}&globals=theme:light`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
}

/**
 * var(--tui-x) 토큰이 브라우저에서 실제로 계산되는 rgb(...) 값을 읽는다.
 * interaction.spec.ts 의 resolveTokenColor 와 같은 관용구다.
 */
async function resolveTokenColor(page: Page, token: string): Promise<string> {
  return page.evaluate((t) => {
    const probe = document.createElement('div');
    probe.style.borderStyle = 'solid';
    probe.style.borderWidth = '1px';
    probe.style.borderColor = `var(${t})`;
    document.body.appendChild(probe);
    const color = getComputedStyle(probe).borderTopColor;
    probe.remove();
    return color;
  }, token);
}

/** 개수부터 단언한다 — 0개인 로케이터를 그냥 넘기면 통과해 버리는 검사가 된다. */
async function countOrThrow(locator: Locator, label: string): Promise<number> {
  const count = await locator.count();
  if (count === 0) throw new Error(`측정 대상을 찾지 못했다: ${label}`);
  return count;
}

async function computed(
  locator: Locator,
  prop: 'borderTopColor' | 'borderBottomColor' | 'borderBottomStyle' | 'borderBottomWidth',
): Promise<string> {
  return locator.evaluate((el, p) => getComputedStyle(el)[p as any] as string, prop);
}

test.describe('데스크톱 1280×720 — 총계 위/아래는 굵은 선, 본문 중간은 옅은 선', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('tfoot 위/아래 테두리는 --tui-rule-strong, 중간 본문 행은 --tui-rule', async ({ page }) => {
    await open(page, 'components-table--with-summary-row');

    const strong = await resolveTokenColor(page, '--tui-rule-strong');
    const weak = await resolveTokenColor(page, '--tui-rule');

    const tfootCell = page.locator(`${ROOT} tfoot td`).first();
    await countOrThrow(page.locator(`${ROOT} tfoot td`), 'tfoot td');

    expect(await computed(tfootCell, 'borderTopColor'), '총계 위 테두리').toBe(strong);
    expect(await computed(tfootCell, 'borderBottomColor'), '총계 아래 테두리').toBe(strong);

    const bodyRows = page.locator(`${ROOT} tbody tr`);
    const bodyCount = await countOrThrow(bodyRows, 'tbody tr');
    expect(bodyCount, '중간 행을 고르려면 본문이 두 행 이상이어야 한다').toBeGreaterThan(1);

    // 마지막 행이 아닌 아무 본문 행 — 위계가 총계 자리에만 있어야 한다.
    const midCell = bodyRows.nth(0).locator('td').first();
    await countOrThrow(midCell, '중간 행의 첫 칸');
    expect(await computed(midCell, 'borderBottomColor'), '중간 행 테두리').toBe(weak);
  });
});

test.describe('390px 요약 모드 — 닫는 선과 정렬 바', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

  test('총계가 없으면 본문 마지막 요약 칸이 --tui-rule-strong 으로 닫는다', async ({ page }) => {
    await open(page, 'components-table--mobile-summary');

    const strong = await resolveTokenColor(page, '--tui-rule-strong');

    const lastSummaryCell = page.locator(`${ROOT} tbody tr:last-child td[colspan]`);
    await countOrThrow(lastSummaryCell, '본문 마지막 요약 칸');

    expect(await computed(lastSummaryCell, 'borderBottomColor'), '마지막 요약 칸이 닫는 선').toBe(
      strong,
    );
  });

  test('총계가 있으면 본문 마지막 요약 칸은 선이 없고 tfoot 요약 칸이 --tui-rule-strong 으로 위를 연다', async ({
    page,
  }) => {
    await open(page, 'components-table--with-summary-row');

    const strong = await resolveTokenColor(page, '--tui-rule-strong');

    const lastBodySummaryCell = page.locator(`${ROOT} tbody tr:last-child td[colspan]`);
    await countOrThrow(lastBodySummaryCell, '본문 마지막 요약 칸');
    const bottomStyle = await computed(lastBodySummaryCell, 'borderBottomStyle');
    const bottomWidth = await computed(lastBodySummaryCell, 'borderBottomWidth');
    expect(
      bottomStyle === 'none' || bottomWidth === '0px',
      `본문 마지막 요약 칸에 선이 남아 있다: style=${bottomStyle} width=${bottomWidth}`,
    ).toBe(true);

    const tfootSummaryCell = page.locator(`${ROOT} tfoot td[colspan]`);
    await countOrThrow(tfootSummaryCell, 'tfoot 요약 칸');
    expect(await computed(tfootSummaryCell, 'borderTopColor'), '총계 요약 칸의 여는 선').toBe(
      strong,
    );
  });

  test('정렬 바의 아래 테두리는 --tui-rule 이다 — .th 의 대역일 뿐 그보다 무거워선 안 된다', async ({
    page,
  }) => {
    await open(page, 'components-table--mobile-summary');

    const weak = await resolveTokenColor(page, '--tui-rule');

    const sortBar = page.locator(`${ROOT} button[aria-haspopup="dialog"]`);
    await countOrThrow(sortBar, '정렬 바');

    expect(await computed(sortBar, 'borderBottomColor'), '정렬 바 아래 테두리').toBe(weak);
  });
});
