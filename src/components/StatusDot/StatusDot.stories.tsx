import type { Meta, StoryObj } from '@storybook/react';
import { StatusDot } from './StatusDot';

const meta: Meta<typeof StatusDot> = {
  title: 'Components/StatusDot',
  component: StatusDot,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['neutral', 'success', 'warning', 'danger', 'accent'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
    },
    pulse: { control: 'boolean' },
    label: { control: 'text' },
  },
  args: {
    variant: 'success',
    label: 'Online',
  },
};

export default meta;
type Story = StoryObj<typeof StatusDot>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <StatusDot variant="neutral" label="Offline" />
      <StatusDot variant="success" label="Online" />
      <StatusDot variant="warning" label="Degraded" />
      <StatusDot variant="danger" label="Down" />
      <StatusDot variant="accent" label="New" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <StatusDot variant="success" label="Online" size="sm" />
      <StatusDot variant="success" label="Online" size="md" />
    </div>
  ),
};

export const Pulse: Story = {
  args: { pulse: true, label: 'Syncing' },
};

export const WithText: Story = {
  render: () => (
    <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
      <StatusDot variant="success" label="Online" pulse />
      <span>Payments API</span>
    </span>
  ),
};
