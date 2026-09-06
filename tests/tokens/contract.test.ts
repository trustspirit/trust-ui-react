import { describe, it, expect } from 'vitest';
import { readFileSync, globSync } from 'node:fs';
import { resolve } from 'node:path';
import { UNMIGRATED } from './unmigrated';

const root = resolve(__dirname, '../..');
const read = (f: string) => readFileSync(resolve(root, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const componentCss = globSync('src/components/**/*.module.css', { cwd: root }).sort();
const migrated = componentCss.filter((f) => !UNMIGRATED.includes(f));

/** v2 에서 사라진 토큰. 참조가 남아 있으면 조용히 색이 빠진다. */
const REMOVED = [
  '--tui-primary-gradient',
  '--tui-inset-highlight',
  '--tui-glass-bg',
  '--tui-glass-border',
  '--tui-glass-shadow',
  '--tui-glass-blur',
  '--tui-shadow-xs',
  '--tui-shadow-sm',
  '--tui-shadow-md',
  '--tui-shadow-lg',
  '--tui-shadow-xl',
  '--tui-ease-spring',
  '--tui-bg',
  '--tui-bg-subtle',
  '--tui-bg-muted',
  '--tui-bg-hover',
  '--tui-bg-active',
  '--tui-text',
  '--tui-text-secondary',
  '--tui-text-muted',
  '--tui-text-inverse',
  '--tui-border',
  '--tui-border-hover',
  '--tui-border-strong',
  '--tui-border-focus',
  '--tui-primary',
  '--tui-secondary',
  '--tui-info',
];

const RAW_COLOR = /(#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\()/i;

describe('토큰 계약', () => {
  it('마이그레이션한 파일은 사라진 토큰을 참조하지 않는다', () => {
    const bad: string[] = [];
    for (const f of migrated) {
      const css = read(f);
      for (const token of REMOVED) {
        // --tui-bg 가 --tui-bg-subtle 에 걸리지 않도록 경계를 붙인다.
        if (new RegExp(`${token}(?![\\w-])`).test(css)) bad.push(`${f} → ${token}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('마이그레이션한 파일은 원시 색을 직접 쓰지 않는다', () => {
    const bad = migrated.filter((f) => RAW_COLOR.test(read(f)));
    expect(bad).toEqual([]);
  });

  it('컴포넌트는 팔레트 층을 직접 참조하지 않는다', () => {
    const bad = componentCss.filter((f) => read(f).includes('--tui-p-'));
    expect(bad).toEqual([]);
  });

  it('허용목록에 실존하지 않는 파일이 남아 있지 않다', () => {
    expect(UNMIGRATED.filter((f) => !componentCss.includes(f))).toEqual([]);
  });

  it('금지된 시각 기법을 쓰지 않는다', () => {
    const bad: string[] = [];
    for (const f of migrated) {
      const css = read(f);
      if (/backdrop-filter/.test(css)) bad.push(`${f} → glassmorphism`);
      // Calendar.module.css 하나만 예외: 그라데이션으로 날짜 셀 절반을 칠해 범위 선택을 표시하는
      // 기능적 기법이지 장식이 아니다. 경로에 "Calendar"가 들어가는지가 아니라 정확히 이 파일인지로
      // 좁게 검사한다 — 느슨한 substring 매치는 향후 CalendarRange.module.css 같은 파일을
      // 조용히 통과시켜버릴 수 있다.
      if (/linear-gradient/.test(css) && !f.endsWith('/Calendar.module.css')) bad.push(`${f} → 장식용 그라데이션`);
      if (/translateY\(-/.test(css)) bad.push(`${f} → 호버 부상`);
    }
    expect(bad).toEqual([]);
  });
});
