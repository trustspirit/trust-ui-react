import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Popover } from './Popover';
import { Button } from '../Button';

const meta: Meta = {
  title: 'Overlay/Popover',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ padding: 80 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj;

const Body = () => (
  <div style={{ display: 'grid', gap: 8, maxWidth: 240 }}>
    <strong>Settlement date</strong>
    <span style={{ color: 'var(--tui-ink-2)' }}>
      Trades settle two business days after execution. Funds are available the morning after.
    </span>
  </div>
);

export const Default: Story = {
  render: () => (
    <Popover content={<Body />}>
      <Button variant="outline">Details</Button>
    </Popover>
  ),
};

/** 표면 자체를 찍기 위한 스토리 — 트리거를 누르지 않고 defaultOpen 으로 바로 연다. */
export const Open: Story = {
  render: () => (
    <Popover content={<Body />} defaultOpen presentation="popover">
      <Button variant="outline">Details</Button>
    </Popover>
  ),
};

export const Placements: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {(['bottom', 'top', 'left', 'right'] as const).map((placement) => (
        <Popover key={placement} placement={placement} align="center" content={<span>Placed on {placement}</span>}>
          <Button variant="outline">{placement}</Button>
        </Popover>
      ))}
    </div>
  ),
};

export const Alignment: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {(['start', 'center', 'end'] as const).map((align) => (
        <Popover key={align} align={align} content={<Body />}>
          <Button variant="outline">align {align}</Button>
        </Popover>
      ))}
    </div>
  ),
};

export const WithActions: Story = {
  render: function WithActionsStory() {
    const [open, setOpen] = useState(false);
    return (
      <Popover
        open={open}
        onOpenChange={setOpen}
        label="Rename portfolio"
        content={
          <div style={{ display: 'grid', gap: 12 }}>
            <label style={{ display: 'grid', gap: 4 }}>
              <span>Name</span>
              <input defaultValue="Long-term" />
            </label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => setOpen(false)}>
                Save
              </Button>
            </div>
          </div>
        }
      >
        <Button variant="outline">Rename</Button>
      </Popover>
    );
  },
};

/** 터치 기기가 아니어도 시트로 띄운다. 'adaptive'(기본값)는 coarse 포인터에서 이렇게 보인다. */
export const Sheet: Story = {
  render: () => (
    <Popover content={<Body />} presentation="sheet">
      <Button variant="outline">Open as sheet</Button>
    </Popover>
  ),
};
