import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { BottomSheet } from './BottomSheet';
import { Button } from '../Button';

const meta: Meta<typeof BottomSheet> = {
  title: 'Components/BottomSheet',
  component: BottomSheet,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof BottomSheet>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>Open sheet</Button>
        <BottomSheet open={open} onClose={() => setOpen(false)}>
          <h3 style={{ marginTop: 0 }}>Bottom sheet</h3>
          <p style={{ color: 'var(--tui-text-secondary)' }}>
            Drag the handle up or down. Swipe down past 60% of the smallest snap to dismiss.
          </p>
        </BottomSheet>
      </>
    );
  },
};

export const TwoSnapPoints: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>Open with snap points</Button>
        <BottomSheet
          open={open}
          onClose={() => setOpen(false)}
          snapPoints={[0.4, 0.9]}
          initialSnap={0}
        >
          <h3 style={{ marginTop: 0 }}>Drag to expand</h3>
          <p style={{ color: 'var(--tui-text-secondary)' }}>
            Snap points: 40% and 90% of viewport height. Drag handle up to expand,
            down to compact or dismiss.
          </p>
          <ul>
            {Array.from({ length: 25 }, (_, i) => (
              <li key={i}>List item {i + 1}</li>
            ))}
          </ul>
        </BottomSheet>
      </>
    );
  },
};

export const WithoutHandle: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>Open without handle</Button>
        <BottomSheet
          open={open}
          onClose={() => setOpen(false)}
          showHandle={false}
        >
          <h3 style={{ marginTop: 0 }}>No drag handle</h3>
          <p style={{ color: 'var(--tui-text-secondary)' }}>
            Only backdrop tap or ESC dismisses (no swipe gesture).
          </p>
          <Button variant="outline" onClick={() => setOpen(false)} fullWidth>Close</Button>
        </BottomSheet>
      </>
    );
  },
};
