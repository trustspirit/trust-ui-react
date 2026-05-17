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
            { label: 'Save Image', onPress: () => { setOpen(false); console.log('save'); } },
            { label: 'Copy', onPress: () => { setOpen(false); console.log('copy'); } },
            { label: 'Share...', onPress: () => { setOpen(false); console.log('share'); } },
          ]}
          cancelLabel="Cancel"
        />
      </>
    );
  },
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
            { label: 'Remove', destructive: true, onPress: () => { setOpen(false); console.log('remove'); } },
            { label: 'Keep', onPress: () => setOpen(false) },
          ]}
          cancelLabel="Cancel"
        />
      </>
    );
  },
};
