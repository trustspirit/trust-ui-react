import { test, expect, type Page } from '@playwright/test';

/**
 * 상호작용 상태의 계산값을 단언한다.
 *
 * 정적 스냅샷은 포커스도 호버도 담지 못한다. 이 사각지대에 포커스 결함이
 * 반복해서 숨어 있었고, 그때마다 사람이 브라우저를 띄워 손으로 계산 스타일을
 * 읽어 확인했다. 그 절차를 여기서 코드로 만든다.
 *
 * 이 하네스가 다루는 포커스 관용구는 셋이다:
 *   - bordered: 두껍게 할 테두리가 있는 요소 — border-color: var(--tui-ink) +
 *     box-shadow: inset 0 0 0 1px var(--tui-ink), 바깥(비-inset) 레이어 없음.
 *   - ring: 두껍게 할 테두리가 없는 요소 — box-shadow 바깥 링 두 겹(분리층 +
 *     주 층)만, inset 레이어 없음. 분리·주 색은 표면마다 다를 수 있다
 *     (기본은 --tui-paper/--tui-ink, Toast는 --tui-sheet 위이거나 danger
 *     면이라 다른 토큰을 쓴다 — Case.ringSeparatorToken/ringMainToken).
 *   - insetRing: 표 안쪽처럼 바깥 링을 그리면 이웃에 잘리는 자리 — inset
 *     링 한 겹만, border-color 전환도 바깥 레이어도 없음.
 * "boxShadow가 비어있지 않다" 같은 약한 신호는 이 관용구들을 구분하지
 * 못해 지금까지의 결함을 하나도 못 잡았을 것이므로 쓰지 않는다.
 */

/** 색 전환 140ms 가 끝난 뒤 읽어야 한다. 그러지 않으면 혼합값이 나온다. */
const SETTLE = 350;

/**
 * box-shadow 계산값을 최상위 콤마 기준으로 레이어 단위로 쪼갠다.
 * rgba(0, 0, 0, 0.5) 안의 콤마까지 레이어 경계로 오인하면 안 되므로
 * 괄호 깊이를 추적한다.
 */
function splitShadowLayers(boxShadow: string): string[] {
  if (!boxShadow || boxShadow === 'none') return [];
  const layers: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of boxShadow) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      layers.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) layers.push(cur.trim());
  return layers;
}

/**
 * var(--tui-x) 토큰이 브라우저에서 실제로 계산되는 rgb(...) 값을 읽는다.
 * 기대치를 rgb 숫자로 하드코딩하면 팔레트가 바뀔 때 검사가 같이 낡는다 —
 * 토큰 자체를 기준으로 비교해야 팔레트 변경에는 무디고 토큰 오배선에는
 * 민감한 검사가 된다.
 */
