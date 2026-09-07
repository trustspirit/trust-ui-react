import { describe, it, expect } from 'vitest';
import { readFileSync, globSync } from 'node:fs';
import { resolve } from 'node:path';
import { UNMIGRATED } from './unmigrated';

const root = resolve(__dirname, '../..');
const read = (f: string) => readFileSync(resolve(root, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const componentCss = globSync('src/components/**/*.module.css', { cwd: root }).sort();
const migrated = componentCss.filter((f) => !UNMIGRATED.includes(f));

/**
 * v2 시맨틱 층을 이루는 파일들. 컴포넌트가 참조할 수 있는 토큰은
 * 이 파일들이 실제로 정의하는 것뿐이어야 한다 — 블랙리스트(REMOVED)로
 * "사라진 27개"만 막던 예전 방식은 v2가 아예 정의하지 않는 나머지
 * 토큰(spacing, radius, font-size 등 73개)을 그대로 통과시켰다.
 */
const LAYER_FILES = [
  'src/styles/palette.css',
  'src/styles/themes/light.css',
  'src/styles/themes/dark.css',
  'src/styles/themes/density.css',
  'src/styles/themes/spacing.css',
  'src/styles/tokens.css',
  'src/styles/market.css',
];

/** "이름: 값" 형태의 커스텀 프로퍼티 선언 하나를 잡는다. */
const DECLARATION = /(--[a-zA-Z0-9-]+)\s*:/g;

/**
 * CSS 텍스트에서 실제로 "정의"된 커스텀 프로퍼티 이름만 골라낸다.
 * :root, [data-theme=...], @media 로 감싼 블록 등 셀렉터 형태와 무관하게
 * 동작한다 — var(--foo) 같은 참조 뒤에는 콜론이 오지 않으므로
 * "var(" 바로 뒤에서 매치된 경우만 걸러내면 된다.
 */
function collectDeclaredTokens(css: string): Set<string> {
  const declared = new Set<string>();
  for (const m of css.matchAll(DECLARATION)) {
    const before = css.slice(Math.max(0, m.index - 4), m.index);
    if (before.endsWith('var(')) continue;
    declared.add(m[1]);
  }
  return declared;
}

/** CSS 텍스트에서 var(--foo) 형태로 참조되는 커스텀 프로퍼티 이름 전체. */
function collectReferencedTokens(css: string): string[] {
  return [...css.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)/g)].map((m) => m[1]);
}

/** v2 층이 정의하는 토큰 이름 전체 — 컴포넌트가 참조해도 되는 화이트리스트. */
const DEFINED_TOKENS = new Set<string>();
for (const f of LAYER_FILES) {
  for (const name of collectDeclaredTokens(read(f))) DEFINED_TOKENS.add(name);
}

