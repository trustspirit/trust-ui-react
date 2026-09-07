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

/**
 * 표면 자체를 찍기 위한 스토리 — 트리거를 누르지 않고 open=true 로 바로 연다.
 * 불투명한 시트, 위쪽 모서리만 둥근 라운드, 오버레이 그림자, 그 뒤 어둠막을
 * 시각 회귀가 실제로 잡을 수 있게 한다.
 */
export const Open: Story = {
  render: () => (
    <BottomSheet open onClose={() => {}}>
      <h3 style={{ marginTop: 0 }}>Bottom sheet surface</h3>
      <p style={{ color: 'var(--tui-ink-2)' }}>
        An opaque sheet with rounded top corners and a square bottom, rising
        from the edge it belongs to.
      </p>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <Button variant="outline" fullWidth>
          Cancel
        </Button>
        <Button variant="primary" fullWidth>
          Confirm
        </Button>
      </div>
    </BottomSheet>
  ),
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
