import { describe, it, expect } from 'vitest';
import { readFileSync, globSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { STALE, EXEMPT } from './stale';
import { root, definedTokens } from '../shared/tokens';

const read = (f: string) => readFileSync(resolve(root, f), 'utf8');

/**
 * 문서 사이트가 안내해도 되는 컴포넌트 예제·설명의 대상 파일들.
 * docs-site 는 루트 tsc 대상이 아닌 별도 Docusaurus 프로젝트라 이 검사가
 * 유일하게 그 내용을 훑는다.
 */
const docsFiles = [
  ...globSync('docs-site/docs/**/*.mdx', { cwd: root }),
  ...globSync('docs-site/src/**/*.{tsx,ts,css}', { cwd: root }),
].sort();

/**
 * 검사 1~3의 대상 — STALE(아직 정리 전) 또는 EXEMPT(원리상 정리 불가능)에
 * 있는 파일은 건너뛴다.
 */
const clean = docsFiles.filter((f) => !STALE.includes(f) && !EXEMPT.includes(f));

/**
 * v2 시맨틱/팔레트 층을 이루는 파일들에서 실제로 "선언"된 커스텀 프로퍼티
 * 이름만 화이트리스트로 삼는다. tests/shared/tokens.ts 의 LAYER_FILES
 * (사람이 고른 화이트리스트)를 근거로 한다 — 예전에는 이 파일이
 * src/styles/** 를 무필터로 globSync 해서 compat.css 가 선언한 v1
 * 이름(--tui-primary 등)까지 "정의된 토큰"으로 잡혔다.
 */
const DEFINED_TOKENS = definedTokens();

/** 문서 텍스트 어디서든 등장하는 --tui-* 이름 전부(선언형이든 var() 참조든). */
const TOKEN_MENTION = /--tui-[a-zA-Z0-9-]+/g;
function collectMentionedTokens(text: string): Set<string> {
  return new Set([...text.matchAll(TOKEN_MENTION)].map((m) => m[0]));
}

/** 정의된 토큰이거나 --tui-p-* 팔레트 이름이면 허용한다. */
const isAllowedToken = (name: string) => DEFINED_TOKENS.has(name) || /^--tui-p-/.test(name);

/**
 * v1 에서 삭제된 prop 들. 문자열 형태로 등장 여부만 확인한다.
 * `variant="bordered"` 는 여기 없다 — Table 에서는 삭제됐지만 Expander 는
 * 지금도 실제 variant 로 쓴다(Expander.module.css 의 .variantBordered).
 * size= 와 같은 이유로 Table 문서에서만 따로 검사한다(아래).
 */
const REMOVED_PROP_PATTERNS: RegExp[] = [
  /elevation=/,
  /gradient/,
  /zebra/,
  /variant="striped"/,
  /mobileVariant="stacked"/,
];

/** v1 에서 삭제된 파일·기법 이름. 부분 문자열 포함 여부만 확인한다. */
const REMOVED_MENTIONS = ['theme-light.css', 'theme-dark.css', 'surfaces.css', 'fonts.css', 'tui-glass', 'Geist'];

describe('문서 계약', () => {
  it('삭제된 토큰을 쓰지 않는다', () => {
    const bad: string[] = [];
    for (const f of clean) {
      for (const token of collectMentionedTokens(read(f))) {
        if (!isAllowedToken(token)) bad.push(`${f} → ${token}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('삭제된 prop 을 예제에 쓰지 않는다', () => {
    const bad: string[] = [];
    for (const f of clean) {
      const text = read(f);
      for (const re of REMOVED_PROP_PATTERNS) {
        if (re.test(text)) bad.push(`${f} → ${re}`);
      }
      // size= 는 Table 문서에서만 삭제되었다 — 다른 컴포넌트는 지금도 size prop 을 쓴다.
      if (f.endsWith('table.mdx') && /size=/.test(text)) bad.push(`${f} → size= (Table)`);
      // variant="bordered" 도 마찬가지로 Table 에서만 삭제됐다 — Expander 는 지금도 쓴다.
      if (f.endsWith('table.mdx') && /variant="bordered"/.test(text)) bad.push(`${f} → variant="bordered" (Table)`);
    }
    expect(bad).toEqual([]);
  });

  it('삭제된 파일을 안내하지 않는다', () => {
    const bad: string[] = [];
    for (const f of clean) {
      const text = read(f);
      for (const needle of REMOVED_MENTIONS) {
        if (text.includes(needle)) bad.push(`${f} → ${needle}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('허용목록에 실존하지 않는 파일이 남아 있지 않다', () => {
    const missing = STALE.filter((f) => !existsSync(resolve(root, f)));
    expect(missing).toEqual([]);
  });

  it('영구 예외(EXEMPT)에 실존하지 않는 파일이 남아 있지 않다', () => {
    const missing = EXEMPT.filter((f) => !existsSync(resolve(root, f)));
    expect(missing).toEqual([]);
  });

  it('허용목록(STALE)은 줄어들기만 한다', () => {
    // Task 7 완료로 문서 마이그레이션이 끝났다 — STALE 은 이제 항상 빈
    // 배열이어야 한다. 이 상한은 0에서 다시 올라갈 수 없다.
    expect(STALE.length).toBeLessThanOrEqual(0);
  });
});
