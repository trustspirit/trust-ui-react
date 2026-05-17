import type { Meta, StoryObj } from '@storybook/react';
import { SafeAreaView } from './SafeAreaView';

const meta: Meta<typeof SafeAreaView> = {
  title: 'Layout/SafeAreaView',
  component: SafeAreaView,
  tags: ['autodocs'],
  argTypes: {
    edges: {
      control: { type: 'check' },
      options: ['top', 'right', 'bottom', 'left'],
    },
  },
};
export default meta;
type Story = StoryObj<typeof SafeAreaView>;

export const AllEdges: Story = {
  args: {
    edges: ['top', 'right', 'bottom', 'left'],
    style: { background: 'var(--tui-primary-subtle)', minHeight: 200 },
    children: 'Padded by env(safe-area-inset-*) on all 4 edges.',
  },
};

export const BottomOnly: Story = {
  args: {
    edges: ['bottom'],
    style: { background: 'var(--tui-primary-subtle)', minHeight: 200 },
    children: 'Bottom padding only — e.g. for a screen-bottom toolbar.',
  },
};
