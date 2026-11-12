import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const srcDir = resolve(__dirname, '../../src');

function cssFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return cssFiles(full);
    return name.endsWith('.css') ? [full] : [];
  });
}

/** 주석을 지운 뒤 가장 안쪽 규칙들의 셀렉터 목록을 돌려준다. */
function selectorLists(css: string): string[] {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  return [...stripped.matchAll(/([^{}]*)\{[^{}]*\}/g)].map((m) => m[1].trim());
}

describe('CSS 셀렉터 계약', () => {
  // 단위 테스트는 CSS 를 파싱하지 않는다. 닫는 괄호 하나가 남으면 번들러만 실패한다.
  it('모든 스타일시트의 중괄호가 짝이 맞는다', () => {
    const offenders: string[] = [];
    for (const file of cssFiles(srcDir)) {
      const css = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      let depth = 0;
      let broken = false;
      for (const ch of css) {
        if (ch === '{') depth++;
        if (ch === '}') depth--;
        if (depth < 0) broken = true;
      }
      if (broken || depth !== 0) offenders.push(relative(srcDir, file));
    }
    expect(offenders).toEqual([]);
  });

  // 브라우저는 셀렉터 목록에 모르는 의사 요소가 하나라도 있으면 규칙 전체를 버린다.
  // Blink/WebKit 은 ::-moz-* 를, Gecko 는 ::-webkit-slider-* 를 모른다.
  it('한 셀렉터 목록에 ::-webkit- 과 ::-moz- 의사 요소를 섞지 않는다', () => {
    const offenders: string[] = [];
    for (const file of cssFiles(srcDir)) {
      for (const list of selectorLists(readFileSync(file, 'utf8'))) {
        if (list.includes('::-webkit-') && list.includes('::-moz-')) {
          offenders.push(`${relative(srcDir, file)}: ${list.replace(/\s+/g, ' ')}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  // shape_* 클래스는 .inputWrapper 와 같은 요소에 붙는다(TextField.tsx 의
  // wrapperClassNames). 후손 결합자로 쓰면 어떤 요소에도 걸리지 않는다.
  it('TextField 의 shape 규칙은 inputWrapper 와 같은 요소를 겨냥한다', () => {
    const css = readFileSync(join(srcDir, 'components/TextField/TextField.module.css'), 'utf8');
    const lists = selectorLists(css);
    for (const shape of ['square', 'rounded', 'pill']) {
      expect(lists).toContain(`.inputWrapper.shape_${shape}`);
      expect(lists).not.toContain(`.shape_${shape} .inputWrapper`);
    }
  });

  // 컴포넌트는 포커스를 box-shadow 링으로 그리고 outline 은 끈다. 강제 색상 모드
  // (Windows 고대비)는 box-shadow 를 지우므로, 그 모드에서는 outline 을 되살려야
  // 키보드 포커스가 보인다(WCAG 2.4.7).
  it('강제 색상 모드에서 포커스 outline 을 되살린다', () => {
    const css = readFileSync(join(srcDir, 'styles/tokens.css'), 'utf8').replace(/\s+/g, ' ');
    expect(css).toMatch(
      /@media \(forced-colors: active\) \{ :focus-visible \{ outline: 2px solid Highlight !important;/,
    );
  });
});
