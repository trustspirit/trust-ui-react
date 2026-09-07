import type { Meta, StoryObj } from '@storybook/react';
import { ToastProvider } from '../../providers/ToastProvider';
import { useToast } from '../../hooks/useToast';
import { Button } from '../Button';
import { Toast } from './Toast';

const meta: Meta<typeof Toast> = {
  title: 'Overlay/Toast',
  component: Toast,
  tags: ['autodocs'],
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
  showProgress,
}: {
  variant: 'success' | 'danger' | 'warning' | 'info';
  message: string;
  description?: string;
  duration?: number;
  showProgress?: boolean;
}) {
  const { toast } = useToast();
  return (
    <Button
      variant={variant === 'danger' ? 'danger' : 'primary'}
      onClick={() => toast({ variant, message, description, duration, showProgress })}
    >
      Show {variant} toast
    </Button>
  );
}

/**
 * 표면 자체와 상태별 변형을 한 번에 찍기 위한 스토리 — ToastProvider 의 트리거
 * 버튼을 거치지 않고 Toast 컴포넌트를 직접, 네 변형 모두 정적으로 렌더링한다.
 * duration=0 으로 자동 닫힘 타이머를 비활성화해 스크린샷 타이밍과 무관하게
 * 항상 같은 모습을 유지한다(결정론적 스냅샷).
 *
 * danger 만 채워진 면(아이콘 원)을 갖고, success/warning 은 테두리 + 글자색만,
 * info 는 v2 에 시맨틱 색이 없어 무채색이다 — 이 차이가 실제로 구분되는지
 * 이 스토리로 확인할 수 있다.
 */
export const Open: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Toast id="open-success" variant="success" message="Changes saved successfully!" description="Your changes are now live." duration={0} />
      <Toast id="open-danger" variant="danger" message="Failed to delete item." description="Check your connection and try again." duration={0} />
      <Toast id="open-warning" variant="warning" message="Your session is about to expire." description="Save your work to avoid losing it." duration={0} />
      <Toast id="open-info" variant="info" message="A new version is available." description="Refresh to get the latest updates." duration={0} />
    </div>
  ),
};

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

export const WithProgress: Story = {
  render: () => (
    <ToastTrigger
      variant="success"
      message="Saving changes…"
      description="Watch the progress bar drain over 4 seconds."
      showProgress
      duration={4000}
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
