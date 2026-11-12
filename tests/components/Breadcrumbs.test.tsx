// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { forwardRef } from 'react';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Breadcrumbs } from '../../src/components/Breadcrumbs';

afterEach(() => {
  cleanup();
});

function Trail(props: Partial<React.ComponentProps<typeof Breadcrumbs>>) {
  return (
    <Breadcrumbs {...props}>
      <Breadcrumbs.Item href="/">Home</Breadcrumbs.Item>
      <Breadcrumbs.Item href="/accounts">Accounts</Breadcrumbs.Item>
      <Breadcrumbs.Item href="/accounts/1">Savings</Breadcrumbs.Item>
      <Breadcrumbs.Item href="/accounts/1/tx">Transactions</Breadcrumbs.Item>
      <Breadcrumbs.Item href="/accounts/1/tx/9">Detail</Breadcrumbs.Item>
    </Breadcrumbs>
  );
}

describe('Breadcrumbs — semantics', () => {
  it('is a navigation landmark with an ordered list', () => {
    render(<Trail />);
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    const list = within(nav).getByRole('list');
    expect(list.tagName).toBe('OL');
    expect(within(list).getAllByRole('listitem')).toHaveLength(5);
  });

  it('accepts a custom aria-label', () => {
    render(<Trail aria-label="현재 위치" />);
    expect(screen.getByRole('navigation', { name: '현재 위치' })).toBeInTheDocument();
  });

  it('the last item is the current page and is not a link, even with href', () => {
    render(<Trail />);
    const links = screen.getAllByRole('link');
    expect(links.map((a) => a.textContent)).toEqual(['Home', 'Accounts', 'Savings', 'Transactions']);
    expect(links[0]).toHaveAttribute('href', '/');

    const current = screen.getByText('Detail');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.closest('a')).toBeNull();
    expect(document.querySelectorAll('[aria-current]')).toHaveLength(1);
  });

  it('hides separators from assistive technology', () => {
    render(<Trail separator="›" />);
    const separators = screen.getAllByText('›');
    expect(separators).toHaveLength(4);
    for (const s of separators) expect(s).toHaveAttribute('aria-hidden', 'true');
    // 링크 이름에 구분자가 섞이지 않는다.
    expect(screen.getByRole('link', { name: 'Accounts' })).toBeInTheDocument();
  });

  it('an item with only onClick is a button', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Breadcrumbs>
        <Breadcrumbs.Item onClick={onClick}>Back</Breadcrumbs.Item>
        <Breadcrumbs.Item>Here</Breadcrumbs.Item>
      </Breadcrumbs>,
    );
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('link items forward onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn((e: React.MouseEvent) => e.preventDefault());
    render(
      <Breadcrumbs>
        <Breadcrumbs.Item href="/a" onClick={onClick}>
          A
        </Breadcrumbs.Item>
        <Breadcrumbs.Item>B</Breadcrumbs.Item>
      </Breadcrumbs>,
    );
    await user.click(screen.getByRole('link', { name: 'A' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('`as` renders a custom link component with its own props', () => {
    const RouterLink = forwardRef<HTMLAnchorElement, { to: string; className?: string; children?: React.ReactNode }>(
      function RouterLink({ to, ...rest }, ref) {
        return <a ref={ref} href={`/app${to}`} data-router {...rest} />;
      },
    );
    render(
      <Breadcrumbs>
        <Breadcrumbs.Item as={RouterLink} to="/a">
          A
        </Breadcrumbs.Item>
        <Breadcrumbs.Item as={RouterLink} to="/b">
          B
        </Breadcrumbs.Item>
      </Breadcrumbs>,
    );
    const link = screen.getByRole('link', { name: 'A' });
    expect(link).toHaveAttribute('href', '/app/a');
    expect(link).toHaveAttribute('data-router');
    // 마지막 항목은 `as` 가 있어도 링크가 아니다.
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByText('B')).toHaveAttribute('aria-current', 'page');
  });
});

describe('Breadcrumbs — collapsing', () => {
  it('does not collapse at or under maxItems', () => {
    render(<Trail maxItems={5} />);
    expect(screen.queryByRole('button', { name: 'Show path' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(4);
  });

  it('collapses the middle into one button, keeping the first and the last items', () => {
    render(<Trail maxItems={3} />);
    const expand = screen.getByRole('button', { name: 'Show path' });
    expect(expand).toHaveAttribute('aria-expanded', 'false');

    expect(screen.getAllByRole('link').map((a) => a.textContent)).toEqual(['Home', 'Transactions']);
    expect(screen.getByText('Detail')).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByText('Accounts')).not.toBeInTheDocument();
  });

  it('expands the full trail on click and moves focus to the first revealed link', async () => {
    const user = userEvent.setup();
    render(<Trail maxItems={3} />);
    await user.click(screen.getByRole('button', { name: 'Show path' }));

    expect(screen.queryByRole('button', { name: 'Show path' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(4);
    expect(screen.getByRole('link', { name: 'Accounts' })).toHaveFocus();
  });

  it('expand label is overridable', () => {
    render(<Trail maxItems={2} expandLabel="경로 펼치기" />);
    expect(screen.getByRole('button', { name: '경로 펼치기' })).toBeInTheDocument();
    expect(screen.getAllByRole('link').map((a) => a.textContent)).toEqual(['Home']);
  });
});
