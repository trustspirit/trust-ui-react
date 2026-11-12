import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Drawer, type DrawerProps } from './Drawer';
import { Button } from '../Button';

const meta: Meta = {
  title: 'Overlay/Drawer',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ padding: 24 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj;

function Demo({ buttonLabel = 'Open drawer', ...props }: Partial<DrawerProps> & { buttonLabel?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {buttonLabel}
      </Button>
      <Drawer title="Order details" {...props} open={open} onClose={() => setOpen(false)}>
        {props.children ?? (
          <>
            <p style={{ marginTop: 0 }}>Order #20481 was placed on 12 November and is awaiting settlement.</p>
            <p>Review the breakdown below before confirming.</p>
          </>
        )}
      </Drawer>
    </>
  );
}

export const Default: Story = {
  render: () => <Demo />,
};

export const StartSide: Story = {
  render: () => <Demo side="start" title="Filters" buttonLabel="Open on the start side" />,
};

export const WithFooter: Story = {
  render: function WithFooterStory() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="outline" onClick={() => setOpen(true)}>
          Open with footer
        </Button>
        <Drawer
          open={open}
          onClose={() => setOpen(false)}
          title="Edit profile"
          footer={
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setOpen(false)}>Save</Button>
            </>
          }
        >
          {Array.from({ length: 24 }, (_, i) => (
            <p key={i} style={{ marginTop: 0 }}>
              Row {i + 1} — long content scrolls inside the drawer while the footer stays in place.
            </p>
          ))}
        </Drawer>
      </>
    );
  },
};

export const CustomWidth: Story = {
  render: () => <Demo width={560} buttonLabel="Open 560px drawer" />,
};

export const WithoutTitle: Story = {
  render: function WithoutTitleStory() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="outline" onClick={() => setOpen(true)}>
          Open without title
        </Button>
        <Drawer open={open} onClose={() => setOpen(false)} aria-label="Notifications">
          <p style={{ marginTop: 0 }}>No header is rendered, so the content supplies its own close control.</p>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </Drawer>
      </>
    );
  },
};

/** 표면 자체를 찍기 위한 스토리 — 처음부터 열린 상태로 렌더한다. */
export const Open: Story = {
  render: () => (
    <Drawer open onClose={() => {}} title="Order details" footer={<Button>Confirm</Button>}>
      <p style={{ marginTop: 0 }}>Order #20481 was placed on 12 November and is awaiting settlement.</p>
    </Drawer>
  ),
};
