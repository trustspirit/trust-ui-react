// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Drawer } from '../../src/components/Drawer';

afterEach(() => {
  cleanup();
});

function Sample({
  onClose,
  ...props
}: Partial<React.ComponentProps<typeof Drawer>> & { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open drawer</button>
      <Drawer
        title="Order details"
        {...props}
        open={open}
        onClose={() => {
          onClose?.();
          setOpen(false);
        }}
      >
        <input aria-label="Memo" />
        <button>Save</button>
      </Drawer>
    </>
  );
}

describe('Drawer — semantics', () => {
  it('renders nothing while closed', () => {
    render(<Sample />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is a modal dialog named by its title, portaled to body', async () => {
    const user = userEvent.setup();
    const { container } = render(<Sample />);
    await user.click(screen.getByRole('button', { name: 'Open drawer' }));

    const dialog = await screen.findByRole('dialog', { name: 'Order details' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(container).not.toContainElement(dialog);
    expect(dialog.parentElement).toBe(document.body);
    expect(screen.getByRole('heading', { name: 'Order details' })).toBeInTheDocument();
  });

  it('uses aria-label when there is no title, and renders no header', async () => {
    const user = userEvent.setup();
    render(<Sample title={undefined} aria-label="Filters" />);
    await user.click(screen.getByRole('button', { name: 'Open drawer' }));
    expect(await screen.findByRole('dialog', { name: 'Filters' })).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });

  it('close button label is overridable', async () => {
    const user = userEvent.setup();
    render(<Sample closeLabel="닫기" />);
    await user.click(screen.getByRole('button', { name: 'Open drawer' }));
    expect(await screen.findByRole('button', { name: '닫기' })).toBeInTheDocument();
  });

  it('renders the footer', async () => {
    const user = userEvent.setup();
    render(<Sample footer={<button>Confirm</button>} />);
    await user.click(screen.getByRole('button', { name: 'Open drawer' }));
    expect(await screen.findByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });

  it('locks page scroll and makes the background inert while open', async () => {
    const user = userEvent.setup();
    const { container } = render(<Sample />);
    await user.click(screen.getByRole('button', { name: 'Open drawer' }));
    await screen.findByRole('dialog');
    expect(document.body.style.overflow).toBe('hidden');
    const isolated = container.hasAttribute('inert') || container.getAttribute('aria-hidden') === 'true';
    expect(isolated).toBe(true);

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(document.body.style.overflow).toBe('');
    expect(container.hasAttribute('inert')).toBe(false);
    expect(container.hasAttribute('aria-hidden')).toBe(false);
  });
});

describe('Drawer — focus', () => {
  it('moves focus inside on open and traps Tab in both directions', async () => {
    const user = userEvent.setup();
    render(<Sample />);
    await user.click(screen.getByRole('button', { name: 'Open drawer' }));

    const close = await screen.findByRole('button', { name: 'Close' });
    await waitFor(() => expect(close).toHaveFocus());

    await user.tab();
    expect(screen.getByRole('textbox', { name: 'Memo' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus();
  });

  it('returns focus to the opener after closing', async () => {
    const user = userEvent.setup();
    render(<Sample />);
    const opener = screen.getByRole('button', { name: 'Open drawer' });
    await user.click(opener);
    await user.click(await screen.findByRole('button', { name: 'Close' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(opener).toHaveFocus();
  });
});

describe('Drawer — closing', () => {
  it('Escape calls onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Sample onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'Open drawer' }));
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closeOnEscape={false} ignores Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Sample onClose={onClose} closeOnEscape={false} />);
    await user.click(screen.getByRole('button', { name: 'Open drawer' }));
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('leaves an Escape that an inner widget already handled', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Drawer open onClose={onClose} title="Edit">
        <input aria-label="Search" onKeyDown={(e) => e.key === 'Escape' && e.preventDefault()} />
      </Drawer>,
    );
    const input = await screen.findByRole('textbox', { name: 'Search' });
    input.focus();
    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('backdrop click calls onClose; closeOnBackdrop={false} does not', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { rerender } = render(
      <Drawer open onClose={onClose} title="Edit">
        body
      </Drawer>,
    );
    await screen.findByRole('dialog');
    await user.click(document.querySelector('[data-tui-drawer-backdrop]')!);
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(
      <Drawer open onClose={onClose} title="Edit" closeOnBackdrop={false}>
        body
      </Drawer>,
    );
    await user.click(document.querySelector('[data-tui-drawer-backdrop]')!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('a click inside the panel does not close it', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Drawer open onClose={onClose} title="Edit">
        <p>Body text</p>
      </Drawer>,
    );
    await user.click(await screen.findByText('Body text'));
    expect(onClose).not.toHaveBeenCalled();
  });
});
