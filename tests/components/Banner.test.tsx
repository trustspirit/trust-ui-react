// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Banner } from '../../src/components/Banner';

afterEach(cleanup);

describe('Banner', () => {
  it('제목과 설명을 그린다', () => {
    render(<Banner status="info" title="Scheduled maintenance" description="Sunday 02:00–04:00" />);
    expect(screen.getByText('Scheduled maintenance')).toBeInTheDocument();
    expect(screen.getByText('Sunday 02:00–04:00')).toBeInTheDocument();
  });

  it('기본으로는 role 이 없다 — 정적인 내용이다', () => {
    render(<Banner data-testid="b" status="warning" title="Card expires soon" />);
    expect(screen.getByTestId('b')).not.toHaveAttribute('role');
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it.each(['status', 'alert'] as const)('role="%s" 을 그대로 따른다', (role) => {
    render(<Banner status="danger" title="Payment failed" role={role} />);
    expect(screen.getByRole(role)).toHaveTextContent('Payment failed');
  });

  it('onDismiss 가 없으면 닫기 버튼이 없다', () => {
    render(<Banner status="info" title="Hello" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('닫기 버튼은 기본 이름 Dismiss 를 갖고 누르면 onDismiss 를 부른다', async () => {
    const onDismiss = vi.fn();
    render(<Banner status="info" title="Hello" onDismiss={onDismiss} />);

    const button = screen.getByRole('button', { name: 'Dismiss' });
    expect(button).toHaveAttribute('type', 'button');
    await userEvent.click(button);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('닫기 버튼은 키보드로도 동작한다', async () => {
    const onDismiss = vi.fn();
    render(<Banner status="info" title="Hello" onDismiss={onDismiss} />);

    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Dismiss' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('dismissLabel 로 닫기 버튼 이름을 바꾼다', () => {
    render(<Banner status="info" title="Hello" onDismiss={() => {}} dismissLabel="닫기" />);
    expect(screen.getByRole('button', { name: '닫기' })).toBeInTheDocument();
  });

  it.each(['info', 'success', 'warning', 'danger'] as const)(
    '%s 기본 아이콘은 장식이라 숨긴다',
    (status) => {
      const { container } = render(<Banner status={status} title="Hello" />);
      const svg = container.querySelector('svg');
      expect(svg).not.toBeNull();
      expect(svg!.closest('[aria-hidden="true"]')).not.toBeNull();
    },
  );

  it('icon 으로 기본 아이콘을 바꾸고, null 이면 아이콘을 그리지 않는다', () => {
    const { container, rerender } = render(
      <Banner status="info" title="Hello" icon={<span data-testid="custom" />} />,
    );
    expect(screen.getByTestId('custom')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeNull();

    rerender(<Banner status="info" title="Hello" icon={null} />);
    expect(screen.queryByTestId('custom')).toBeNull();
    expect(container.querySelector('svg')).toBeNull();
  });

  it('actions 를 그린다', () => {
    render(<Banner status="info" title="Hello" actions={<button type="button">Retry</button>} />);
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('ref 와 className 을 루트에 전달한다', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Banner ref={ref} data-testid="b" className="custom" status="info" title="Hello" />);
    expect(ref.current).toBe(screen.getByTestId('b'));
    expect(ref.current).toHaveClass('custom');
  });
});
