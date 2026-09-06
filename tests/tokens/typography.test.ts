import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { parseCustomProperties } from '../helpers/css';

const root = resolve(__dirname, '../..');
const stylesDir = resolve(root, 'src/styles');
const tokens = parseCustomProperties(
  readFileSync(resolve(root, 'src/styles/tokens.css'), 'utf8'),
  ':root',
);
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));

/** src/styles 아래 모든 CSS 파일을 재귀적으로 모은다. */
function collectCssFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return collectCssFiles(full);
    return entry.name.endsWith('.css') ? [full] : [];
  });
}

const styleFiles = collectCssFiles(stylesDir);
const styleContents = styleFiles.map((f) => readFileSync(f, 'utf8')).join('\n');

describe('타이포그래피', () => {
  it('폰트 스택 첫머리가 Pretendard Variable 이다', () => {
    expect(tokens.get('--tui-font-sans')).toMatch(/^'Pretendard Variable'/);
  });

  it('한글 폴백이 스택에 들어 있다', () => {
    expect(tokens.get('--tui-font-sans')).toContain('Apple SD Gothic Neo');
  });

  it('본문 행간이 한글에 맞게 넉넉하다', () => {
    expect(parseFloat(tokens.get('--tui-line-height-body')!)).toBeGreaterThanOrEqual(1.6);
  });

  it('Geist 흔적이 남아 있지 않다', () => {
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(Object.keys(deps).some((d) => d.includes('geist'))).toBe(false);
    expect(styleContents.toLowerCase()).not.toContain('geist');
  });

  // 서체 바이너리를 라이브러리에 번들하면 dist/styles.css 가 92개 서브셋을
  // 전부 base64 로 안고 3.9MB 로 부풀고, unicode-range 서브셋팅의 이점이
  // 사라진다. 서체는 소비자가 직접 임포트해야 하므로, 여기서 폰트 패키지를
  // @import 하는 흔적이 다시 생기면 실패해야 한다.
  it('서체 파일을 다시 번들하지 않는다 — 소비자가 직접 임포트한다', () => {
    const fontImportPattern = /@import\s+['"][^'"]*(?:pretendard|fontsource)[^'"]*['"]/i;
    expect(styleContents).not.toMatch(fontImportPattern);
  });
});
