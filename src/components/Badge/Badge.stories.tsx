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
      <Badge variant="primary">Primary</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="danger">Danger</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="info">Info</Badge>
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
      <Badge dot variant="primary" />
      <Badge dot variant="success" />
      <Badge dot variant="danger" />
      <Badge dot variant="warning" />
      <Badge dot variant="info" />
    </div>
  ),
};

export const FillVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <Badge variant="primary">Solid (default)</Badge>
        <Badge variant="primary" fillStyle="subtle">Subtle</Badge>
        <Badge variant="primary" fillStyle="outline">Outline</Badge>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Badge variant="success" fillStyle="subtle">Active</Badge>
        <Badge variant="warning" fillStyle="subtle">Pending</Badge>
        <Badge variant="danger" fillStyle="subtle">Failed</Badge>
      </div>
    </div>
  ),
};
