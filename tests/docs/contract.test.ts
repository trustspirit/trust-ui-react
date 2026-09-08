import { describe, it, expect } from 'vitest';
import { readFileSync, globSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { STALE } from './stale';

const root = resolve(__dirname, '../..');
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

/** 검사 1~3의 대상 — STALE 에 있는 파일은 아직 정리 전이므로 건너뛴다. */
const clean = docsFiles.filter((f) => !STALE.includes(f));

/**
 * v2 시맨틱/팔레트 층을 이루는 파일들에서 실제로 "선언"된 커스텀 프로퍼티
 * 이름만 화이트리스트로 삼는다. 하드코딩한 이름 목록이 아니라 src/styles 를
 * 직접 읽어 만든다 — 토큰이 바뀌면 이 검사도 함께 움직여야 한다.
 * (tests/tokens/contract.test.ts 와 같은 관용구)
 */
const DECLARATION = /(--[a-zA-Z0-9-]+)\s*:/g;
function collectDeclaredTokens(css: string): Set<string> {
  const declared = new Set<string>();
  for (const m of css.matchAll(DECLARATION)) {
    const before = css.slice(Math.max(0, m.index - 4), m.index);
    if (before.endsWith('var(')) continue; // var(--foo) 참조는 선언이 아니다
    declared.add(m[1]);
  }
  return declared;
}

const styleFiles = globSync('src/styles/**/*.css', { cwd: root }).sort();
const DEFINED_TOKENS = new Set<string>();
for (const f of styleFiles) {
  const css = read(f).replace(/\/\*[\s\S]*?\*\//g, '');
  for (const name of collectDeclaredTokens(css)) DEFINED_TOKENS.add(name);
}

/** 문서 텍스트 어디서든 등장하는 --tui-* 이름 전부(선언형이든 var() 참조든). */
const TOKEN_MENTION = /--tui-[a-zA-Z0-9-]+/g;
function collectMentionedTokens(text: string): Set<string> {
  return new Set([...text.matchAll(TOKEN_MENTION)].map((m) => m[0]));
}

/** 정의된 토큰이거나 --tui-p-* 팔레트 이름이면 허용한다. */
const isAllowedToken = (name: string) => DEFINED_TOKENS.has(name) || /^--tui-p-/.test(name);

/** v1 에서 삭제된 prop 들. 문자열 형태로 등장 여부만 확인한다. */
const REMOVED_PROP_PATTERNS: RegExp[] = [
  /elevation=/,
  /gradient/,
  /zebra/,
  /variant="striped"/,
  /variant="bordered"/,
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

  it('허용목록(STALE)은 줄어들기만 한다', () => {
    // 2026-09-09 실측값 29 — 문서 작업(Task 3~7)이 파일을 정리할 때마다
    // STALE 에서 그 줄을 지운다. 이 숫자는 다시 올라갈 수 없다.
    expect(STALE.length).toBeLessThanOrEqual(29);
  });
});
