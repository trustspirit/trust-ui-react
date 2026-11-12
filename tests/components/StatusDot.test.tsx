// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { createRef } from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { StatusDot } from '../../src/components/StatusDot';

afterEach(cleanup);

describe('StatusDot', () => {
  it.each(['neutral', 'success', 'warning', 'danger', 'accent'] as const)(
    '%s 는 img 역할이고 label 이 이름이 된다',
    (variant) => {
      render(<StatusDot variant={variant} label="Online" />);
      expect(screen.getByRole('img', { name: 'Online' })).toBeInTheDocument();
    },
  );

  it('pulse 여도 이름은 그대로다', () => {
    render(<StatusDot variant="success" label="Syncing" pulse size="sm" />);
    expect(screen.getByRole('img', { name: 'Syncing' })).toBeInTheDocument();
  });

  it('ref 와 className 을 루트에 전달한다', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<StatusDot ref={ref} className="custom" variant="danger" label="Offline" />);
    expect(ref.current).toBe(screen.getByRole('img', { name: 'Offline' }));
    expect(ref.current).toHaveClass('custom');
  });
});
