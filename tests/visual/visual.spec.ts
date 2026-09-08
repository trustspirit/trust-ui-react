import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// package.json 의 "type": "module" 때문에 __dirname 을 쓸 수 없다 (CommonJS 전역).
// import.meta.url 로 동등하게 계산한다 — 브리프 원안의 __dirname 을 ESM 환경에 맞게 대체한 것.
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * 촬영 대상을 손으로 적지 않는다. Storybook 이 만든 index.json 에서 열거한다.
 *
 * 목록을 손으로 관리하면 컴포넌트를 옮기면서 목록에 넣는 걸 잊게 되고,
 * 그러면 그물이 정작 잡아야 할 것 위에 쳐지지 않는다. 자동 열거면
 * 목록과 현실이 어긋날 수 없다.
 *
 * 컴포넌트당 대표 스토리 하나만 찍어 스냅샷 수를 억제한다.
 */
const index = JSON.parse(
  readFileSync(resolve(__dirname, '../../storybook-static/index.json'), 'utf8'),
);
const entries: Record<string, { tags?: string[] }> = index.entries ?? index.stories ?? {};
const allIds: string[] = Object.keys(entries);

const byComponent = new Map<string, string>();
for (const id of allIds) {
  if (id.endsWith('--docs')) continue;
  const component = id.split('--')[0];
  const name = id.split('--')[1];
  const current = byComponent.get(component);
  // open(표면이 열린 상태) 이 있으면 그것을, 없으면 variants, 없으면 default,
  // 셋 다 없으면 첫 스토리를 쓴다. 오버레이 계열은 닫힌 트리거 버튼이 아니라
  // 실제로 바뀐 표면을 찍어야 회귀를 잡을 수 있다.
  const rank = (n: string) => (n === 'open' ? 0 : n === 'variants' ? 1 : n === 'default' ? 2 : 3);
  if (!current || rank(name) < rank(current.split('--')[1])) byComponent.set(component, id);
}

// 컴포넌트당 대표 하나만으로는 Tabs의 pill 변형처럼 대표로 뽑히지 못한
// 상태가 회귀 커버리지에서 영구히 빠진다. tags 에 'visual' 을 명시한
// 스토리는 대표 여부와 무관하게 추가로 찍는다 — opt-in 이므로 스냅샷 수가
// 무한정 늘지 않는다.
const taggedVisual = allIds.filter((id) => !id.endsWith('--docs') && (entries[id].tags ?? []).includes('visual'));

// 스냅샷 96장이 전부 데스크톱 폭이라 CSS 의 좁은 화면 분기가 한 번도
// 촬영된 적이 없다. 'visual-mobile' 을 명시한 스토리만 390px 에서 따로
// 찍는다 — opt-in 이므로 스냅샷 수가 무한정 늘지 않는다.
const MOBILE_WIDTH = 390;
const taggedMobile = allIds.filter(
  (id) => !id.endsWith('--docs') && (entries[id].tags ?? []).includes('visual-mobile'),
);

const STORIES = [...new Set([...byComponent.values(), ...taggedVisual])].sort();

const COMBOS = [
  { theme: 'light', density: 'comfortable' },
  { theme: 'dark', density: 'comfortable' },
  { theme: 'light', density: 'compact' },
];

for (const id of STORIES) {
  for (const { theme, density } of COMBOS) {
    test(`${id} — ${theme}/${density}`, async ({ page }) => {
      await page.goto(`/iframe.html?id=${id}&globals=theme:${theme};density:${density}`);
      // 서체가 준비되어야 글자 폭이 확정된다.
      await page.evaluate(() => document.fonts.ready);
      // 색 전환 140ms 가 끝난 뒤 찍는다.
      await page.waitForTimeout(300);
      await expect(page).toHaveScreenshot(`${id}-${theme}-${density}.png`, { fullPage: true });
    });
  }
}

for (const id of taggedMobile) {
  for (const { theme, density } of COMBOS) {
    test(`${id} — ${theme}/${density} @${MOBILE_WIDTH}`, async ({ page }) => {
      await page.setViewportSize({ width: MOBILE_WIDTH, height: 844 });
      await page.goto(`/iframe.html?id=${id}&globals=theme:${theme};density:${density}`);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);
      await expect(page).toHaveScreenshot(`${id}-${theme}-${density}-${MOBILE_WIDTH}.png`, {
        fullPage: true,
      });
    });
  }
}
