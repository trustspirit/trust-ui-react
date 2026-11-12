import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Divider } from './Divider';

const meta: Meta<typeof Divider> = {
  title: 'Layout/Divider',
  component: Divider,
  tags: ['autodocs'],
  argTypes: {
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    variant: { control: 'inline-radio', options: ['subtle', 'strong'] },
    label: { control: 'text' },
    decorative: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<typeof Divider>;

const text: CSSProperties = {
  margin: 0,
  color: 'var(--tui-ink-2)',
  fontSize: 'var(--tui-font-size-body)',
};

const column: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--tui-gap-4)',
  maxWidth: 360,
};

export const Default: Story = {
  render: (args) => (
    <div style={column}>
      <p style={text}>Shipping address</p>
      <Divider {...args} />
      <p style={text}>Payment method</p>
    </div>
  ),
};

export const Strong: Story = {
  args: { variant: 'strong' },
  render: Default.render,
};

export const WithLabel: Story = {
  args: { label: 'or' },
  render: (args) => (
    <div style={column}>
      <p style={text}>Continue with email</p>
      <Divider {...args} />
      <p style={text}>Continue with a passkey</p>
    </div>
  ),
};

export const LongLabel: Story = {
  render: () => (
    <div style={{ ...column, maxWidth: 320 }}>
      <Divider label="Messages older than thirty days are archived automatically" />
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--tui-gap-3)' }}>
      <span style={text}>Edit</span>
      <Divider orientation="vertical" />
      <span style={text}>Duplicate</span>
      <Divider orientation="vertical" variant="strong" />
      <span style={text}>Archive</span>
    </div>
  ),
};

/** Skipped by assistive technology — the headings already convey the structure. */
export const Decorative: Story = {
  args: { decorative: true },
  render: Default.render,
};
