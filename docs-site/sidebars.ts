import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      items: ['getting-started/installation', 'getting-started/theming'],
    },
    {
      type: 'category',
      label: 'Components',
      items: [
        {
          type: 'category',
          label: 'Basic',
          items: [
            'components/button',
            'components/badge',
            'components/avatar',
            'components/chip',
            'components/progress',
            'components/tooltip',
          ],
        },
        {
          type: 'category',
          label: 'Form',
          items: [
            'components/text-field',
            'components/checkbox',
            'components/radio',
            'components/switch',
            'components/select',
            'components/slider',
            'components/file-upload',
          ],
        },
        {
          type: 'category',
          label: 'Overlay & Feedback',
          items: [
            'components/dialog',
            'components/toast',
            'components/menu',
            'components/table',
            'components/pagination',
            'components/tabs',
          ],
        },
        {
          type: 'category',
          label: 'Date',
          items: [
            'components/date-picker',
            'components/calendar',
            'components/date-range-picker',
          ],
        },
        {
          type: 'category',
          label: 'Mobile',
          items: [
            'components/bottom-sheet',
            'components/action-sheet',
            'components/segmented-control',
          ],
        },
        {
          type: 'category',
          label: 'Layout',
          items: ['components/expander'],
        },
      ],
    },
    {
      type: 'category',
      label: 'Design Tokens',
      items: [
        'design-tokens/colors',
        'design-tokens/spacing',
        'design-tokens/typography',
        'design-tokens/motion',
        'design-tokens/elevation',
      ],
    },
  ],
};

export default sidebars;
