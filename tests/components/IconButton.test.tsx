// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { IconButton } from '../../src/components/IconButton';

afterEach(cleanup);

const Icon = () => (
  <svg data-testid="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

describe('IconButton', () => {
  it('label 이 접근 가능한 이름이 되고 기본 type 은 button 이다', () => {
    render(<IconButton label="Close" icon={<Icon />} />);
    const button = screen.getByRole('button', { name: 'Close' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).not.toHaveAttribute('aria-pressed');
    expect(button).not.toHaveAttribute('aria-busy');
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('children 도 아이콘으로 받는다', () => {
    render(
      <IconButton label="Close">
        <Icon />
      </IconButton>,
    );
    expect(screen.getByRole('button', { name: 'Close' })).toContainElement(screen.getByTestId('icon'));
  });

  it('label 없이는 타입 검사를 통과하지 못한다', () => {
    // @ts-expect-error label is required — an icon alone has no accessible name
    const missing = <IconButton icon={<Icon />} />;
    expect(missing).toBeTruthy();
  });

  it('pressed 는 aria-pressed 로 전달된다', () => {
    const { rerender } = render(<IconButton label="Bold" icon={<Icon />} pressed />);
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-pressed', 'true');
    rerender(<IconButton label="Bold" icon={<Icon />} pressed={false} />);
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('클릭과 키보드로 활성화된다', async () => {
    const onClick = vi.fn();
    render(<IconButton label="Close" icon={<Icon />} onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it('loading 중에는 aria-busy·disabled 이고 이름은 유지된다', async () => {
    const onClick = vi.fn();
    render(<IconButton label="Refresh" icon={<Icon />} loading onClick={onClick} />);
    const button = screen.getByRole('button', { name: 'Refresh' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
    // 스피너가 아이콘 자리를 대신한다.
    expect(screen.queryByTestId('icon')).toBeNull();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('disabled 를 전달한다', () => {
    render(<IconButton label="Close" icon={<Icon />} disabled />);
    expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled();
  });

  it('ref 를 button 요소에 전달한다', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<IconButton label="Close" icon={<Icon />} ref={ref} />);
    expect(ref.current).toBe(screen.getByRole('button'));
  });

  it('tooltip 과 함께여도 ref 를 button 요소에 전달한다', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<IconButton label="Close" icon={<Icon />} tooltip ref={ref} />);
    expect(ref.current).toBe(screen.getByRole('button'));
  });

  it('tooltip 이 true 면 포커스 때 label 을 툴팁으로 보여 준다', async () => {
    render(<IconButton label="Close" icon={<Icon />} tooltip tooltipProps={{ delay: 0 }} />);
    expect(screen.queryByRole('tooltip')).toBeNull();
    await userEvent.tab();
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('Close');
    const button = screen.getByRole('button', { name: 'Close' });
    // 이름과 같은 글자를 설명으로 한 번 더 읽히지 않게 한다.
    expect(button).not.toHaveAttribute('aria-describedby');
  });

  it('tooltip 이 문자열이면 그 글이 툴팁이자 설명이 된다', async () => {
    render(
      <IconButton
        label="Close"
        icon={<Icon />}
        tooltip="Close the panel (Esc)"
        tooltipProps={{ delay: 0 }}
        aria-describedby="extra"
      />,
    );
    await userEvent.tab();
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('Close the panel (Esc)');
    const button = screen.getByRole('button', { name: 'Close' });
    expect(button).toHaveAccessibleDescription('Close the panel (Esc)');
    expect(button.getAttribute('aria-describedby')).toContain('extra');
  });

  it('tooltip 없이는 툴팁을 만들지 않는다', async () => {
    render(<IconButton label="Close" icon={<Icon />} />);
    await userEvent.tab();
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
