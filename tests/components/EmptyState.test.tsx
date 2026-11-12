// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { createRef } from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { EmptyState } from '../../src/components/EmptyState';

afterEach(cleanup);

describe('EmptyState', () => {
  it('제목은 기본으로 3단계 제목이다', () => {
    render(<EmptyState title="No invoices yet" />);
    expect(screen.getByRole('heading', { level: 3, name: 'No invoices yet' })).toBeInTheDocument();
  });

  it.each([1, 2, 3, 4, 5, 6] as const)('headingLevel=%i 은 제목 태그를 바꾼다', (level) => {
    render(<EmptyState title="No invoices yet" headingLevel={level} />);
    const heading = screen.getByRole('heading', { level, name: 'No invoices yet' });
    expect(heading.tagName).toBe(`H${level}`);
  });

  it('설명과 액션을 그린다', () => {
    render(
      <EmptyState
        title="No invoices yet"
        description="Invoices you create will show up here."
        actions={<button type="button">Create invoice</button>}
      />,
    );
    expect(screen.getByText('Invoices you create will show up here.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create invoice' })).toBeInTheDocument();
  });

  it('아이콘은 장식이라 접근성 트리에서 숨긴다', () => {
    render(<EmptyState title="No invoices yet" icon={<svg data-testid="icon" />} />);
    expect(screen.getByTestId('icon').closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('compact 여도 제목·액션은 그대로 노출된다', () => {
    render(
      <EmptyState compact title="Nothing here" actions={<button type="button">Add</button>} />,
    );
    expect(screen.getByRole('heading', { level: 3, name: 'Nothing here' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  it('ref 와 className 을 루트에 전달한다', () => {
    const ref = createRef<HTMLDivElement>();
    render(<EmptyState ref={ref} data-testid="e" className="custom" title="Nothing here" />);
    expect(ref.current).toBe(screen.getByTestId('e'));
    expect(ref.current).toHaveClass('custom');
  });
});
