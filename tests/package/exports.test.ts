import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname, '../..');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const viteConfig = readFileSync(resolve(root, 'vite.config.ts'), 'utf8');

describe('package entry points', () => {
  // "type": "module" 인 패키지에서 .js 는 ESM 으로 해석된다. CommonJS 파일은
  // .cjs 확장자를 써야 Node 가 CJS 로 읽는다. 그렇지 않으면 require() 가
  // 예외를 던지거나(구버전 Node) 빈 객체를 돌려준다(require(esm) 지원 버전).
  it('CommonJS 진입점은 .cjs 확장자를 쓴다', () => {
    expect(pkg.type).toBe('module');
    expect(pkg.main).toMatch(/\.cjs$/);
    expect(pkg.exports['.'].require).toMatch(/\.cjs$/);
  });

  it('main 과 exports.require 가 같은 파일을 가리킨다', () => {
    expect(pkg.exports['.'].require).toBe(pkg.main);
  });

  it('빌드 설정이 package.json 이 가리키는 파일명을 만든다', () => {
    const cjsName = pkg.main.replace('./dist/', '');
    const esName = pkg.module.replace('./dist/', '');
    expect(viteConfig).toContain(`'${cjsName}'`);
    expect(viteConfig).toContain(`'${esName}'`);
  });

  // 훅과 컨텍스트를 쓰는 컴포넌트 라이브러리는 Next.js App Router 의 서버
  // 컴포넌트에서 바로 import 될 수 있어야 한다.
  it('번들 맨 앞에 "use client" 지시어를 넣는다', () => {
    expect(viteConfig).toMatch(/banner:\s*'"use client";'/);
  });

  it('선언한 라이선스의 파일이 저장소에 있다', () => {
    expect(pkg.license).toBe('MIT');
    expect(existsSync(resolve(root, 'LICENSE'))).toBe(true);
  });
});
