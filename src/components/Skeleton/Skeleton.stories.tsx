import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from './Skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'Components/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  argTypes: {
    shape: {
      control: 'select',
      options: ['text', 'rect', 'circle'],
    },
    lines: { control: { type: 'number', min: 1, max: 8 } },
    width: { control: 'text' },
    height: { control: 'text' },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 360, width: '100%' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {};

export const Shapes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Skeleton shape="text" width="70%" />
      <Skeleton shape="rect" height={96} />
      <Skeleton shape="circle" width={48} />
    </div>
  ),
};

export const Lines: Story = {
  args: { lines: 3 },
};

export const ListItem: Story = {
  render: () => (
    <div aria-busy="true" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Skeleton shape="circle" width={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Skeleton lines={2} />
      </div>
    </div>
  ),
};
