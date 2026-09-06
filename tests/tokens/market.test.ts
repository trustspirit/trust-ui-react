import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseCustomProperties } from '../helpers/css';

const root = resolve(__dirname, '../..');
const css = readFileSync(resolve(root, 'src/styles/market.css'), 'utf8');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));

describe('시장색 레이어', () => {
  it('한국식은 상승이 빨강, 하락이 파랑이다', () => {
    const kr = parseCustomProperties(css, ':root, [data-market="kr"]');
    expect(kr.get('--tui-rise')).toContain('rise');
    expect(kr.get('--tui-fall')).toContain('fall');
  });

  it('미국식은 상승이 초록이다', () => {
    const us = parseCustomProperties(css, '[data-market="us"]');
    expect(us.get('--tui-rise')).toContain('gain');
  });

  it('다크에서 밝은 단계로 올라간다', () => {
    expect(css).toContain('[data-theme="dark"]');
    expect(css).toContain('--tui-p-rise-400');
  });

  it('한 요소가 테마와 시장 속성을 함께 가져도 맞는 색을 준다', () => {
    // 자손 결합자만 있으면 <html data-theme="dark" data-market="us"> 에서 매치되지 않는다.
    expect(css).toContain('[data-theme="dark"][data-market="us"]');
    expect(css).toContain('[data-theme="dark"][data-market="kr"]');
  });

  it('코어 진입점에서 임포트하지 않는다', () => {
    const index = readFileSync(resolve(root, 'src/index.ts'), 'utf8');
    expect(index).not.toContain('market.css');
  });

  it('별도 경로로 배포된다', () => {
    expect(pkg.exports['./market.css']).toBe('./dist/market.css');
  });
});
