import { test, expect, type Page, type Locator } from '@playwright/test';

/**
 * Task 2에서 손으로 확인했던 여섯 관찰(브라우저 콘솔에 `document.activeElement`,
 * `.focus()` 결과를 직접 찍어 본 것)을 자동 단언으로 옮긴다.
 *
 * jsdom은 `inert`를 구현하지 않는다(`'inert' in HTMLElement.prototype`이
 * jsdom v28에서 `false`) — 그래서 배경을 진짜로 격리하는 메커니즘(inert +
 * 그 위에서 `.focus()`가 조용히 no-op이 되는 것)은 jsdom 단위 테스트로는
 * 검증할 수 없다. 이 파일이 그 실제 동작을 검증하는 유일한 자리다.
 *
 * 정렬 바(390px 이하에서만 보임 — Table.module.css `@media (max-width: 640px)`)를
 * 실제로 눌러 열어야 하는 케이스가 있어 뷰포트를 좁게 고정한다. table-geometry.spec.ts
 * 와 같은 폭이다.
 */
test.use({ viewport: { width: 390, height: 844 } });

/**
 * autodocs 태그가 붙은 스토리는 Storybook이 `#storybook-root` 바깥에
 * 숨은 ArgsTable 프리뷰(.sb-preparing-docs)를 함께 그려 넣는다
 * (table-geometry.spec.ts, interaction.spec.ts에서 이미 겪은 함정) —
 * 배경 콘텐츠(정렬 바 등)를 찾을 땐 이 스코프 안으로 좁힌다.
 *
 * 다이얼로그 자신은 여기 안 쓴다: BottomSheet는 `document.body`로
 * createPortal 되어 `#storybook-root`의 형제로 렌더링된다(내부에
 * 렌더되지 않는다) — 아래 실측으로 확인했다.
 */
const ROOT = '#storybook-root';

/** 진입/퇴장 트랜지션이 끝날 시간을 번다. BottomSheet 퇴장 애니메이션은 280ms다. */
const ANIM_SETTLE = 400;

const FOCUSABLE_SELECTOR = 'button, a[href], input, select, textarea, [tabindex]';

async function gotoStory(page: Page, id: string) {
  await page.goto(`/iframe.html?id=${id}&viewMode=story`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
}

/**
 * 열려 있는 다이얼로그(시트)를 찾는다. `document.body`로 포털되므로
 * `#storybook-root` 스코프를 쓰지 않는다 — 페이지 전체에서 정확히 하나를
 * 기대하고, 못 찾으면(또는 여럿이면) 던진다. table-geometry.spec.ts의
 * hitRect와 같은 관용구: 조용히 넘어가지 않는다.
 */
async function dialog(page: Page): Promise<Locator> {
  const d = page.locator('[role="dialog"]');
  const count = await d.count();
  if (count !== 1) {
    throw new Error(
      `다이얼로그를 정확히 하나 찾지 못했다 (count=${count}) — [role="dialog"]는 document.body 로 포털되므로 #storybook-root 스코프를 쓰지 않는다.`,
    );
  }
  return d;
}

/** 디버그 메시지용 — 어떤 요소에 포커스가 있는지 사람이 읽을 수 있게 요약한다. */
async function activeElementDescription(page: Page): Promise<string> {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return '(document.body — 포커스가 없다)';
    const text = (el.textContent ?? '').trim().slice(0, 30);
    return `<${el.tagName.toLowerCase()}>"${text}"`;
  });
}

async function activeElementInside(page: Page, locator: Locator): Promise<boolean> {
  return locator.evaluate((node) => node.contains(document.activeElement));
}

interface DialogCase {
  label: string;
  /** 스토리를 열고, 시트를 연 상태로 만든다. */
  openDialog: (page: Page) => Promise<void>;
}

/**
 * 브리프가 지목한 세 대상. ActionSheet/BottomSheet의 `--open` 스토리는
 * `open`이 고정 prop이고 `onClose`가 no-op이라 실제로 닫히지 않는다(트리거
 * 버튼도 없어 배경 콘텐츠가 `#storybook-root`에 비어 있다 — 실측 확인함).
 * 그래서 이 두 스토리로는 1~3번(초기 포커스, Tab 경계, Shift+Tab 순환)만
 * 검증할 수 있고, 실제 열기/닫기와 배경 격리가 필요한 4·5번은 Table
 * 정렬 시트(진짜 state로 열고 닫히고, 배경에 정렬 바가 실재한다)로만
 * 검증한다.
 */
const DIALOG_CASES: DialogCase[] = [
  {
    label: 'ActionSheet(components-actionsheet--open)',
    openDialog: async (page) => {
      await gotoStory(page, 'components-actionsheet--open');
      await page.waitForTimeout(ANIM_SETTLE);
    },
  },
  {
    label: 'BottomSheet(components-bottomsheet--open)',
    openDialog: async (page) => {
      await gotoStory(page, 'components-bottomsheet--open');
      await page.waitForTimeout(ANIM_SETTLE);
    },
  },
  {
    label: 'Table 정렬 시트(components-table--mobile-summary)',
    openDialog: async (page) => {
      await gotoStory(page, 'components-table--mobile-summary');
      const bar = page.locator(`${ROOT} button[aria-haspopup="dialog"]`);
      await expect(bar, '정렬 바 버튼을 찾지 못했다').toHaveCount(1);
      await bar.click();
      await page.waitForTimeout(ANIM_SETTLE);
    },
  },
];

