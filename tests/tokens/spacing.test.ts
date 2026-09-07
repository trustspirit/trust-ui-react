import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseCustomProperties } from '../helpers/css';

const root = resolve(__dirname, '../..');
const css = readFileSync(resolve(root, 'src/styles/themes/spacing.css'), 'utf8');
const comfortable = parseCustomProperties(css, ':root, [data-density="comfortable"]');
const compact = parseCustomProperties(css, '[data-density="compact"]');

describe('여백 스케일', () => {
  it('안쪽 여백은 밀도에 따라 달라진다', () => {
    expect(comfortable.get('--tui-pad-1')).toBe('6px');
    expect(comfortable.get('--tui-pad-2')).toBe('10px');
    expect(comfortable.get('--tui-pad-3')).toBe('14px');
    expect(comfortable.get('--tui-pad-4')).toBe('20px');
    expect(compact.get('--tui-pad-1')).toBe('4px');
    expect(compact.get('--tui-pad-2')).toBe('8px');
    expect(compact.get('--tui-pad-3')).toBe('12px');
    expect(compact.get('--tui-pad-4')).toBe('16px');
  });

  it('바깥 간격은 고정이다 — 밀도 블록에 정의되지 않는다', () => {
    for (const n of ['1', '2', '3', '4', '5', '6']) {
      expect(compact.has(`--tui-gap-${n}`), `compact 가 gap-${n} 을 재정의했다`).toBe(false);
    }
    const fixed = parseCustomProperties(css, ':root');
    expect(fixed.get('--tui-gap-1')).toBe('4px');
    expect(fixed.get('--tui-gap-6')).toBe('32px');
  });

  it('두 밀도가 같은 pad 토큰 집합을 정의한다', () => {
    const pads = (m: Map<string, string>) => [...m.keys()].filter((k) => k.startsWith('--tui-pad-')).sort();
    expect(pads(compact)).toEqual(pads(comfortable));
  });

  it('block-gap 은 gap-6 으로 대체되어 사라졌다', () => {
    const density = readFileSync(resolve(root, 'src/styles/themes/density.css'), 'utf8');
    expect(density).not.toContain('--tui-block-gap');
  });
});
