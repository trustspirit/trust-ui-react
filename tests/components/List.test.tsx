// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { forwardRef, type AnchorHTMLAttributes } from 'react';
import { List } from '../../src/components/List';
import { Switch } from '../../src/components/Switch';

afterEach(cleanup);

describe('List — semantics', () => {
  it('renders a ul with one li per item', () => {
    render(
      <List aria-label="Settings">
        <List.Item title="Wi-Fi" description="Connected" />
        <List.Item title="Bluetooth" />
      </List>,
    );
    const list = screen.getByRole('list', { name: 'Settings' });
    expect(list.tagName).toBe('UL');
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0].tagName).toBe('LI');
    expect(items[0]).toHaveTextContent('Wi-Fi');
    expect(items[0]).toHaveTextContent('Connected');
  });

  it('renders an ol when asked', () => {
    render(
      <List as="ol">
        <List.Item title="First" />
      </List>,
    );
    expect(screen.getByRole('list').tagName).toBe('OL');
  });

  it('keeps list semantics when rendered as div', () => {
    render(
      <List as="div">
        <List.Item title="First" />
      </List>,
    );
    const list = screen.getByRole('list');
    expect(list.tagName).toBe('DIV');
    expect(within(list).getByRole('listitem').tagName).toBe('DIV');
  });

  it('a static row has no link or button', () => {
    render(
      <List>
        <List.Item title="Version" trailing="2.2.0" />
      </List>,
    );
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('listitem')).toHaveTextContent('2.2.0');
  });

  it('scopes density tokens when density is given and inherits otherwise', () => {
    const { rerender } = render(
      <List>
        <List.Item title="A" />
      </List>,
    );
    expect(screen.getByRole('list')).not.toHaveAttribute('data-density');
    rerender(
      <List density="compact">
        <List.Item title="A" />
      </List>,
    );
    expect(screen.getByRole('list')).toHaveAttribute('data-density', 'compact');
  });

  it('forwards the ref to the list element', () => {
    const ref = { current: null as HTMLElement | null };
    render(
      <List ref={ref}>
        <List.Item title="A" />
      </List>,
    );
    expect(ref.current?.tagName).toBe('UL');
  });
});

