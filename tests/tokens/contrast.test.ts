import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseCustomProperties } from '../helpers/css';
import { contrastRatio } from '../helpers/contrast';

const palette = parseCustomProperties(
  readFileSync(resolve(__dirname, '../../src/styles/palette.css'), 'utf8'),
  ':root',
);
const hex = (token: string) => {
  const v = palette.get(token);
  if (!v) throw new Error(`팔레트에 ${token} 이 없다`);
  return v;
};

const N = (step: string) => hex(`--tui-p-neutral-${step}`);

describe('대비 — WCAG AA', () => {
  it('본문: 라이트 4.5:1 이상', () => {
    expect(contrastRatio(N('1000'), N('0'))).toBeGreaterThanOrEqual(4.5);
  });

  it('본문: 다크 4.5:1 이상', () => {
    expect(contrastRatio(N('50'), N('950'))).toBeGreaterThanOrEqual(4.5);
  });

  it('보조 텍스트: 라이트/다크 모두 4.5:1 이상', () => {
    expect(contrastRatio(N('700'), N('0'))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(N('500'), N('950'))).toBeGreaterThanOrEqual(4.5);
  });

  it('위험 버튼: 흰 글자와 4.5:1 이상', () => {
    expect(contrastRatio(hex('--tui-p-danger-600'), N('0'))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(hex('--tui-p-danger-500'), N('0'))).toBeGreaterThanOrEqual(4.5);
  });

  it('상승/하락 글자: 각 바탕에서 4.5:1 이상', () => {
    expect(contrastRatio(hex('--tui-p-rise-500'), N('0'))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(hex('--tui-p-fall-500'), N('0'))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(hex('--tui-p-rise-400'), N('950'))).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(hex('--tui-p-fall-400'), N('950'))).toBeGreaterThanOrEqual(4.5);
  });

  it('힌트 텍스트: 3:1 이상 (비필수 정보의 하한)', () => {
    expect(contrastRatio(N('500'), N('0'))).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(N('600'), N('950'))).toBeGreaterThanOrEqual(3);
  });
});