async function resolveTokenColor(page: Page, token: string): Promise<string> {
  return page.evaluate((t) => {
    const probe = document.createElement('div');
    probe.style.color = `var(${t})`;
    document.body.appendChild(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, token);
}

type Visual = { borderColor: string; boxShadow: string };

/**
 * autodocs 태그가 붙은 스토리는 Storybook이 사이드바/검색 인덱스를 준비하려고
 * `#storybook-root` 바깥에 `.sb-preparing-docs` 라는 숨은 ArgsTable 프리뷰를
 * 함께 그려 넣는다. 그 안에도 `<button>Set string</button>` 같은 제어용
 * 버튼이 있어 `page.locator('button')` 이 실제 스토리가 아니라 그쪽을
 * 집어버렸다 — 검사 대상을 `#storybook-root` 안으로 명시적으로 좁힌다.
 */
const ROOT = '#storybook-root';

/**
 * 실제로 시각 신호(테두리·그림자)를 그리는 요소를 포커스 대상으로부터 찾는다.
 * 세 컴포넌트군은 DOM 모양이 서로 다르다:
 *  - TextField: 포커스 신호가 input을 감싼 조상 wrapper div에 그려진다.
 *  - Select/Button/Pagination: 포커스한 요소 자신이 곧 시각 요소다.
 *  - Checkbox/Radio: 네이티브 input은 시각적으로 숨겨져 있고(clip-rect),
 *    형제로 오는 커스텀 indicator span에 신호가 그려진다
 *    (`.hiddenInput:focus-visible + .indicator` — 인접 형제 선택자).
 */
type VisualResolver = 'self' | 'closestWrapper' | 'nextSibling';
type Idiom = 'bordered' | 'ring' | 'insetRing';

interface Case {
  story: string;
  label: string;
  focusSelector: string;
  visual: VisualResolver;
  idiom: Idiom;
  /** idiom: 'ring' 전용. 분리층 색 — 미지정 시 --tui-paper. */
  ringSeparatorToken?: string;
  /** idiom: 'ring' 전용. 주 층 색 — 미지정 시 --tui-ink. */
  ringMainToken?: string;
  /** 좁은 화면(640px 미만)에서만 렌더되는 요소는 뷰포트를 좁혀야 한다. */
  viewport?: { width: number; height: number };
}

const CASES: Case[] = [
  { story: 'form-textfield--default', label: 'TextField', focusSelector: 'input', visual: 'closestWrapper', idiom: 'bordered' },
  // Select 의 트리거는 <button>이 아니라 role="combobox"인 tabindex div다
  // (Select.tsx) — 브리프가 추정한 'button' 선택자는 존재하지 않는 요소였다.
  { story: 'form-select--default', label: 'Select', focusSelector: '[role="combobox"]', visual: 'self', idiom: 'bordered' },
  { story: 'form-checkbox--default', label: 'Checkbox', focusSelector: 'input[type="checkbox"]', visual: 'nextSibling', idiom: 'bordered' },
  { story: 'form-radio--default', label: 'Radio', focusSelector: 'input[type="radio"]', visual: 'nextSibling', idiom: 'bordered' },
  { story: 'components-button--variants', label: 'Button', focusSelector: 'button', visual: 'self', idiom: 'ring' },
  // Pagination의 버튼은 항상 1px 테두리를 가지며 포커스 시 그 테두리가
  // inset box-shadow로 두꺼워진다(Pagination.module.css .button:focus-visible) —
  // 바깥 링이 아니다. 브리프는 이를 bordered:false(링)로 잘못 추정했다;
  // 실제 CSS를 읽어 bordered:true로 바로잡았다.
  { story: 'navigation-pagination--default', label: 'Pagination', focusSelector: 'button[aria-label="Page 2"]', visual: 'self', idiom: 'bordered' },
  // 정렬 헤더 버튼(.sortButton)은 표 안쪽 컨트롤이라 바깥 링을 그리면 이웃
  // 칸에 잘린다(Table.module.css) — border:none 이라 bordered 도 아니고,
  // 바깥 두 겹도 아닌 inset 한 겹뿐인 셋째 관용구를 쓴다.
  { story: 'components-table--sortable', label: 'Table 정렬 헤더 버튼', focusSelector: 'thead button', visual: 'self', idiom: 'insetRing' },
  // 모바일 정렬 바(.sortBar)는 요약 2행 모드에서 열 머리가 사라지는 640px
  // 미만에서만 display:flex 로 나타난다(Table.module.css
  // @media (max-width: 640px)) — 기본 뷰포트(1280px)에서는 display:none
  // 이라 .focus() 가 무시되므로 이 케이스만 뷰포트를 좁힌다.
  {
    story: 'components-table--mobile-summary',
    label: 'Table 모바일 정렬 바',
    focusSelector: 'button[aria-haspopup="dialog"]',
    visual: 'self',
    idiom: 'insetRing',
    viewport: { width: 390, height: 844 },
  },
  // overlay-toast--open 스토리는 success·danger·warning·info 순서로 네
  // 토스트를 한 번에 렌더한다. 여기서는 success(1번째) 위에서 기본(비반전)
  // 링을 확인한다 — "기본"은 별도 variant가 아니라 danger로 뒤집히지 않은
  // 기본 링 규칙을 뜻한다. 분리색이 --tui-paper 가 아니라 --tui-sheet 인 것은
  // Toast 가 페이지가 아니라 뜬 지면(sheet) 위에 있기 때문이다.
  {
    story: 'overlay-toast--open',
    label: 'Toast 닫기 버튼(기본 링, success 표면)',
    focusSelector: '[role="alert"]:nth-of-type(1) button',
    visual: 'self',
    idiom: 'ring',
    ringSeparatorToken: '--tui-sheet',
    ringMainToken: '--tui-ink',
  },
  // danger(2번째) 위에서는 두 층이 뒤집힌다 — 기본 링의 밝은 안쪽 층이 붉은
  // 면 위에 흰 테를 남기기 때문이다(Toast.module.css .danger .closeButton:focus-visible).
  {
    story: 'overlay-toast--open',
    label: 'Toast 닫기 버튼(danger 면)',
    focusSelector: '[role="alert"]:nth-of-type(2) button',
    visual: 'self',
    idiom: 'ring',
    ringSeparatorToken: '--tui-danger',
    ringMainToken: '--tui-on-danger',
  },
];

async function readVisual(page: Page, focusSelector: string, visual: VisualResolver): Promise<Visual> {
  return page.evaluate(
    ({ focusSelector, visual }) => {
      const el = document.querySelector('#storybook-root')?.querySelector(focusSelector);
      if (!el) throw new Error(`focus selector not found: ${focusSelector}`);
      let target: Element = el;
      if (visual === 'closestWrapper') {
        target = el.closest('[class*="Wrapper"], [class*="wrapper"]') ?? el;
      } else if (visual === 'nextSibling') {
        target = el.nextElementSibling ?? el;
      }
      const s = getComputedStyle(target);
      return { borderColor: s.borderColor, boxShadow: s.boxShadow };
    },
    { focusSelector, visual },
  );
}

for (const c of CASES) {
  test.describe(`${c.label} (${c.story})`, () => {
    if (c.viewport) {
      test.use({ viewport: c.viewport });
    }

    test('포커스 신호가 관용구를 지킨다', async ({ page }) => {
      await page.goto(`/iframe.html?id=${c.story}&viewMode=story`);
      await page.evaluate(() => document.fonts.ready);

      const focusEl = page.locator(ROOT).locator(c.focusSelector).first();
      await focusEl.focus();
      await page.waitForTimeout(SETTLE);

      // 조상의 속성(포커스)을 바꾼 것과 같은 태스크 안에서 자손의 계산 스타일을
      // 읽으면 이전 값을 돌려받는다 — .focus()(브라우저 액션)와 스타일을 읽는
      // page.evaluate 를 별도의 왕복으로 분리해서 이 함정을 피한다.
      const visual = await readVisual(page, c.focusSelector, c.visual);
      const inkColor = await resolveTokenColor(page, '--tui-ink');

      const layers = splitShadowLayers(visual.boxShadow);
      const insetLayers = layers.filter((l) => /\binset\b/.test(l));
      const outerLayers = layers.filter((l) => !/\binset\b/.test(l));

      if (c.idiom === 'bordered') {
        expect(visual.borderColor, `${c.label}: border-color가 --tui-ink(${inkColor})가 아니라 ${visual.borderColor}다`).toBe(inkColor);
        expect(
          insetLayers.some((l) => l.includes(inkColor)),
          `${c.label}: inset 레이어에 --tui-ink 색이 없다 (box-shadow: ${visual.boxShadow})`,
        ).toBe(true);
        expect(outerLayers, `${c.label}: 테두리를 두껍게 할 수 있는 요소인데 바깥(비-inset) 레이어가 남아 있다 — 두 겹 신호다`).toEqual([]);
      } else if (c.idiom === 'ring') {
        const separatorToken = c.ringSeparatorToken ?? '--tui-paper';
        const mainToken = c.ringMainToken ?? '--tui-ink';
        const separatorColor = await resolveTokenColor(page, separatorToken);
        const mainColor = await resolveTokenColor(page, mainToken);

        expect(insetLayers, `${c.label}: 테두리를 두껍게 할 수 없는 요소인데 inset 레이어가 있다 — 관용구 위반이다`).toEqual([]);
        expect(outerLayers.length, `${c.label}: 포커스 링이 없다 (box-shadow: ${visual.boxShadow})`).toBeGreaterThan(0);
        expect(
          outerLayers.some((l) => l.includes(separatorColor)),
          `${c.label}: 링의 분리층(${separatorToken} = ${separatorColor})이 없다 (box-shadow: ${visual.boxShadow})`,
        ).toBe(true);
        expect(
          outerLayers.some((l) => l.includes(mainColor)),
          `${c.label}: 링의 주 층(${mainToken} = ${mainColor})이 없다 (box-shadow: ${visual.boxShadow})`,
        ).toBe(true);
      } else {
        // insetRing: 표 안쪽처럼 바깥 링이 잘리는 자리 — inset 한 겹만, 바깥
        // 레이어는 없어야 한다.
        expect(
          outerLayers,
          `${c.label}: inset 전용 관용구인데 바깥(비-inset) 레이어가 있다 (box-shadow: ${visual.boxShadow})`,
        ).toEqual([]);
        expect(insetLayers.length, `${c.label}: 포커스 링이 없다 (box-shadow: ${visual.boxShadow})`).toBeGreaterThan(0);
        expect(
          insetLayers.some((l) => l.includes(inkColor)),
          `${c.label}: inset 레이어에 --tui-ink(${inkColor}) 색이 없다 (box-shadow: ${visual.boxShadow})`,
        ).toBe(true);
      }
    });

    test('호버가 포커스 신호를 덮지 않는다', async ({ page }) => {
      await page.goto(`/iframe.html?id=${c.story}&viewMode=story`);
      await page.evaluate(() => document.fonts.ready);

      const focusEl = page.locator(ROOT).locator(c.focusSelector).first();
      await focusEl.focus();
      await page.waitForTimeout(SETTLE);
      const before = await readVisual(page, c.focusSelector, c.visual);

      // 마우스는 실제로 화면에 보이는 요소에 올린다. Checkbox/Radio의 네이티브
      // input은 시각적으로 숨겨져 있어(clip-rect) 실사용자가 거기 마우스를
      // 올릴 수 없다 — indicator(형제 span)가 실제 hover 대상이다.
      const hoverTarget = c.visual === 'nextSibling'
        ? focusEl.locator('xpath=following-sibling::*[1]')
        : focusEl;
      await hoverTarget.hover();
      await page.waitForTimeout(SETTLE);
      const after = await readVisual(page, c.focusSelector, c.visual);

      expect(after.borderColor, `${c.label}: 호버가 포커스 테두리 색을 바꿨다 (${before.borderColor} → ${after.borderColor})`).toBe(
        before.borderColor,
      );
      expect(after.boxShadow, `${c.label}: 호버가 포커스 그림자를 바꿨다 (${before.boxShadow} → ${after.boxShadow})`).toBe(
        before.boxShadow,
      );
    });
  });
}
