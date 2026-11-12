import type { Meta, StoryObj } from '@storybook/react';
import { Banner } from './Banner';
import { Button } from '../Button';

const meta: Meta<typeof Banner> = {
  title: 'Components/Banner',
  component: Banner,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['info', 'success', 'warning', 'danger'],
    },
    role: {
      control: 'select',
      options: [undefined, 'status', 'alert'],
    },
    title: { control: 'text' },
    description: { control: 'text' },
    dismissLabel: { control: 'text' },
  },
  args: {
    status: 'info',
    title: 'Scheduled maintenance on Sunday',
    description: 'Transfers will be unavailable between 02:00 and 04:00.',
  },
};

export default meta;
type Story = StoryObj<typeof Banner>;

export const Default: Story = {};

export const Statuses: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Banner status="info" title="Scheduled maintenance on Sunday" />
      <Banner status="success" title="Your identity has been verified" />
      <Banner status="warning" title="Your card expires this month" />
      <Banner status="danger" title="We could not process your last payment" />
    </div>
  ),
};

export const WithActions: Story = {
  args: {
    status: 'warning',
    title: 'Your card expires this month',
    description: 'Update your payment method to avoid an interruption.',
    actions: (
      <>
        <Button size="sm" variant="outline">
          Later
        </Button>
        <Button size="sm">Update card</Button>
      </>
    ),
  },
};

export const Dismissible: Story = {
  args: {
    onDismiss: () => {},
  },
};

export const Narrow: Story = {
  ...WithActions,
  args: { ...WithActions.args, onDismiss: () => {} },
  decorators: [
    (Story) => (
      <div style={{ width: 320, maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
};

export const WithoutIcon: Story = {
  args: { icon: null },
};
