// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toast } from '../../src/components/Toast/Toast';
import type { ToastVariant } from '../../src/components/Toast/Toast';
import { ToastProvider } from '../../src/providers/ToastProvider';
import { useToast } from '../../src/hooks/useToast';
import { BottomSheet } from '../../src/components/BottomSheet';

afterEach(cleanup);

describe('Toast 자동 닫힘', () => {
  it('duration 이 지나면 onClose 가 불린다', () => {
    vi.useFakeTimers();
    try {
      const onClose = vi.fn();
      render(
        <Toast id="t1" variant="info" message="저장됐습니다" duration={1000} onClose={onClose} />,
      );

      expect(onClose).not.toHaveBeenCalled();
      vi.advanceTimersByTime(999);
      expect(onClose).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('duration={0} 이면 시간이 아무리 지나도 자동으로 닫히지 않는다', () => {
    vi.useFakeTimers();
    try {
      const onClose = vi.fn();
      render(<Toast id="t2" variant="info" message="저장됐습니다" duration={0} onClose={onClose} />);

      vi.advanceTimersByTime(1_000_000);
      expect(onClose).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('Toast 닫기 버튼', () => {
  it('접근 가능한 이름을 갖고, 클릭하면 onClose 를 부른다', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Toast id="t3" variant="info" message="저장됐습니다" onClose={onClose} />);

    const closeButton = screen.getByRole('button', { name: 'Close notification' });
    expect(closeButton).toBeDefined();

    await user.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('Toast variant', () => {
  it('변형마다 다른 클래스를 붙인다', () => {
    const variants: ToastVariant[] = ['success', 'danger', 'warning', 'info'];
    const { container } = render(
      <>
        {variants.map((variant) => (
          <Toast key={variant} id={variant} variant={variant} message={variant} duration={0} />
        ))}
      </>,
    );

    const toasts = Array.from(container.querySelectorAll('[role="alert"], [role="status"]'));
    expect(toasts).toHaveLength(variants.length);

    // 서로 다른 variant 는 서로 다른 className 을 가져야 한다 — 모든 조합을
    // 비교해서 우연히 같은 두 클래스가 섞여 들어오지 않았는지도 함께 잡는다.
    const classNames = toasts.map((el) => el.className);
    const uniqueClassNames = new Set(classNames);
    expect(uniqueClassNames.size).toBe(variants.length);
  });
});

describe('Toast — 일시정지와 역할', () => {
  it('포인터가 올라와 있는 동안에는 닫히지 않고, 떠나면 남은 시간만큼만 더 기다린다', () => {
    vi.useFakeTimers();
    try {
      const onClose = vi.fn();
      render(<Toast id="t" variant="info" message="저장됐습니다" duration={1000} onClose={onClose} />);
      const toast = screen.getByRole('status');

      vi.advanceTimersByTime(600);
      fireEvent.pointerEnter(toast);
      vi.advanceTimersByTime(5000);
      expect(onClose).not.toHaveBeenCalled();

      fireEvent.pointerLeave(toast);
      vi.advanceTimersByTime(399);
      expect(onClose).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('포커스가 안에 있는 동안에도 닫히지 않는다', () => {
    vi.useFakeTimers();
    try {
      const onClose = vi.fn();
      render(<Toast id="t" variant="info" message="저장됐습니다" duration={1000} onClose={onClose} />);

      // focus() 로 생기는 상태 변경을 React 가 반영하도록 act 로 감싼다.
      act(() => screen.getByRole('button', { name: 'Close notification' }).focus());
      vi.advanceTimersByTime(5000);

      expect(onClose).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it.each([
    ['success', 'status'],
    ['info', 'status'],
    ['warning', 'alert'],
    ['danger', 'alert'],
  ] as const)('%s 는 role="%s" 로 알린다', (variant, role) => {
    render(<Toast id="t" variant={variant} message="메시지" duration={0} />);
    expect(screen.getByRole(role)).toBeInTheDocument();
  });
});

describe('ToastProvider', () => {
  function Trigger() {
    const { toast } = useToast();
    return <button onClick={() => toast({ variant: 'info', message: `알림 ${Date.now()}${Math.random()}`, duration: 0 })}>띄우기</button>;
  }

  it('max 를 넘으면 가장 오래된 것부터 내린다', async () => {
    render(
      <ToastProvider max={2}>
        <Trigger />
      </ToastProvider>,
    );
    const button = screen.getByRole('button', { name: '띄우기' });

    await userEvent.click(button);
    await userEvent.click(button);
    await userEvent.click(button);

    expect(screen.getAllByRole('status')).toHaveLength(2);
  });

  it('토스트 영역은 모달이 배경을 비활성화할 때 제외된다', async () => {
    render(
      <ToastProvider>
        <Trigger />
        <BottomSheet open onClose={() => {}}>
          <button>시트 안</button>
        </BottomSheet>
      </ToastProvider>,
    );
    await screen.findByRole('dialog');

    const root = document.querySelector('[data-tui-toast-root]')!;
    expect(root).not.toBeNull();
    expect(root).not.toHaveAttribute('inert');
    expect(root).not.toHaveAttribute('aria-hidden');
  });
});
