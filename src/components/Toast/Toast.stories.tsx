import type { Meta, StoryObj } from '@storybook/react';
import { ToastProvider } from '../../providers/ToastProvider';
import { useToast } from '../../hooks/useToast';
import { Button } from '../Button';
import { Toast } from './Toast';

const meta: Meta<typeof Toast> = {
  title: 'Overlay/Toast',
  component: Toast,
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Toast>;

/* ── Helper component to trigger toasts ── */
function ToastTrigger({
  variant,
  message,
  description,
  duration,
}: {
  variant: 'success' | 'danger' | 'warning' | 'info';
  message: string;
  description?: string;
  duration?: number;
}) {
  const { toast } = useToast();
  return (
    <Button
      variant={variant === 'danger' ? 'danger' : 'primary'}
      onClick={() => toast({ variant, message, description, duration })}
    >
      Show {variant} toast
    </Button>
  );
}

export const Success: Story = {
  render: () => <ToastTrigger variant="success" message="Changes saved successfully!" />,
};

export const Danger: Story = {
  render: () => <ToastTrigger variant="danger" message="Failed to delete item." />,
};

export const Warning: Story = {
  render: () => <ToastTrigger variant="warning" message="Your session is about to expire." />,
};

export const Info: Story = {
  render: () => <ToastTrigger variant="info" message="A new version is available." />,
};

export const WithDescription: Story = {
  render: () => (
    <ToastTrigger
      variant="success"
      message="File uploaded"
      description="Your file has been uploaded and is now being processed. This may take a few minutes."
    />
  ),
};

export const CustomDuration: Story = {
  render: () => (
    <ToastTrigger
      variant="info"
      message="This toast lasts 8 seconds"
      duration={8000}
    />
  ),
};

function AllVariantsTrigger() {
  const { toast } = useToast();
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <Button onClick={() => toast({ variant: 'success', message: 'Success toast!' })}>
        Success
      </Button>
      <Button onClick={() => toast({ variant: 'danger', message: 'Danger toast!' })}>
        Danger
      </Button>
      <Button onClick={() => toast({ variant: 'warning', message: 'Warning toast!' })}>
        Warning
      </Button>
      <Button onClick={() => toast({ variant: 'info', message: 'Info toast!' })}>
        Info
      </Button>
    </div>
  );
}

export const AllVariants: Story = {
  render: () => <AllVariantsTrigger />,
};

function PositionDemo() {
  const { toast } = useToast();
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <Button onClick={() => toast({ variant: 'info', message: 'Top-right (default)' })}>
        Add Toast
      </Button>
    </div>
  );
}

export const AllPositions: Story = {
  render: () => (
    <div>
      <p style={{ marginBottom: 16, color: 'var(--tui-text-secondary)', fontFamily: 'var(--tui-font-family)' }}>
        The position is controlled by the ToastProvider. This story uses the default top-right position.
        To change position, wrap your app with{' '}
        <code>&lt;ToastProvider position="bottom-left"&gt;</code>
      </p>
      <PositionDemo />
    </div>
  ),
};
