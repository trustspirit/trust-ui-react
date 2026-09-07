import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ActionSheet } from './ActionSheet';
import { Button } from '../Button';

const meta: Meta<typeof ActionSheet> = {
  title: 'Components/ActionSheet',
  component: ActionSheet,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ActionSheet>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>Show action sheet</Button>
        <ActionSheet
          open={open}
          onClose={() => setOpen(false)}
          title="Share this photo"
          actions={[
            { label: 'Save Image', onClick: () => { setOpen(false); console.log('save'); } },
            { label: 'Copy', onClick: () => { setOpen(false); console.log('copy'); } },
            { label: 'Share...', onClick: () => { setOpen(false); console.log('share'); } },
          ]}
          cancelLabel="Cancel"
        />
      </>
    );
  },
};

/**
 * 표면 자체를 찍기 위한 스토리 — 트리거를 누르지 않고 open=true 로 바로 연다.
 * 리스트 아이템·취소 버튼(field 면)·시트 표면을 시각 회귀가 실제로 잡을 수
 * 있게 한다.
 */
export const Open: Story = {
  render: () => (
    <ActionSheet
      open
      onClose={() => {}}
      title="Share this photo"
      actions={[
        { label: 'Save Image', onClick: () => {} },
        { label: 'Copy', onClick: () => {} },
        { label: 'Remove', destructive: true, onClick: () => {} },
      ]}
      cancelLabel="Cancel"
    />
  ),
};

export const WithDestructive: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="outline" onClick={() => setOpen(true)}>Open</Button>
        <ActionSheet
          open={open}
          onClose={() => setOpen(false)}
          title="Are you sure you want to remove this?"
          actions={[
            { label: 'Remove', destructive: true, onClick: () => { setOpen(false); console.log('remove'); } },
            { label: 'Keep', onClick: () => setOpen(false) },
          ]}
          cancelLabel="Cancel"
        />
      </>
    );
  },
};
