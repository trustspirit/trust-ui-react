import { describe, it, expect } from 'vitest';
import { readFileSync, globSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname, '../..');
const read = (f: string) => readFileSync(resolve(root, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const COMPAT_FILE = 'src/styles/compat.css';
const compatCss = read(COMPAT_FILE);
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));

/** compat.css 를 제외한 v2 시맨틱 층 전체 — 별칭의 우변이 실존해야 하는 대상. */
const V2_LAYER_FILES = globSync('src/styles/**/*.css', { cwd: root })
  .sort()
  .filter((f) => f !== COMPAT_FILE);

const DECLARATION = /(--[a-zA-Z0-9-]+)\s*:/g;

/** CSS 텍스트에서 실제로 "정의"된 커스텀 프로퍼티 이름만 골라낸다 (var(--foo) 참조는 제외). */
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

/** compat.css 를 제외한 src/styles/** 전체가 정의하는 토큰 이름 — v2 의 실제 정의 목록. */
const V2_DEFINED_TOKENS = new Set<string>();
for (const f of V2_LAYER_FILES) {
  for (const name of collectDeclaredTokens(read(f))) V2_DEFINED_TOKENS.add(name);
}

const compatDeclared = collectDeclaredTokens(compatCss);
const compatReferenced = collectReferencedTokens(compatCss);

const RAW_COLOR = /(#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\()/i;

describe('호환 층(compat.css)', () => {
  it('모든 선언 우변이 참조하는 --tui-* 는 src/styles/**(compat 자신 제외)에 실존한다', () => {
    const bad = compatReferenced.filter((name) => !V2_DEFINED_TOKENS.has(name));
    expect(bad).toEqual([]);
  });

  it('v2 토큰을 재정의하지 않는다 — 선언 좌변 이름이 v2 정의 목록과 겹치지 않는다', () => {
    // 겹치면 단방향 규칙이 깨지고 임포트가 v2 의 외양을 바꿔버린다.
    const overlap = [...compatDeclared].filter((name) => V2_DEFINED_TOKENS.has(name));
    expect(overlap).toEqual([]);
  });

  it('원시 색을 쓰지 않는다', () => {
    expect(RAW_COLOR.test(compatCss)).toBe(false);
  });

  it('팔레트 층(--tui-p-*)을 직접 참조하지 않는다', () => {
    const paletteRefs = compatReferenced.filter((name) => name.startsWith('--tui-p-'));
    expect(paletteRefs).toEqual([]);
  });

  it('측정된 86개 v1 전용 토큰을 모두 별칭으로 남긴다', () => {
    const v1Only = readFileSync(
      resolve(
        root,
        '.superpowers/sdd/2026-09-09-trust-ui-v2-docs-release/v1-only-tokens.txt',
      ),
      'utf8',
    )
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    expect(v1Only.length).toBe(86);
    const missing = v1Only.filter((name) => !compatDeclared.has(name));
    expect(missing).toEqual([]);
  });

  it('코어 진입점에서 임포트하지 않는다', () => {
    const index = readFileSync(resolve(root, 'src/index.ts'), 'utf8');
    expect(index).not.toContain('compat.css');
  });

  it('별도 경로로 배포된다', () => {
    expect(pkg.exports['./compat.css']).toBe('./dist/compat.css');
  });
});
