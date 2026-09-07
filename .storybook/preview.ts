import type { Preview } from '@storybook/react';

// Pretendard — 라이브러리는 더 이상 서체를 번들하지 않으므로 Storybook 자체가 소비자로서 임포트한다.
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
// src/index.ts 와 동일한 순서: palette → themes/light → themes/dark → themes/density → spacing → tokens → reset
import '../src/styles/palette.css';
import '../src/styles/themes/light.css';
import '../src/styles/themes/dark.css';
import '../src/styles/themes/density.css';
import '../src/styles/themes/spacing.css';
import '../src/styles/tokens.css';
import '../src/styles/reset.css';
// market.css 는 라이브러리가 임포트하지 않는 선택적 레이어다. Storybook 은 소비자이므로
// 시장(data-market) 축을 실제로 보려면 여기서 직접 임포트해야 한다.
import '../src/styles/market.css';

// Custom viewports for trust-ui v2 mobile testing matrix.
// See: docs/superpowers/specs/2026-05-17-modern-design-system-design.md §6-13.
const customViewports = {
  iphoneSE: {
    name: 'iPhone SE (375×667)',
    styles: { width: '375px', height: '667px' },
    type: 'mobile',
  },
  iphone15Pro: {
    name: 'iPhone 15 Pro (393×852)',
    styles: { width: '393px', height: '852px' },
    type: 'mobile',
  },
  androidSmall: {
    name: 'Android small (360×640)',
    styles: { width: '360px', height: '640px' },
    type: 'mobile',
  },
  androidLarge: {
    name: 'Android Pixel (412×915)',
    styles: { width: '412px', height: '915px' },
    type: 'mobile',
  },
  ipad: {
    name: 'iPad (768×1024)',
    styles: { width: '768px', height: '1024px' },
    type: 'tablet',
  },
  desktop: {
    name: 'Desktop (1280×800)',
    styles: { width: '1280px', height: '800px' },
    type: 'desktop',
  },
} as const;

const preview: Preview = {
  parameters: {
    backgrounds: { disable: true },
    viewport: {
      viewports: customViewports,
    },
    a11y: {
      config: {
        rules: [
          // Project-wide allowances or overrides go here.
        ],
      },
      manual: false,
    },
  },
  globalTypes: {
    theme: {
      description: '명암',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
    density: {
      description: '밀도',
      defaultValue: 'comfortable',
      toolbar: { icon: 'component', items: ['comfortable', 'compact'], dynamicTitle: true },
    },
    market: {
      description: '시장 관례',
      defaultValue: 'kr',
      toolbar: { icon: 'globe', items: ['kr', 'us'], dynamicTitle: true },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || 'light';
      document.documentElement.setAttribute('data-theme', theme);
      return Story();
    },
    // data-density, data-market 축 — 밀도·시장 스토리북 툴바에서 전환할 수 있도록 한다.
    (Story, context) => {
      const root = document.documentElement;
      root.setAttribute('data-density', context.globals.density);
      root.setAttribute('data-market', context.globals.market);
      return Story();
    },
  ],
};

export default preview;
