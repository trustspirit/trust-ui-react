import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SegmentedControl } from './SegmentedControl';

const meta: Meta<typeof SegmentedControl> = {
  title: 'Components/SegmentedControl',
  component: SegmentedControl,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof SegmentedControl>;

type Tab = 'overview' | 'activity' | 'settings';

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<Tab>('overview');
    return (
      <SegmentedControl<Tab>
        value={value}
        onChange={setValue}
        options={[
          { value: 'overview', label: 'Overview' },
          { value: 'activity', label: 'Activity' },
          { value: 'settings', label: 'Settings' },
        ]}
        aria-label="Section selector"
      />
    );
  },
};

export const Medium: Story = {
  render: () => {
    const [value, setValue] = useState<'day' | 'week' | 'month' | 'year'>('week');
    return (
      <SegmentedControl
        value={value}
        onChange={setValue}
        size="md"
        options={[
          { value: 'day', label: 'Day' },
          { value: 'week', label: 'Week' },
          { value: 'month', label: 'Month' },
          { value: 'year', label: 'Year' },
        ]}
      />
    );
  },
};

export const WithDisabled: Story = {
  render: () => {
    const [value, setValue] = useState<'a' | 'b' | 'c'>('a');
    return (
      <SegmentedControl
        value={value}
        onChange={setValue}
        options={[
          { value: 'a', label: 'Available' },
          { value: 'b', label: 'Pending', disabled: true },
          { value: 'c', label: 'Done' },
        ]}
      />
    );
  },
};
