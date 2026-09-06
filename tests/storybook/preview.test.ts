import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// .storybook/preview.ts 는 어떤 다른 테스트도 커버하지 않는 영역이다.
// 여기서 v1 잔재(theme-light.css, theme-dark.css)를 계속 임포트하거나
// v2 체인의 순서가 깨지면, Storybook은 조용히 색이 없는 컴포넌트를 보여줄 뿐
// 에러를 내지 않는다. 그러면 사람이 "컴포넌트가 왜 무채색이지?"라는
// 유령 CSS 버그를 쫓아다니게 된다. 이를 막기 위한 회귀 테스트다.
const previewSource = readFileSync(
  resolve(__dirname, '../../.storybook/preview.ts'),
  'utf-8',
);

describe('.storybook/preview.ts', () => {
  it('v2 스타일 체인(palette, themes/light, themes/dark, themes/density, tokens)을 임포트한다', () => {
    expect(previewSource).toMatch(/styles\/palette\.css/);
    expect(previewSource).toMatch(/styles\/themes\/light\.css/);
    expect(previewSource).toMatch(/styles\/themes\/dark\.css/);
    expect(previewSource).toMatch(/styles\/themes\/density\.css/);
    expect(previewSource).toMatch(/styles\/tokens\.css/);
  });

  it('v1 잔재 파일(theme-light.css, theme-dark.css)은 임포트하지 않는다', () => {
    // themes/light.css 를 theme-light.css 로 오인하지 않도록 "theme-" 뒤에
    // 슬래시가 아닌 문자가 오는 v1 전용 패턴을 정확히 매칭한다.
    expect(previewSource).not.toMatch(/styles\/theme-light\.css/);
    expect(previewSource).not.toMatch(/styles\/theme-dark\.css/);
  });

  it('palette 가 테마 파일보다 먼저, 테마 파일이 tokens 보다 먼저 임포트된다', () => {
    const paletteIndex = previewSource.indexOf('styles/palette.css');
    const lightIndex = previewSource.indexOf('styles/themes/light.css');
    const darkIndex = previewSource.indexOf('styles/themes/dark.css');
    const tokensIndex = previewSource.indexOf('styles/tokens.css');

    expect(paletteIndex).toBeGreaterThanOrEqual(0);
    expect(lightIndex).toBeGreaterThanOrEqual(0);
    expect(darkIndex).toBeGreaterThanOrEqual(0);
    expect(tokensIndex).toBeGreaterThanOrEqual(0);

    expect(paletteIndex).toBeLessThan(lightIndex);
    expect(paletteIndex).toBeLessThan(darkIndex);
    expect(lightIndex).toBeLessThan(tokensIndex);
    expect(darkIndex).toBeLessThan(tokensIndex);
  });
});
