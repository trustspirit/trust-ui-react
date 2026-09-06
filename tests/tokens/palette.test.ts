import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseCustomProperties } from '../helpers/css';

const css = readFileSync(resolve(__dirname, '../../src/styles/palette.css'), 'utf8');
const p = parseCustomProperties(css, ':root');

describe('팔레트 층', () => {
  it('뉴트럴 14단계가 스펙 값과 일치한다', () => {
    const expected: Record<string, string> = {
      '--tui-p-neutral-0': '#ffffff',
      '--tui-p-neutral-50': '#f6f6f6',
      '--tui-p-neutral-100': '#ededed',
      '--tui-p-neutral-200': '#e4e4e4',
      '--tui-p-neutral-300': '#c9c9c9',
      '--tui-p-neutral-400': '#a8a8a8',
      '--tui-p-neutral-500': '#8e8e8e',
      '--tui-p-neutral-600': '#6e6e6e',
      '--tui-p-neutral-700': '#5a5a5a',
      '--tui-p-neutral-800': '#3d3d3d',
      '--tui-p-neutral-850': '#262626',
      '--tui-p-neutral-900': '#1a1a1a',
      '--tui-p-neutral-950': '#0d0d0d',
      '--tui-p-neutral-1000': '#000000',
    };
    for (const [name, value] of Object.entries(expected)) {
      expect(p.get(name), name).toBe(value);
    }
  });

  it('뉴트럴은 모두 무채색이다 (R=G=B)', () => {
    for (const [name, value] of p) {
      if (!name.startsWith('--tui-p-neutral-')) continue;
      const m = value.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
      expect(m, `${name} 은 6자리 hex 여야 한다`).not.toBeNull();
      expect(m![1], `${name} 에 색조가 섞였다`).toBe(m![2]);
      expect(m![2], `${name} 에 색조가 섞였다`).toBe(m![3]);
    }
  });

  it('시장색과 위험색이 스펙 값과 일치한다', () => {
    expect(p.get('--tui-p-rise-500')).toBe('#d92f45');
    expect(p.get('--tui-p-rise-400')).toBe('#ff5c6e');
    expect(p.get('--tui-p-fall-500')).toBe('#1f62d9');
    expect(p.get('--tui-p-fall-400')).toBe('#5b92ff');
    expect(p.get('--tui-p-gain-500')).toBe('#0f8a4d');
    expect(p.get('--tui-p-gain-400')).toBe('#35c47c');
    expect(p.get('--tui-p-danger-700')).toBe('#8a0c1e');
    expect(p.get('--tui-p-danger-600')).toBe('#a81026');
    expect(p.get('--tui-p-danger-500')).toBe('#c9273c');
    expect(p.get('--tui-p-danger-400')).toBe('#dd3a4f');
  });

  it('팔레트는 다른 토큰을 참조하지 않는다', () => {
    for (const [name, value] of p) {
      expect(value, `${name} 이 var() 를 참조한다`).not.toContain('var(');
    }
  });
});