const RAW_COLOR = /(#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\()/i;

/** CSS 선택자의 명시도를 [id, class/attr/pseudo-class, element] 로 센다. */
function specificity(sel: string): [number, number, number] {
  const s = sel.replace(/::[a-z-]+/g, ''); // 의사 요소는 element 급이라 따로 세지 않는다
  const ids = (s.match(/#[\w-]+/g) ?? []).length;
  const classes = (s.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+(\([^)]*\))?/g) ?? []).length;
  const elements = (s.match(/(^|[\s>+~])[a-z][\w-]*/gi) ?? []).length;
  return [ids, classes, elements];
}

const ge = (a: [number, number, number], b: [number, number, number]) =>
  a[0] !== b[0] ? a[0] > b[0] : a[1] !== b[1] ? a[1] > b[1] : a[2] >= b[2];

/** 선택자와 선언을 가진 최상위 규칙들을 뽑는다. @media 안쪽도 포함한다. */
function rules(css: string): { selector: string; body: string; index: number }[] {
  const out: { selector: string; body: string; index: number }[] = [];
  for (const m of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    const selector = m[1].trim();
    if (!selector || selector.startsWith('@')) continue;
    out.push({ selector, body: m[2], index: m.index ?? 0 });
  }
  return out;
}

const PROP = /(^|;)\s*([a-z-]+)\s*:/g;
const propsOf = (body: string) =>
  new Set([...body.matchAll(PROP)].map((m) => m[2]).filter((p) => !p.startsWith('--')));

/**
 * 무관하다고 판단한 호버/포커스 쌍. 클래스명이 다르다고 다른 요소인 것은 아니므로
 * (CSS Modules 에서는 한 요소가 여러 클래스를 함께 갖는다 — 예: Menu 의 danger 항목은
 * `.item` 과 `.danger` 를 동시에 갖는다) 자동 추론 대신 사람이 확인한 쌍만 여기에 적는다.
 * 각 항목에 이유를 남긴다.
 */
const UNRELATED_PAIRS: { file: string; hover: string; focus: string; why: string }[] = [];

/** file/hover 선택자/focus 선택자 조합이 UNRELATED_PAIRS 에 등록된 쌍과 일치하는지. */
const isUnrelatedPair = (file: string, hoverSel: string, focusSel: string) =>
  UNRELATED_PAIRS.some((p) => p.file === file && hoverSel.includes(p.hover) && focusSel.includes(p.focus));

/**
 * 호버 선택자가 "이 특정 포커스 규칙"에 대해 이미 게이팅되어 있는지.
 * 게이트는 한 포커스 규칙에 대한 답이지, 파일 전체에 대한 통과권이 아니다 —
 * `:not(:focus-visible)` 은 `:focus-within` 규칙을 막지 않는다.
 * `:not(:focus-within)` 은 더 넓은 조건(포커스가 자식에 있어도 제외)이므로
 * `:focus-visible` 규칙까지 막는다.
 */
function isGatedFor(hoverSelector: string, focusSelector: string): boolean {
  const hasFocusWithinGate = /:not\(:focus-within\)/.test(hoverSelector);
  const hasFocusVisibleGate = /:not\(:focus-visible\)/.test(hoverSelector);
  if (/:focus-within/.test(focusSelector)) return hasFocusWithinGate;
  if (/:focus-visible/.test(focusSelector)) return hasFocusVisibleGate || hasFocusWithinGate;
  return false;
}

describe('토큰 계약', () => {
  it('마이그레이션한 파일은 v2가 정의하지 않은 토큰을 참조하지 않는다', () => {
    const bad: string[] = [];
    for (const f of migrated) {
      const css = read(f);
      // 컴포넌트가 스스로 선언한 스코프 커스텀 프로퍼티(예: SegmentedControl의
      // --tui-seg-*)는 v2 시맨틱 토큰이 아니라 그 파일만의 내부 계약이므로 허용한다.
      const selfDeclared = collectDeclaredTokens(css);
      for (const token of collectReferencedTokens(css)) {
        if (DEFINED_TOKENS.has(token) || selfDeclared.has(token)) continue;
        bad.push(`${f} → ${token}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('마이그레이션한 파일은 원시 색을 직접 쓰지 않는다', () => {
    const bad = migrated.filter((f) => RAW_COLOR.test(read(f)));
    expect(bad).toEqual([]);
  });

  it('컴포넌트는 팔레트 층을 직접 참조하지 않는다', () => {
    const bad = componentCss.filter((f) => read(f).includes('--tui-p-'));
    expect(bad).toEqual([]);
  });

  it('허용목록에 실존하지 않는 파일이 남아 있지 않다', () => {
    expect(UNMIGRATED.filter((f) => !componentCss.includes(f))).toEqual([]);
  });

  it('허용목록(UNMIGRATED)은 줄어들기만 한다', () => {
    // 1은 Table.module.css 하나만 남은 현재 값이다 (Table 재설계는 계획 3 대상).
    // 컴포넌트를 마이그레이션할 때마다 unmigrated.ts 에서 줄을 지우므로 이 숫자는
    // 앞으로 감소만 해야 한다 — 다시 늘어난다면 마이그레이션이 되돌려졌거나
    // 허용목록에 항목이 잘못 추가된 것이다.
    expect(UNMIGRATED.length).toBeLessThanOrEqual(1);
  });

  it('스타일 폴더에도 정의되지 않은 토큰 참조가 없다', () => {
    // 계약 검사가 컴포넌트만 훑던 탓에 surfaces.css 가 죽은 --tui-glass-* 참조를
    // dist/styles.css 까지 싣고 있었다. 레이어 파일 자신도 같은 규칙을 지켜야 한다.
    const styleCss = globSync('src/styles/**/*.css', { cwd: root }).sort();
    const bad: string[] = [];
    for (const f of styleCss) {
      const css = read(f);
      const declared = collectDeclaredTokens(css);
      for (const name of collectReferencedTokens(css)) {
        if (!DEFINED_TOKENS.has(name) && !declared.has(name)) bad.push(`${f} → ${name}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('금지된 시각 기법을 쓰지 않는다', () => {
    const bad: string[] = [];
    for (const f of migrated) {
      const css = read(f);
      if (/backdrop-filter/.test(css)) bad.push(`${f} → glassmorphism`);
      // Calendar.module.css 하나만 예외: 그라데이션으로 날짜 셀 절반을 칠해 범위 선택을 표시하는
      // 기능적 기법이지 장식이 아니다. 경로에 "Calendar"가 들어가는지가 아니라 정확히 이 파일인지로
      // 좁게 검사한다 — 느슨한 substring 매치는 향후 CalendarRange.module.css 같은 파일을
      // 조용히 통과시켜버릴 수 있다.
      if (/linear-gradient/.test(css) && !f.endsWith('/Calendar.module.css')) bad.push(`${f} → 장식용 그라데이션`);
      // 호버 부상 금지는 ":hover 규칙 안의 transform" 을 겨냥한다.
      // 파일 전역에서 translateY(-…) 를 찾으면 화살표 중앙 정렬 같은 정당한 용법까지
      // 잡혀, 구현자가 더 나쁜 기법으로 우회하게 된다. 반대로 그 방식은
      // translate3d·scale 로 쓴 부상을 놓친다.
      const hoverBlocks = css.match(/[^{}]*:hover[^{}]*\{[^{}]*\}/g) ?? [];
      for (const block of hoverBlocks) {
        if (/transform\s*:/.test(block)) bad.push(`${f} → 호버 시 이동·변형`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('호버 규칙이 포커스 규칙을 덮지 않는다', () => {
    // 이 부류의 결함이 일곱 번 재발했다 — 다섯 번은 사람이 훑어서 놓쳤고, 두 번은
    // (Menu 의 item/danger) 최초 버전의 자동 추론(sharesTarget)이 "다른 요소"로
    // 잘못 판단해 놓쳤다. CSS Modules 에서는 한 요소가 여러 클래스를 동시에 가지므로
    // 클래스명이 다르다고 다른 요소인 것은 아니다 — 그래서 지금은 무관 판단을
    // 사람이 확인한 UNRELATED_PAIRS 로만 하고, 나머지는 전부 비교한다.
    // 클릭 직후 포인터가 컨트롤 위에 있는 가장 흔한 상황에서 포커스 표시가 지워진다.
    const bad: string[] = [];
    for (const f of componentCss) {
      const parsed = rules(read(f));
      const hovers = parsed.filter((r) => /:hover/.test(r.selector));
      const focuses = parsed.filter((r) => /:focus-visible|:focus-within/.test(r.selector));
      for (const h of hovers) {
        const hp = propsOf(h.body);
        for (const fo of focuses) {
          const shared = [...propsOf(fo.body)].filter((p) => hp.has(p));
          if (shared.length === 0) continue;
          if (isGatedFor(h.selector, fo.selector)) continue; // 이 포커스 규칙에 대해 이미 게이팅됨
          if (isUnrelatedPair(f, h.selector, fo.selector)) continue; // 사람이 확인한 무관한 쌍
          const hs = specificity(h.selector);
          const fs = specificity(fo.selector);
          if (ge(hs, fs)) {
            bad.push(`${f}: "${h.selector}" 가 "${fo.selector}" 의 ${shared.join(', ')} 를 덮는다`);
          }
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('tsx 안의 토큰 참조도 정의된 것이어야 한다', () => {
    // Slider.tsx 가 죽은 v1 토큰을 참조한 채 배포될 뻔했고 사람이 눈으로 찾았다.
    // CSS 만 훑는 검사로는 원리적으로 볼 수 없는 자리다.
    // .stories.tsx 는 제외하지 않는다. Toast.stories.tsx 등 10개 스토리 파일이
    // v1 토큰(--tui-text-secondary, --tui-primary, --tui-border 등)을 참조한 채
    // 남아 있었다 — 개발 전용이라 해도 Storybook에서 렌더링이 깨지고,
    // 그 Storybook이 바로 시각 베이스라인의 출처다.
    const tsx = globSync('src/**/*.tsx', { cwd: root })
      // Tokens.stories.tsx 는 팔레트 스텝을 `var(--tui-p-neutral-${step})` 처럼
      // 템플릿 리터럴로 동적 렌더링하는 문서 페이지다. 정규식은 `${` 앞에서
      // 멈춰 `--tui-p-neutral-` 라는 불완전한 이름을 만들어내므로 오탐이다 —
      // Calendar.module.css의 그라데이션 예외와 같은 성격의 의도된 예외다.
      .filter((f) => f !== 'src/styles/Tokens.stories.tsx')
      .sort();
    const bad: string[] = [];
    for (const f of tsx) {
      const src = read(f);
      const declared = collectDeclaredTokens(src);
      for (const name of collectReferencedTokens(src)) {
        if (!DEFINED_TOKENS.has(name) && !declared.has(name)) bad.push(`${f} → ${name}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
