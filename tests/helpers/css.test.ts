import { describe, it, expect } from 'vitest';
import { parseCustomProperties } from './css';

describe('parseCustomProperties', () => {
  it('셀렉터 블록 안의 커스텀 프로퍼티를 뽑는다', () => {
    const css = `:root { --a: #fff; --b: 4px; }`;
    const got = parseCustomProperties(css, ':root');
    expect(got.get('--a')).toBe('#fff');
    expect(got.get('--b')).toBe('4px');
  });

  it('다른 셀렉터의 선언은 섞지 않는다', () => {
    const css = `:root { --a: 1px; } [data-theme='dark'] { --a: 2px; }`;
    expect(parseCustomProperties(css, ':root').get('--a')).toBe('1px');
    expect(parseCustomProperties(css, "[data-theme='dark']").get('--a')).toBe('2px');
  });

  it('주석을 무시한다', () => {
    const css = `:root { /* --fake: 0; */ --real: 1; }`;
    const got = parseCustomProperties(css, ':root');
    expect(got.has('--fake')).toBe(false);
    expect(got.get('--real')).toBe('1');
  });

  it('쉼표가 든 값을 통째로 보존한다', () => {
    const css = `:root { --s: 0 1px 1px rgba(0,0,0,.04), 0 10px 30px -12px rgba(0,0,0,.22); }`;
    expect(parseCustomProperties(css, ':root').get('--s')).toContain('rgba(0,0,0,.22)');
  });

  it('없는 셀렉터에는 빈 Map을 준다', () => {
    expect(parseCustomProperties(`:root { --a: 1; }`, '.nope').size).toBe(0);
  });

  it('여러 줄에 걸친 셀렉터 목록을 잡는다', () => {
    // 실제 테마 파일이 이 형태로 쓰인다. 줄바꿈을 공백처럼 다뤄야 한다.
    const css = `:root,\n[data-theme="light"] {\n  --tui-paper: #fff;\n}`;
    expect(parseCustomProperties(css, ':root, [data-theme="light"]').get('--tui-paper')).toBe('#fff');
  });

  it('@media 안쪽 블록도 잡는다', () => {
    const css = `@media (pointer: coarse) {\n  :root {\n    --h: 44px;\n  }\n}`;
    expect(parseCustomProperties(css, ':root').get('--h')).toBe('44px');
  });
});
