import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseCustomProperties } from '../helpers/css';

const root = resolve(__dirname, '../..');
const fonts = readFileSync(resolve(root, 'src/styles/fonts.css'), 'utf8');
const tokens = parseCustomProperties(
  readFileSync(resolve(root, 'src/styles/tokens.css'), 'utf8'),
  ':root',
);
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));

describe('타이포그래피', () => {
  it('Pretendard 를 번들한다 — CDN 에 의존하지 않는다', () => {
    expect(fonts).toContain('pretendard');
    expect(fonts).not.toContain('http');
  });

  it('Geist 흔적이 남아 있지 않다', () => {
    expect(fonts.toLowerCase()).not.toContain('geist');
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(Object.keys(deps).some((d) => d.includes('geist'))).toBe(false);
  });

  it('폰트 스택 첫머리가 Pretendard Variable 이다', () => {
    expect(tokens.get('--tui-font-sans')).toMatch(/^'Pretendard Variable'/);
  });

  it('한글 폴백이 스택에 들어 있다', () => {
    expect(tokens.get('--tui-font-sans')).toContain('Apple SD Gothic Neo');
  });

  it('본문 행간이 한글에 맞게 넉넉하다', () => {
    expect(parseFloat(tokens.get('--tui-line-height-body')!)).toBeGreaterThanOrEqual(1.6);
  });
});
