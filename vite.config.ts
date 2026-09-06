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
    // 시장색 레이어는 선택 사항이라 index.ts가 임포트하지 않는다.
    // cssCodeSplit이 꺼져 있어 빌드가 이 파일을 자동으로 못 만들므로 직접 복사한다.
    {
      name: 'copy-optional-layers',
      closeBundle() {
        copyFileSync(
          resolve(__dirname, 'src/styles/market.css'),
          resolve(__dirname, 'dist/market.css'),
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
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'es' : 'cjs'}.js`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) return 'styles.css';
          return assetInfo.name!;
        },
      },
    },
    cssCodeSplit: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
