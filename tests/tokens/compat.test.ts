import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { root, read, collectDeclaredTokens, collectReferencedTokens, definedTokens } from '../shared/tokens';
import { V1_ONLY_TOKENS } from './v1-tokens';

const COMPAT_FILE = 'src/styles/compat.css';
const compatCss = read(COMPAT_FILE);
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));

/**
 * v2 의 실제 정의 목록 — tests/shared/tokens.ts 의 LAYER_FILES 를 근거로
 * 한다(compat.css 는 그 목록에 없다). 별칭의 우변이 실존해야 하는 대상이자,
 * 좌변(v1 이름)이 겹치면 안 되는 재정의 금지 대상이기도 하다.
 */
const V2_DEFINED_TOKENS = definedTokens();

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
    expect(V1_ONLY_TOKENS.length).toBe(86);
    const missing = V1_ONLY_TOKENS.filter((name) => !compatDeclared.has(name));
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
