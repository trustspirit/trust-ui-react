// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toast } from '../../src/components/Toast/Toast';
import type { ToastVariant } from '../../src/components/Toast/Toast';

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

    const toasts = Array.from(container.querySelectorAll('[role="alert"]'));
    expect(toasts).toHaveLength(variants.length);

    // 서로 다른 variant 는 서로 다른 className 을 가져야 한다 — 모든 조합을
    // 비교해서 우연히 같은 두 클래스가 섞여 들어오지 않았는지도 함께 잡는다.
    const classNames = toasts.map((el) => el.className);
    const uniqueClassNames = new Set(classNames);
    expect(uniqueClassNames.size).toBe(variants.length);
  });
});
