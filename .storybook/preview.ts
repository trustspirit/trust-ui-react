import type { Preview } from '@storybook/react';

import '../src/styles/fonts.css';
import '../src/styles/tokens.css';
import '../src/styles/theme-light.css';
import '../src/styles/theme-dark.css';
import '../src/styles/surfaces.css';
import '../src/styles/reset.css';

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
      description: 'Global theme',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || 'light';
      document.documentElement.setAttribute('data-theme', theme);
      return Story();
    },
  ],
};

export default preview;
