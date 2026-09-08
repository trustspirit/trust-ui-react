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

/**
 * v1 전용 토큰 중 의도적으로 별칭을 만들지 않는 3개 — "아직 못 옮긴 것"이
 * 아니라 "옮기면 안 되는 것"이다. compat.css 최상단 주석과 각 선언 자리의
 * 주석에 사유가 적혀 있다:
 *
 * - --tui-focus-ring: v1 값이 완결된 box-shadow 값이었다. v2 에 같은
 *   문법의 값이 없어 색 하나로 별칭하면 `box-shadow: <color>` 가 되어
 *   무효한 CSS 가 되고, 포커스 링 자체가 사라진다.
 * - --tui-inset-highlight: v1 Button 이 다른 그림자와 리스트로 합성해
 *   썼다(`box-shadow: var(--tui-inset-highlight), var(--tui-shadow-md)`).
 *   `none` 은 그 리스트의 항목으로 올 수 없어 전체가 무효해진다.
 * - --tui-thumb-zone-height: v1 값(65vh, 화면 높이의 65%)과 v2 의
 *   --tui-thumb-safe-bottom(약 16px 하단 여백)은 개념이 다르다. 별칭하면
 *   문법은 유효하지만 결과가 완전히 달라져(65% → 16px) 조용히 깨진다.
 *
 * 86개 중 이 3개만 예외이므로 커버리지 기대치는 83이다 — 개수를 그냥
 * 낮추지 않고 이름을 못박아 목록으로 관리한다.
 */
const DELIBERATELY_NOT_ALIASED = ['--tui-focus-ring', '--tui-inset-highlight', '--tui-thumb-zone-height'];

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

  it('측정된 86개 v1 전용 토큰 중 의도적 예외 3개를 뺀 나머지를 모두 별칭으로 남긴다', () => {
    expect(V1_ONLY_TOKENS.length).toBe(86);
    const expectedAliased = V1_ONLY_TOKENS.filter((name) => !DELIBERATELY_NOT_ALIASED.includes(name));
    const missing = expectedAliased.filter((name) => !compatDeclared.has(name));
    expect(missing).toEqual([]);
  });

  it('의도적으로 별칭하지 않는 3개는 compat.css 에 실제로 없다', () => {
    // 예외 목록에 이름을 올려두고 실제로는 별칭을 남겨버리는 실수를 잡는다.
    const wronglyAliased = DELIBERATELY_NOT_ALIASED.filter((name) => compatDeclared.has(name));
    expect(wronglyAliased).toEqual([]);
  });

  it('코어 진입점에서 임포트하지 않는다', () => {
    const index = readFileSync(resolve(root, 'src/index.ts'), 'utf8');
    expect(index).not.toContain('compat.css');
  });

  it('별도 경로로 배포된다', () => {
    expect(pkg.exports['./compat.css']).toBe('./dist/compat.css');
  });
});
