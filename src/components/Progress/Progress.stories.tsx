import type { Meta, StoryObj } from '@storybook/react';
import { Progress } from './Progress';

const meta: Meta<typeof Progress> = {
  title: 'Components/Progress',
  component: Progress,
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
    },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'danger'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    indeterminate: { control: 'boolean' },
    showLabel: { control: 'boolean' },
  },
  args: {
    value: 60,
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 400, width: '100%' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Progress>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <Progress value={60} variant="primary" />
      <Progress value={45} variant="secondary" />
      <Progress value={80} variant="success" />
      <Progress value={30} variant="danger" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400 }}>
      <Progress value={60} size="sm" />
      <Progress value={60} size="md" />
      <Progress value={60} size="lg" />
    </div>
  ),
};

export const WithLabel: Story = {
  args: {
    value: 73,
    showLabel: true,
  },
};

export const Indeterminate: Story = {
  args: {
    indeterminate: true,
  },
};
