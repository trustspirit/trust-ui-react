import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';
import { copyFileSync } from 'fs';

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      include: ['src'],
      exclude: ['**/*.stories.tsx'],
    }),
    // 시장색·호환 레이어는 선택 사항이라 index.ts가 임포트하지 않는다.
    // cssCodeSplit이 꺼져 있어 빌드가 이 파일들을 자동으로 못 만들므로 직접 복사한다.
    {
      name: 'copy-optional-layers',
      closeBundle() {
        copyFileSync(
          resolve(__dirname, 'src/styles/market.css'),
          resolve(__dirname, 'dist/market.css'),
        );
        copyFileSync(
          resolve(__dirname, 'src/styles/compat.css'),
          resolve(__dirname, 'dist/compat.css'),
        );
      },
    },
  ],
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'TrustUI',
      // 출력 형식과 파일명은 아래 rollupOptions.output 이 형식별로 정한다.
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: [
        {
          // ES: 소스 모듈을 파일 단위로 남긴다. 한 파일로 묶으면 최상위의 createContext()·
          // forwardRef() 호출 때문에 소비자 번들러가 안 쓰는 컴포넌트를 지우지 못한다.
          format: 'es',
          preserveModules: true,
          preserveModulesRoot: 'src',
          // package.json 의 module/exports.import 가 가리키는 진입점 이름은 그대로 둔다.
          entryFileNames: (chunk) => (chunk.name === 'index' ? 'index.es.js' : '[name].js'),
          // 훅·컨텍스트를 쓰는 라이브러리라 Next.js App Router 에서는 클라이언트 경계가 필요하다.
          banner: '"use client";',
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith('.css')) return 'styles.css';
            return assetInfo.name!;
          },
        },
        {
          // CommonJS 는 한 파일. package.json 이 "type": "module" 이므로 .cjs 여야 Node 가 CJS 로 읽는다.
          format: 'cjs',
          entryFileNames: 'index.cjs',
          banner: '"use client";',
          exports: 'named',
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith('.css')) return 'styles.css';
            return assetInfo.name!;
          },
        },
      ],
    },
    cssCodeSplit: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
