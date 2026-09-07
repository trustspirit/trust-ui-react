import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseCustomProperties } from '../helpers/css';

const read = (p: string) => readFileSync(resolve(__dirname, '../../src/styles', p), 'utf8');
const light = parseCustomProperties(read('themes/light.css'), ':root, [data-theme="light"]');
const dark = parseCustomProperties(read('themes/dark.css'), '[data-theme="dark"]');
const tokens = parseCustomProperties(read('tokens.css'), ':root');

const SEMANTIC = [
  '--tui-paper', '--tui-sheet', '--tui-field',
  '--tui-ink', '--tui-ink-2', '--tui-ink-3',
  '--tui-rule', '--tui-rule-strong', '--tui-on-ink',
  '--tui-danger', '--tui-danger-hover', '--tui-on-danger',
  '--tui-success', '--tui-warning',
  '--tui-shadow-overlay', '--tui-scrim',
];

describe('시맨틱 층', () => {
  it('라이트와 다크가 같은 토큰 집합을 정의한다', () => {
    for (const name of SEMANTIC) {
      expect(light.has(name), `light 에 ${name} 이 없다`).toBe(true);
      expect(dark.has(name), `dark 에 ${name} 이 없다`).toBe(true);
    }
  });

  it('테마는 팔레트만 참조하고 원시 색을 직접 쓰지 않는다', () => {
    for (const map of [light, dark]) {
      for (const [name, value] of map) {
        if (name === '--tui-shadow-overlay' || name === '--tui-scrim') continue; // 알파 합성 허용
        expect(value, `${name} 이 원시 색을 직접 쓴다`).not.toMatch(/#[0-9a-f]{3,8}\b/i);
      }
    }
  });

  it('바탕과 글자가 스펙대로 매핑된다', () => {
    expect(light.get('--tui-paper')).toContain('--tui-p-neutral-0');
    expect(light.get('--tui-ink')).toContain('--tui-p-neutral-1000');
    expect(dark.get('--tui-paper')).toContain('--tui-p-neutral-950');
    expect(dark.get('--tui-ink')).toContain('--tui-p-neutral-50');
  });

  it('액센트 기본값은 잉크다 — 코어는 완전 무채색이다', () => {
    expect(tokens.get('--tui-accent')).toBe('var(--tui-ink)');
    expect(tokens.get('--tui-on-accent')).toBe('var(--tui-on-ink)');
  });

  it('라운드는 4단계뿐이다', () => {
    expect(tokens.get('--tui-radius-tight')).toBe('4px');
    expect(tokens.get('--tui-radius-control')).toBe('6px');
    expect(tokens.get('--tui-radius-sheet')).toBe('10px');
    expect(tokens.get('--tui-radius-full')).toBe('9999px');
    const radii = [...tokens.keys()].filter((k) => k.startsWith('--tui-radius-'));
    expect(radii).toHaveLength(4);
  });

  it('그림자는 오버레이 하나뿐이다', () => {
    const shadows = [...light.keys(), ...dark.keys(), ...tokens.keys()].filter((k) => k.startsWith('--tui-shadow'));
    expect(new Set(shadows)).toEqual(new Set(['--tui-shadow-overlay']));
  });

  it('스프링 이징이 없다', () => {
    expect([...tokens.keys()].some((k) => k.includes('spring'))).toBe(false);
    expect(tokens.get('--tui-ease-out')).toBe('cubic-bezier(0.2, 0, 0, 1)');
  });

  it('시장색은 코어에 없다 — 별도 레이어다', () => {
    for (const map of [light, dark, tokens]) {
      expect([...map.keys()].some((k) => k.includes('rise') || k.includes('fall'))).toBe(false);
    }
  });
});