describe('List.Item — link and button rows', () => {
  it('href makes the row a link inside the li, with an automatic chevron', () => {
    render(
      <List>
        <List.Item title="Account" description="Profile and security" href="/account" />
      </List>,
    );
    const item = screen.getByRole('listitem');
    const link = within(item).getByRole('link', { name: /Account/ });
    expect(link).toHaveAttribute('href', '/account');
    expect(link.parentElement).toBe(item);
    // 화살표는 장식이고 RTL 에서 뒤집힌다.
    const chevron = link.querySelector('svg');
    expect(chevron).not.toBeNull();
    expect(chevron).toHaveAttribute('aria-hidden', 'true');
    expect(chevron?.closest('.tui-mirror-rtl')).not.toBeNull();
  });

  it('a given trailing replaces the chevron and joins the link name', () => {
    render(
      <List>
        <List.Item title="Language" href="/language" trailing="English" />
      </List>,
    );
    const link = screen.getByRole('link');
    expect(link.querySelector('svg')).toBeNull();
    expect(link).toHaveAccessibleName('Language English');
  });

  it('onClick makes the row a button', async () => {
    const onClick = vi.fn();
    render(
      <List>
        <List.Item title="Sign out" onClick={onClick} />
      </List>,
    );
    const button = screen.getByRole('button', { name: 'Sign out' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button.querySelector('svg')).toBeNull();
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('a disabled button row cannot be activated', async () => {
    const onClick = vi.fn();
    render(
      <List>
        <List.Item title="Sign out" onClick={onClick} disabled />
      </List>,
    );
    const button = screen.getByRole('button', { name: 'Sign out' });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('a disabled link row loses its href and says so', () => {
    render(
      <List>
        <List.Item title="Account" href="/account" disabled />
      </List>,
    );
    const link = screen.getByRole('link', { name: 'Account' });
    expect(link).not.toHaveAttribute('href');
    expect(link).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders a router link component through `as`', () => {
    const RouterLink = forwardRef<
      HTMLAnchorElement,
      AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }
    >(({ to, ...rest }, ref) => <a ref={ref} href={`#${to}`} data-router="" {...rest} />);
    render(
      <List>
        <List.Item title="Orders" as={RouterLink} linkProps={{ to: '/orders' }} />
      </List>,
    );
    const link = screen.getByRole('link', { name: 'Orders' });
    expect(link).toHaveAttribute('href', '#/orders');
    expect(link).toHaveAttribute('data-router');
  });

  it('selected sets aria-current on the row target', () => {
    render(
      <List>
        <List.Item title="Home" href="/" selected />
        <List.Item title="Orders" href="/orders" />
      </List>,
    );
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('link', { name: 'Orders' })).not.toHaveAttribute('aria-current');
  });

  it('selected on a static row marks the list item', () => {
    render(
      <List>
        <List.Item title="Home" selected />
      </List>,
    );
    expect(screen.getByRole('listitem')).toHaveAttribute('aria-current', 'true');
  });
});

describe('List.Item — interactive trailing is never nested', () => {
  it('a row with only a trailing control is not a button or link itself', () => {
    render(
      <List>
        <List.Item title="Wi-Fi" trailing={<Switch aria-label="Wi-Fi" />} />
      </List>,
    );
    expect(screen.getByRole('switch', { name: 'Wi-Fi' })).toBeInTheDocument();
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('href + Switch become two sibling targets', async () => {
    const onChange = vi.fn();
    render(
      <List>
        <List.Item
          title="Wi-Fi"
          description="Connected"
          href="/wifi"
          trailing={<Switch aria-label="Wi-Fi" onChange={onChange} />}
        />
      </List>,
    );
    const item = screen.getByRole('listitem');
    const link = within(item).getByRole('link');
    const toggle = within(item).getByRole('switch');
    expect(link.contains(toggle)).toBe(false);
    expect(toggle.contains(link)).toBe(false);
    // 링크 이름에는 글만 들어간다. 컨트롤 이름이 섞이지 않는다.
    expect(link).toHaveAccessibleName('Wi-Fi Connected');
    // 컨트롤이 있으니 자동 화살표는 붙지 않는다.
    expect(link.querySelector('svg')).toBeNull();

    await userEvent.click(toggle);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('onClick + native button trailing: the row click does not fire for the trailing button', async () => {
    const onRow = vi.fn();
    const onMore = vi.fn();
    render(
      <List>
        <List.Item
          title="Report.pdf"
          onClick={onRow}
          trailing={
            <button type="button" onClick={onMore}>
              More
            </button>
          }
        />
      </List>,
    );
    const row = screen.getByRole('button', { name: 'Report.pdf' });
    const more = screen.getByRole('button', { name: 'More' });
    expect(row.contains(more)).toBe(false);

    await userEvent.click(more);
    expect(onMore).toHaveBeenCalledTimes(1);
    expect(onRow).not.toHaveBeenCalled();

    await userEvent.click(row);
    expect(onRow).toHaveBeenCalledTimes(1);
  });

  it('finds a control wrapped in plain markup', () => {
    render(
      <List>
        <List.Item
          title="Wi-Fi"
          href="/wifi"
          trailing={
            <span>
              <Switch aria-label="Wi-Fi" />
            </span>
          }
        />
      </List>,
    );
    expect(screen.getByRole('link').contains(screen.getByRole('switch'))).toBe(false);
  });

  it('trailingInteractive overrides detection for custom controls', () => {
    const Custom = () => <button type="button">Custom</button>;
    render(
      <List>
        <List.Item title="Row" href="/row" trailing={<Custom />} trailingInteractive />
      </List>,
    );
    const link = screen.getByRole('link');
    expect(link.contains(screen.getByRole('button', { name: 'Custom' }))).toBe(false);
  });
});

describe('List.Section', () => {
  it('labels the inner list with its heading', () => {
    render(
      <List.Section title="Network">
        <List>
          <List.Item title="Wi-Fi" />
        </List>
      </List.Section>,
    );
    const heading = screen.getByRole('heading', { name: 'Network', level: 3 });
    expect(heading).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Network' })).toBeInTheDocument();
  });

  it('uses the requested heading level', () => {
    render(
      <List.Section title="Network" headingLevel={2}>
        <List>
          <List.Item title="Wi-Fi" />
        </List>
      </List.Section>,
    );
    expect(screen.getByRole('heading', { name: 'Network', level: 2 })).toBeInTheDocument();
  });

  it('an explicit aria-label on the list wins', () => {
    render(
      <List.Section title="Network">
        <List aria-label="Connections">
          <List.Item title="Wi-Fi" />
        </List>
      </List.Section>,
    );
    expect(screen.getByRole('list', { name: 'Connections' })).toBeInTheDocument();
  });
});