for (const dc of DIALOG_CASES) {
  test.describe(dc.label, () => {
    test('시트가 열리면 포커스가 시트 안에 있다', async ({ page }) => {
      await dc.openDialog(page);
      const d = await dialog(page);

      const inside = await activeElementInside(page, d);
      const desc = await activeElementDescription(page);
      expect(inside, `열린 직후 activeElement = ${desc} — 시트 안에 있어야 한다`).toBe(true);
    });

    test('Tab을 항목 수보다 많이 눌러도 포커스가 시트를 벗어나지 않는다', async ({ page }) => {
      await dc.openDialog(page);
      const d = await dialog(page);

      const items = d.locator(FOCUSABLE_SELECTOR);
      const count = await items.count();
      // 대상이 0개면 Tab을 아무리 눌러도 항상 통과하는 검사가 되므로 먼저 단언한다.
      expect(count, '시트 안에 포커스 가능한 요소가 하나도 없다').toBeGreaterThan(0);

      // 매 Tab 이후마다 확인한다 — 끝에서 한 번만 확인하면, 경계에서 한
      // 번 새어나간 포커스가 (시트 밖엔 포커스할 다른 요소가 전혀 없어
      // 문서 맨 앞으로 돌아오는) 브라우저 기본 동작으로 다음 Tab에서
      // 우연히 다시 시트 안으로 들어오는 경우 새는 순간 자체를 놓친다.
      for (let i = 1; i <= count + 3; i += 1) {
        await page.keyboard.press('Tab');
        const inside = await activeElementInside(page, d);
        const desc = await activeElementDescription(page);
        expect(
          inside,
          `${i}번째 Tab 후(포커스 가능 요소 ${count}개) activeElement = ${desc} — 시트를 벗어났다`,
        ).toBe(true);
      }
    });

    test('첫 항목에서 Shift+Tab 하면 마지막 항목으로 순환한다', async ({ page }) => {
      await dc.openDialog(page);
      const d = await dialog(page);

      const items = d.locator(FOCUSABLE_SELECTOR);
      const count = await items.count();
      expect(count, '시트 안에 포커스 가능한 요소가 하나도 없다').toBeGreaterThan(0);

      const beforeDesc = await activeElementDescription(page);
      await page.keyboard.press('Shift+Tab');
      const afterDesc = await activeElementDescription(page);

      const isLast = await items.nth(count - 1).evaluate((node) => node === document.activeElement);
      expect(
        isLast,
        `첫 항목(${beforeDesc})에서 Shift+Tab 후 activeElement = ${afterDesc} — 마지막 항목(총 ${count}개 중 ${count}번째)이어야 한다`,
      ).toBe(true);
    });
  });
}

