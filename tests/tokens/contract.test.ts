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
    // 27은 이 가드를 추가하는 시점의 값이다. 컴포넌트를 마이그레이션할 때마다
    // unmigrated.ts 에서 줄을 지우므로 이 숫자는 앞으로 감소만 해야 한다 —
    // 다시 늘어난다면 마이그레이션이 되돌려졌거나 허용목록에 항목이
    // 잘못 추가된 것이다.
    expect(UNMIGRATED.length).toBeLessThanOrEqual(27);
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
      if (/translateY\(-/.test(css)) bad.push(`${f} → 호버 부상`);
    }
    expect(bad).toEqual([]);
  });
});
