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
 * 선택자가 최종적으로 겨냥하는 요소의 클래스들.
 * 두 규칙이 같은 요소에 적용될 수 있을 때만 비교해야 한다 —
 * `.trigger:hover` 와 `.option:focus-visible` 은 서로 다른 요소이므로
 * 같은 속성을 건드려도 충돌이 아니다.
 */
function targetClasses(sel: string): Set<string> {
  // :not(...) / :is(...) 같은 함수형 의사 클래스의 인자는 대상이 아니라 조건이다.
  // .item:not(.disabled) 이 겨냥하는 것은 .item 이지 .disabled 가 아니다.
  const withoutArgs = sel.replace(/:[\w-]+\([^)]*\)/g, '');
  const last = withoutArgs.split(/\s+|>|\+|~/).filter(Boolean).pop() ?? '';
  return new Set((last.match(/\.[\w-]+/g) ?? []).map((c) => c.slice(1)));
}

const sharesTarget = (a: string, b: string) => {
  const ta = targetClasses(a);
  const tb = targetClasses(b);
  if (ta.size === 0 || tb.size === 0) return true; // 판단 불가 — 안전하게 비교한다
  for (const c of ta) if (tb.has(c)) return true;
  return false;
};

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
    // 이 부류의 결함이 다섯 번 재발했고 매번 사람이 훑어서 놓쳤다.
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
          if (/:not\(:focus/.test(h.selector)) continue; // 이미 게이팅됨
          if (!sharesTarget(h.selector, fo.selector)) continue; // 서로 다른 요소
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
});
