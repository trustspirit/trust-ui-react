import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Dialog } from './Dialog';
import { Button } from '../Button';

const meta: Meta<typeof Dialog> = {
  title: 'Overlay/Dialog',
  component: Dialog,
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'fullscreen'],
    },
    closeOnBackdrop: { control: 'boolean' },
    closeOnEscape: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Dialog>;

function DefaultDialog() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <Dialog.Title onClose={() => setOpen(false)}>Dialog Title</Dialog.Title>
        <Dialog.Content>
          <p>This is the dialog content. You can place any content here.</p>
        </Dialog.Content>
        <Dialog.Actions>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setOpen(false)}>Confirm</Button>
        </Dialog.Actions>
      </Dialog>
    </>
  );
}

export const Default: Story = {
  render: () => <DefaultDialog />,
};

function SizeDialog({ size }: { size: 'sm' | 'md' | 'lg' | 'fullscreen' }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open {size}</Button>
      <Dialog open={open} onClose={() => setOpen(false)} size={size}>
        <Dialog.Title onClose={() => setOpen(false)}>
          {size.charAt(0).toUpperCase() + size.slice(1)} Dialog
        </Dialog.Title>
        <Dialog.Content>
          <p>This dialog uses the "{size}" size preset.</p>
        </Dialog.Content>
        <Dialog.Actions>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </Dialog.Actions>
      </Dialog>
    </>
  );
}

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12 }}>
      <SizeDialog size="sm" />
      <SizeDialog size="md" />
      <SizeDialog size="lg" />
    </div>
  ),
};

function WithActionsDialog() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open with actions</Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <Dialog.Title onClose={() => setOpen(false)}>Save Changes</Dialog.Title>
        <Dialog.Content>
          <p>Do you want to save the changes you made to this document?</p>
        </Dialog.Content>
        <Dialog.Actions>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Don't Save
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setOpen(false)}>Save</Button>
        </Dialog.Actions>
      </Dialog>
    </>
  );
}

export const WithActions: Story = {
  render: () => <WithActionsDialog />,
};

function FullscreenDialog() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Fullscreen</Button>
      <Dialog open={open} onClose={() => setOpen(false)} size="fullscreen">
        <Dialog.Title onClose={() => setOpen(false)}>
          Fullscreen Dialog
        </Dialog.Title>
        <Dialog.Content>
          <p>This dialog takes up the entire viewport.</p>
        </Dialog.Content>
        <Dialog.Actions>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </Dialog.Actions>
      </Dialog>
    </>
  );
}

export const Fullscreen: Story = {
  render: () => <FullscreenDialog />,
};

function NestedContentDialog() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open with nested content</Button>
      <Dialog open={open} onClose={() => setOpen(false)} size="lg">
        <Dialog.Title onClose={() => setOpen(false)}>
          Terms of Service
        </Dialog.Title>
        <Dialog.Content>
          <h3 style={{ margin: '0 0 8px' }}>1. Introduction</h3>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris.
          </p>
          <h3 style={{ margin: '16px 0 8px' }}>2. Usage Terms</h3>
          <p>
            Duis aute irure dolor in reprehenderit in voluptate velit esse
            cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
            cupidatat non proident, sunt in culpa qui officia deserunt mollit
            anim id est laborum.
          </p>
          <h3 style={{ margin: '16px 0 8px' }}>3. Privacy</h3>
          <p>
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem
            accusantium doloremque laudantium, totam rem aperiam, eaque ipsa
            quae ab illo inventore veritatis et quasi architecto beatae vitae
            dicta sunt explicabo.
          </p>
        </Dialog.Content>
        <Dialog.Actions>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Decline
          </Button>
          <Button onClick={() => setOpen(false)}>Accept</Button>
        </Dialog.Actions>
      </Dialog>
    </>
  );
}

export const NestedContent: Story = {
  render: () => <NestedContentDialog />,
};

function ConfirmDialog() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Delete Account
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} size="sm">
        <Dialog.Title onClose={() => setOpen(false)}>
          Delete Account?
        </Dialog.Title>
        <Dialog.Content>
          <p>
            This action cannot be undone. All your data will be permanently
            deleted.
          </p>
        </Dialog.Content>
        <Dialog.Actions>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => setOpen(false)}>
            Delete
          </Button>
        </Dialog.Actions>
      </Dialog>
    </>
  );
}

export const ConfirmDialogStory: Story = {
  name: 'ConfirmDialog',
  render: () => <ConfirmDialog />,
};
