import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip } from './Tooltip';
import { Button } from '../Button';

const meta: Meta<typeof Tooltip> = {
  title: 'Overlay/Tooltip',
  component: Tooltip,
  argTypes: {
    placement: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
    },
    variant: {
      control: 'select',
      options: ['dark', 'light'],
    },
    delay: { control: 'number' },
    maxWidth: { control: 'number' },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: 100, display: 'flex', justifyContent: 'center' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: () => (
    <Tooltip content="This is a tooltip">
      <Button>Hover me</Button>
    </Tooltip>
  ),
};

export const Placements: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>
      <Tooltip content="Top tooltip" placement="top">
        <Button>Top</Button>
      </Tooltip>
      <div style={{ display: 'flex', gap: 80 }}>
        <Tooltip content="Left tooltip" placement="left">
          <Button>Left</Button>
        </Tooltip>
        <Tooltip content="Right tooltip" placement="right">
          <Button>Right</Button>
        </Tooltip>
      </div>
      <Tooltip content="Bottom tooltip" placement="bottom">
        <Button>Bottom</Button>
      </Tooltip>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16 }}>
      <Tooltip content="Dark variant (default)" variant="dark">
        <Button>Dark</Button>
      </Tooltip>
      <Tooltip content="Light variant" variant="light">
        <Button variant="outline">Light</Button>
      </Tooltip>
    </div>
  ),
};

export const LongContent: Story = {
  render: () => (
    <Tooltip
      content="This is a tooltip with a longer description. It demonstrates how the tooltip wraps text when the content exceeds the maximum width."
      maxWidth={200}
    >
      <Button>Long content</Button>
    </Tooltip>
  ),
};

export const CustomDelay: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16 }}>
      <Tooltip content="No delay" delay={0}>
        <Button>Instant (0ms)</Button>
      </Tooltip>
      <Tooltip content="Default delay" delay={200}>
        <Button>Default (200ms)</Button>
      </Tooltip>
      <Tooltip content="Slow delay" delay={800}>
        <Button>Slow (800ms)</Button>
      </Tooltip>
    </div>
  ),
};
