import type { Meta, StoryObj } from '@storybook/react';
import { StickyFooter } from './StickyFooter';
import { Button } from '../../Button';

const meta: Meta<typeof StickyFooter> = {
  title: 'Layout/StickyFooter',
  component: StickyFooter,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof StickyFooter>;

export const Default: Story = {
  render: () => (
    <div style={{ height: 600, overflow: 'auto', border: '1px solid var(--tui-border)' }}>
      <div style={{ height: 800, padding: 24 }}>
        Scroll down — the footer below stays anchored.
      </div>
      <StickyFooter>
        <Button variant="primary" fullWidth size="lg">Continue</Button>
      </StickyFooter>
    </div>
  ),
};

export const Elevated: Story = {
  render: () => (
    <div style={{ height: 600, overflow: 'auto', border: '1px solid var(--tui-border)' }}>
      <div style={{ height: 800, padding: 24 }}>Scrollable content</div>
      <StickyFooter elevated>
        <Button variant="primary" fullWidth size="lg">Confirm</Button>
      </StickyFooter>
    </div>
  ),
};
