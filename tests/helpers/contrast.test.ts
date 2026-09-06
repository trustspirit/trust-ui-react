import { describe, it, expect } from 'vitest';
import { contrastRatio } from './contrast';

describe('contrastRatio', () => {
  it('검정과 흰색은 21:1 이다', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
  });

  it('같은 색은 1:1 이다', () => {
    expect(contrastRatio('#8e8e8e', '#8e8e8e')).toBeCloseTo(1, 5);
  });

  it('순서를 바꿔도 같은 값이다', () => {
    expect(contrastRatio('#a81026', '#ffffff')).toBeCloseTo(contrastRatio('#ffffff', '#a81026'), 5);
  });

  it('3자리 hex 를 받는다', () => {
    expect(contrastRatio('#fff', '#000')).toBeCloseTo(21, 1);
  });
});
