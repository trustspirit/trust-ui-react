import type { Preview } from '@storybook/react';
import '../src/styles/tokens.css';
import '../src/styles/theme-light.css';
import '../src/styles/theme-dark.css';
import '../src/styles/reset.css';

const preview: Preview = {
  parameters: {
    backgrounds: { disable: true },
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
