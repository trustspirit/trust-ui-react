// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BottomNav, type BottomNavItem } from '../../src/components/BottomNav';

afterEach(() => {
  cleanup();
});

const Icon = () => <svg data-testid="icon" width="20" height="20" />;

const items: BottomNavItem[] = [
  { value: 'home', label: 'Home', icon: <Icon /> },
  { value: 'search', label: 'Search', icon: <Icon /> },
  { value: 'inbox', label: 'Inbox', icon: <Icon />, badge: 3 },
  { value: 'me', label: 'Profile', icon: <Icon />, disabled: true },
];

describe('BottomNav', () => {
  it('is a navigation landmark with a list of buttons, not a tablist', () => {
    render(<BottomNav items={items} value="home" onChange={() => {}} />);
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(within(nav).getAllByRole('listitem')).toHaveLength(4);
    expect(within(nav).getAllByRole('button')).toHaveLength(4);
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  it('accepts a custom aria-label', () => {
    render(<BottomNav items={items} value="home" onChange={() => {}} aria-label="주 메뉴" />);
    expect(screen.getByRole('navigation', { name: '주 메뉴' })).toBeInTheDocument();
  });

  it('marks only the active destination with aria-current="page"', () => {
    render(<BottomNav items={items} value="search" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Search' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Home' })).not.toHaveAttribute('aria-current');
  });

  it('calls onChange with the item value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<BottomNav items={items} value="home" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toBe('search');
  });

  it('is operable from the keyboard', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<BottomNav items={items} value="home" onChange={onChange} />);
    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Search' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onChange.mock.calls[0][0]).toBe('search');
  });

  it('does not fire for disabled items', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<BottomNav items={items} value="home" onChange={onChange} />);
    const profile = screen.getByRole('button', { name: 'Profile' });
    expect(profile).toBeDisabled();
    await user.click(profile);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('includes the badge in the accessible name and hides the icon', () => {
    render(<BottomNav items={items} value="home" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /Inbox\s*3/ })).toBeInTheDocument();
    for (const icon of screen.getAllByTestId('icon')) {
      expect(icon.closest('[aria-hidden="true"]')).not.toBeNull();
    }
  });

  it('keeps the name when labels are visually hidden', () => {
    render(<BottomNav items={items} value="home" onChange={() => {}} showLabels={false} />);
    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
  });

  it('renders links when href is given', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const linkItems: BottomNavItem[] = [
      { value: 'home', label: 'Home', icon: <Icon />, href: '#home' },
      { value: 'search', label: 'Search', icon: <Icon />, href: '#search' },
      { value: 'off', label: 'Offline', icon: <Icon />, href: '#off', disabled: true },
    ];
    render(<BottomNav items={linkItems} value="home" onChange={onChange} />);

    const home = screen.getByRole('link', { name: 'Home' });
    expect(home).toHaveAttribute('href', '#home');
    expect(home).toHaveAttribute('aria-current', 'page');

    await user.click(screen.getByRole('link', { name: 'Search' }));
    expect(onChange.mock.calls[0][0]).toBe('search');

    // 비활성 링크는 href 를 떼어 이동도, 포커스도 되지 않게 한다.
    const offline = screen.getByText('Offline').closest('a')!;
    expect(offline).not.toHaveAttribute('href');
    expect(offline).toHaveAttribute('aria-disabled', 'true');
    await user.click(offline);
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
