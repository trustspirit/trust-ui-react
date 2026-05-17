import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'Components/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'danger', 'warning', 'info'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
    },
    dot: { control: 'boolean' },
  },
  args: {
    children: 'Badge',
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Badge color="primary">Primary</Badge>
      <Badge color="secondary">Secondary</Badge>
      <Badge color="success">Success</Badge>
      <Badge color="danger">Danger</Badge>
      <Badge color="warning">Warning</Badge>
      <Badge color="info">Info</Badge>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
    </div>
  ),
};

export const Dot: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Badge dot color="primary" />
      <Badge dot color="success" />
      <Badge dot color="danger" />
      <Badge dot color="warning" />
      <Badge dot color="info" />
    </div>
  ),
};

export const FillVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <Badge color="primary">Solid (default)</Badge>
        <Badge color="primary" variant="subtle">Subtle</Badge>
        <Badge color="primary" variant="outline">Outline</Badge>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Badge color="success" variant="subtle">Active</Badge>
        <Badge color="warning" variant="subtle">Pending</Badge>
        <Badge color="danger" variant="subtle">Failed</Badge>
      </div>
    </div>
  ),
};
