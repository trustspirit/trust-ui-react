import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * v2 토큰 정의를 다루는 여러 테스트(tests/tokens/contract.test.ts,
 * tests/docs/contract.test.ts, tests/tokens/compat.test.ts)가 각자
 * "정의된 v2 토큰"을 따로 계산하다가 어긋난 적이 있다 — 문서 계약
 * 테스트가 LAYER_FILES 대신 src/styles/** 를 무필터로 globSync 하는
 * 바람에 compat.css 가 선언한 v1 이름까지 "정의된 토큰"으로 잡혔다.
 * 그래서 이 판단을 한 곳으로 모은다.
 */

export const root = resolve(__dirname, '../..');

/** 파일을 프로젝트 루트 기준 상대경로로 읽고, 블록 주석을 제거한다. */
export const read = (f: string): string =>
  readFileSync(resolve(root, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/** "이름: 값" 형태의 커스텀 프로퍼티 선언 하나를 잡는다. */
export const DECLARATION = /(--[a-zA-Z0-9-]+)\s*:/g;

/**
 * CSS/TSX 텍스트에서 실제로 "정의"된 커스텀 프로퍼티 이름만 골라낸다.
 * :root, [data-theme=...], @media 로 감싼 블록 등 셀렉터 형태와 무관하게
 * 동작한다 — var(--foo) 같은 참조 뒤에는 콜론이 오지 않으므로
 * "var(" 바로 뒤에서 매치된 경우만 걸러내면 된다.
 */
export function collectDeclaredTokens(css: string): Set<string> {
  const declared = new Set<string>();
  for (const m of css.matchAll(DECLARATION)) {
    const before = css.slice(Math.max(0, m.index - 4), m.index);
    if (before.endsWith('var(')) continue;
    declared.add(m[1]);
  }
  return declared;
}

/** CSS/TSX 텍스트에서 var(--foo) 형태로 참조되는 커스텀 프로퍼티 이름 전체. */
export function collectReferencedTokens(css: string): string[] {
  return [...css.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)/g)].map((m) => m[1]);
}

/**
 * v2 시맨틱 층을 이루는 파일들. 컴포넌트·문서가 참조할 수 있는 토큰은
 * 이 파일들이 실제로 정의하는 것뿐이어야 한다 — 블랙리스트(REMOVED)로
 * "사라진 27개"만 막던 예전 방식은 v2가 아예 정의하지 않는 나머지
 * 토큰(spacing, radius, font-size 등 73개)을 그대로 통과시켰다.
 *
 * 사람이 고른 화이트리스트로 유지한다 — src/styles/** 를 globSync 로
 * 무필터로 훑지 않는다. 그러면 compat.css 처럼 v1 이름을 좌변에
 * 선언하는 파일까지 섞여 v1 이름이 "정의된 토큰"으로 둔갑한다.
 *
 * compat.css 는 v1 이름을 선언하므로 v2 정의 목록에 넣으면 검사들이 v1 이름을 통과시킨다.
 */
export const LAYER_FILES = [
  'src/styles/palette.css',
  'src/styles/themes/light.css',
  'src/styles/themes/dark.css',
  'src/styles/themes/density.css',
  'src/styles/themes/spacing.css',
  'src/styles/tokens.css',
  'src/styles/market.css',
];

/** v2 층이 정의하는 토큰 이름 전체 — 컴포넌트·문서가 참조해도 되는 화이트리스트. */
export function definedTokens(): Set<string> {
  const defined = new Set<string>();
  for (const f of LAYER_FILES) {
    for (const name of collectDeclaredTokens(read(f))) defined.add(name);
  }
  return defined;
}
