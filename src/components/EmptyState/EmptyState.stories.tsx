import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState } from './EmptyState';
import { Button } from '../Button';

const InboxIcon = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 18l4-11h16l4 11v7H4z" />
    <path d="M4 18h7l1.5 3h7L21 18h7" />
  </svg>
);

const meta: Meta<typeof EmptyState> = {
  title: 'Components/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  argTypes: {
    headingLevel: {
      control: 'select',
      options: [1, 2, 3, 4, 5, 6],
    },
    compact: { control: 'boolean' },
    title: { control: 'text' },
    description: { control: 'text' },
  },
  args: {
    title: 'No transactions yet',
    description: 'Transactions will appear here once you make your first transfer.',
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {};

export const WithIconAndActions: Story = {
  args: {
    icon: <InboxIcon />,
    actions: (
      <>
        <Button>Send money</Button>
        <Button variant="outline">Import history</Button>
      </>
    ),
  },
};

export const Compact: Story = {
  args: {
    compact: true,
    icon: <InboxIcon />,
    actions: (
      <>
        <Button>Send money</Button>
        <Button variant="outline">Import history</Button>
      </>
    ),
  },
  decorators: [
    (Story) => (
      <div style={{ width: 280, maxWidth: '100%', border: '1px solid var(--tui-rule)' }}>
        <Story />
      </div>
    ),
  ],
};

export const HeadingLevel: Story = {
  args: { headingLevel: 2 },
};
