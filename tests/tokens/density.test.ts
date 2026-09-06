import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseCustomProperties } from '../helpers/css';

const css = readFileSync(resolve(__dirname, '../../src/styles/themes/density.css'), 'utf8');
const comfortable = parseCustomProperties(css, ':root, [data-density="comfortable"]');
const compact = parseCustomProperties(css, '[data-density="compact"]');

describe('밀도 축', () => {
  it('기본값이 comfortable 이다', () => {
    expect(comfortable.get('--tui-control-md')).toBe('44px');
  });

  it('compact 는 마우스 환경에서 조밀해진다', () => {
    expect(compact.get('--tui-control-md')).toBe('36px');
    expect(compact.get('--tui-row-height')).toBe('46px');
  });

  it('두 밀도가 같은 토큰 집합을 정의한다', () => {
    expect([...compact.keys()].sort()).toEqual([...comfortable.keys()].sort());
  });

  it('coarse 포인터에서는 밀도와 무관하게 44px 이상이다', () => {
    expect(css).toMatch(/@media\s*\(pointer:\s*coarse\)/);
    const coarse = css.slice(css.indexOf('@media (pointer: coarse)'));
    expect(coarse).toContain('--tui-control-md: 44px');
    expect(coarse).toContain('--tui-font-size-base: 1rem'); // iOS 자동 확대 방지
  });
});