test.describe('Table 정렬 시트 — 닫기 복원과 배경 격리', () => {
  async function openTableSortSheet(page: Page): Promise<Locator> {
    await gotoStory(page, 'components-table--mobile-summary');
    const bar = page.locator(`${ROOT} button[aria-haspopup="dialog"]`);
    await expect(bar, '정렬 바 버튼을 찾지 못했다').toHaveCount(1);
    await bar.click();
    await page.waitForTimeout(ANIM_SETTLE);
    return bar;
  }

  test('Escape로 닫으면 정렬 바 버튼으로 포커스가 돌아온다', async ({ page }) => {
    const bar = await openTableSortSheet(page);

    const openedDesc = await activeElementDescription(page);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(ANIM_SETTLE);
    const closedDesc = await activeElementDescription(page);

    const backOnBar = await bar.evaluate((node) => node === document.activeElement);
    expect(
      backOnBar,
      `열림 직후 = ${openedDesc}, Escape 후 = ${closedDesc} — 열기 전 포커스를 갖고 있던 정렬 바로 돌아와야 한다`,
    ).toBe(true);
  });

  test('열려 있는 동안 배경 정렬 바는 포커스할 수도, Tab으로 닿을 수도 없다', async ({ page }) => {
    const bar = await openTableSortSheet(page);
    const d = await dialog(page);

    // (a) 도달 불가는 속성이 아니라 실제 도달 가능성으로 잰다 — inert 요소는
    // .focus()를 불러도 조용히 아무 일도 일어나지 않아야 한다.
    await bar.evaluate((node) => (node as HTMLElement).focus());
    const focusedAfterProgrammaticCall = await bar.evaluate(
      (node) => node === document.activeElement,
    );
    expect(
      focusedAfterProgrammaticCall,
      '배경 정렬 바에 .focus()를 직접 호출했는데 실제로 포커스가 그리로 옮겨갔다 — inert가 걸려 있지 않다는 뜻이다',
    ).toBe(false);

    // (b) 시트 끝을 넘어서까지 Tab을 여러 번 눌러도 배경 정렬 바에는 닿지 않아야 한다.
    const items = d.locator(FOCUSABLE_SELECTOR);
    const count = await items.count();
    expect(count, '시트 안에 포커스 가능한 요소가 하나도 없다').toBeGreaterThan(0);

    for (let i = 0; i < count + 5; i += 1) {
      await page.keyboard.press('Tab');
    }
    const reachedBarByTab = await bar.evaluate((node) => node === document.activeElement);
    const desc = await activeElementDescription(page);
    expect(
      reachedBarByTab,
      `시트 안 ${count}개 항목보다 많은 ${count + 5}번 Tab을 눌렀는데 activeElement = ${desc} — 배경 정렬 바에 닿으면 안 된다`,
    ).toBe(false);
  });

  test('정렬 시트는 정렬 가능한 6개 열과 제목·닫기 버튼을 잘림 없이 보여준다', async ({ page }) => {
    await openTableSortSheet(page);
    const d = await dialog(page);

    const title = d.locator('h3', { hasText: '정렬 기준' });
    await expect(title, '시트 제목(h3 "정렬 기준")을 찾지 못했다').toHaveCount(1);

    const columnButtons = d.locator('ul > li > button');
    const columnCount = await columnButtons.count();
    expect(
      columnCount,
      `정렬 가능한 열 버튼 개수 = ${columnCount} — holdingColumns의 6개(종목/보유/평단가/현재가/평가손익/수익률)가 전부 있어야 한다`,
    ).toBe(6);

    const closeButton = d.locator('button', { hasText: '닫기' });
    await expect(closeButton, '닫기 버튼("닫기")을 찾지 못했다').toHaveCount(1);

    // 잘림 없이: 콘텐츠 스크롤 영역이 실제로 스크롤을 필요로 하지 않아야
    // 한다(스크롤이 필요하다는 것 자체는 잘림이 아니지만, 6개+제목+닫기라는
    // 적은 분량이 90vh 상한 안에서 스크롤 없이 다 보여야 한다는 것이 이
    // 컴포넌트의 약속이다 — ActionSheet.tsx 주석 "Content that still exceeds
    // the cap scrolls" 참고, 즉 여기선 그 분기를 타지 않아야 정상이다).
    const contentBox = await d.locator(':scope > div').first().boundingBox();
    if (!contentBox) throw new Error('시트 콘텐츠 영역의 사각형을 측정하지 못했다');
    const scroll = await d.locator(':scope > div').first().evaluate((node) => ({
      scrollHeight: node.scrollHeight,
      clientHeight: node.clientHeight,
    }));
    // scrollHeight/clientHeight는 각각 반올림 방향이 달라(올림/버림) 실제로는
    // 안 잘렸는데도 1~2px 차이가 나는 경우가 있다 — 서브픽셀 여유를 둔다.
    expect(
      scroll.scrollHeight,
      `콘텐츠 scrollHeight=${scroll.scrollHeight}, clientHeight=${scroll.clientHeight} — 6개 항목이 스크롤 없이 다 들어가야 하는데 넘쳤다(잘렸거나 스크롤이 필요해졌다)`,
    ).toBeLessThanOrEqual(scroll.clientHeight + 2);

    // 각 대상이 실제로 렌더된 크기(0보다 큼)를 갖고, 닫기 버튼의 아래끝이
    // 시트 사각형 안에 들어와야 한다 — 마지막 항목이 잘려 안 보이는 경우를 잡는다.
    const targets = [title, columnButtons.nth(0), columnButtons.nth(5), closeButton];
    const heights: number[] = [];
    for (const t of targets) {
      const box = await t.boundingBox();
      if (!box) throw new Error('제목/열 버튼/닫기 버튼 중 하나의 사각형을 측정하지 못했다');
      heights.push(box.height);
    }
    expect(
      heights.every((h) => h > 0),
      `제목·첫 열·마지막 열·닫기 버튼의 높이: ${heights.join(', ')} — 0보다 커야 렌더된 것이다`,
    ).toBe(true);

    const sheetBox = await d.boundingBox();
    if (!sheetBox) throw new Error('시트 자체의 사각형을 측정하지 못했다');
    const closeBox = await closeButton.boundingBox();
    if (!closeBox) throw new Error('닫기 버튼의 사각형을 측정하지 못했다');
    const closeBottom = closeBox.y + closeBox.height;
    const sheetBottom = sheetBox.y + sheetBox.height;
    expect(
      closeBottom,
      `닫기 버튼 아래끝 y=${closeBottom.toFixed(2)}, 시트 아래끝 y=${sheetBottom.toFixed(2)} — 닫기 버튼이 시트 밖으로 잘려나가면 안 된다`,
    ).toBeLessThanOrEqual(sheetBottom + 1); // 서브픽셀 반올림 여유 1px
  });
});
