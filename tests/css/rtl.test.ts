import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { parseCustomProperties } from '../helpers/css';

const srcDir = resolve(__dirname, '../../src');

function cssFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return cssFiles(full);
    return name.endsWith('.css') ? [full] : [];
  });
}

/**
 * 물리 방향이 맞는 자리. 기기의 실제 가장자리(안전 영역)나 화면 좌표에 묶인 것들이다.
 * 여기에 없는 물리 속성은 RTL 에서 뒤집히지 않아 레이아웃이 어긋난다.
 */
const PHYSICAL_BY_DESIGN = [
  // 안전 영역은 기기의 물리적 좌·우 가장자리다.
  'components/layout/SafeAreaView/SafeAreaView.module.css',
  'components/Dialog/Dialog.module.css',
  // v1 호환 층은 v1 의 물리 속성 이름을 그대로 별칭한다.
  'styles/compat.css',
];

describe('RTL 계약', () => {
  it('글 방향에 따라 뒤집혀야 하는 속성을 물리 방향으로 쓰지 않는다', () => {
    const offenders: string[] = [];
    const physical =
      /(^|[\s;{])((margin|padding)-(left|right)\s*:|text-align\s*:\s*(left|right)\b|float\s*:\s*(left|right)\b)/;
    for (const file of cssFiles(srcDir)) {
      const rel = relative(srcDir, file);
      if (PHYSICAL_BY_DESIGN.includes(rel)) continue;
      readFileSync(file, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
        .split('\n')
        .forEach((line, i) => {
          if (physical.test(line)) offenders.push(`${rel}:${i + 1}: ${line.trim()}`);
        });
    }
    expect(offenders).toEqual([]);
  });

  it('--tui-dir 는 기본 1 이고 dir="rtl" 아래에서 -1 이다', () => {
    const css = readFileSync(join(srcDir, 'styles/tokens.css'), 'utf8');
    expect(parseCustomProperties(css, ':root').get('--tui-dir')).toBe('1');
    expect(parseCustomProperties(css, "[dir='rtl']").get('--tui-dir')).toBe('-1');
  });
});
