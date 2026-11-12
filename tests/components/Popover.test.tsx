// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Popover } from '../../src/components/Popover';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/** (pointer: coarse) 가 성립하는 터치 기기를 흉내낸다. jsdom 에는 matchMedia 가 없다. */
function stubTouchDevice() {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('coarse'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

function Sample(props: Partial<React.ComponentProps<typeof Popover>>) {
  return (
    <>
      <Popover
        content={
          <div>
            <p>Filter by status</p>
            <button>Apply</button>
            <button>Reset</button>
          </div>
        }
        {...props}
      >
        <button>Filters</button>
      </Popover>
      <button>Next</button>
    </>
  );
}

describe('Popover — semantics', () => {
  it('marks the trigger as a collapsed dialog trigger', () => {
    render(<Sample />);
    const trigger = screen.getByRole('button', { name: 'Filters' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens a non-modal dialog named by the trigger and wires aria-controls', async () => {
    const user = userEvent.setup();
    render(<Sample />);
    const trigger = screen.getByRole('button', { name: 'Filters' });

    await user.click(trigger);

    const dialog = await screen.findByRole('dialog', { name: 'Filters' });
    expect(dialog).not.toHaveAttribute('aria-modal');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-controls', dialog.id);
  });

  it('uses `label` as the accessible name when given', async () => {
    const user = userEvent.setup();
    render(<Sample label="Filter options" />);
    await user.click(screen.getByRole('button', { name: 'Filters' }));
    expect(await screen.findByRole('dialog', { name: 'Filter options' })).toBeInTheDocument();
  });

  it('keeps the trigger own ref, id and onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const ref = { current: null as HTMLButtonElement | null };
    render(
      <Popover content={<p>Body</p>}>
        <button id="my-trigger" ref={ref} onClick={onClick}>
          Info
        </button>
      </Popover>,
    );
    const trigger = screen.getByRole('button', { name: 'Info' });
    expect(ref.current).toBe(trigger);
    expect(trigger).toHaveAttribute('id', 'my-trigger');

    await user.click(trigger);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('dialog', { name: 'Info' })).toBeInTheDocument();
  });
});

describe('Popover — focus', () => {
  it('moves focus to the first focusable element on open', async () => {
    const user = userEvent.setup();
    render(<Sample />);
    await user.click(screen.getByRole('button', { name: 'Filters' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Apply' })).toHaveFocus());
  });

  it('focuses the popover itself when it has nothing focusable', async () => {
    const user = userEvent.setup();
    render(<Sample content={<p>Read only</p>} />);
    await user.click(screen.getByRole('button', { name: 'Filters' }));
    await waitFor(() => expect(screen.getByRole('dialog')).toHaveFocus());
  });

  it('Tab past the last element closes it and continues after the trigger', async () => {
    const user = userEvent.setup();
    render(<Sample />);
    await user.click(screen.getByRole('button', { name: 'Filters' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Apply' })).toHaveFocus());

    await user.tab();
    expect(screen.getByRole('button', { name: 'Reset' })).toHaveFocus();
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.tab();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
  });

  it('Shift+Tab from the first element closes it and lands on the trigger', async () => {
    const user = userEvent.setup();
    render(<Sample />);
    await user.click(screen.getByRole('button', { name: 'Filters' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Apply' })).toHaveFocus());

    await user.tab({ shift: true });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filters' })).toHaveFocus();
  });
});

describe('Popover — closing', () => {
  it('toggles closed on a second trigger click and keeps focus on the trigger', async () => {
    const user = userEvent.setup();
    render(<Sample />);
    const trigger = screen.getByRole('button', { name: 'Filters' });
    await user.click(trigger);
    await screen.findByRole('dialog');
    await user.click(trigger);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('Escape closes, returns focus and marks the event handled', async () => {
    const user = userEvent.setup();
    const seen: boolean[] = [];
    const onDocumentKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') seen.push(e.defaultPrevented);
    };
    document.addEventListener('keydown', onDocumentKey);
    render(<Sample />);
    const trigger = screen.getByRole('button', { name: 'Filters' });
    await user.click(trigger);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Apply' })).toHaveFocus());

    await user.keyboard('{Escape}');
    document.removeEventListener('keydown', onDocumentKey);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    // 바깥의 Dialog/시트가 같은 Escape 로 함께 닫히지 않도록 preventDefault 한다.
    expect(seen).toEqual([true]);
  });

  it('ignores Escape when closeOnEscape is false', async () => {
    const user = userEvent.setup();
    render(<Sample closeOnEscape={false} />);
    await user.click(screen.getByRole('button', { name: 'Filters' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Apply' })).toHaveFocus());
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes on an outside pointer press, but not on a press inside', async () => {
    const user = userEvent.setup();
    render(<Sample />);
    await user.click(screen.getByRole('button', { name: 'Filters' }));
    await screen.findByRole('dialog');

    await user.click(screen.getByText('Filter by status'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    // 사용자가 누른 곳의 포커스를 빼앗지 않는다.
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
  });

  it('stays open on outside press when closeOnOutsideClick is false', async () => {
    const user = userEvent.setup();
    render(<Sample closeOnOutsideClick={false} />);
    await user.click(screen.getByRole('button', { name: 'Filters' }));
    await screen.findByRole('dialog');
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('Popover — controlled and uncontrolled', () => {
  it('defaultOpen renders it open', async () => {
    render(<Sample defaultOpen />);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('controlled: reports intent through onOpenChange and only follows `open`', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(<Sample open={false} onOpenChange={onOpenChange} />);
    const trigger = screen.getByRole('button', { name: 'Filters' });

    await user.click(trigger);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(<Sample open onOpenChange={onOpenChange} />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Apply' })).toHaveFocus());

    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    rerender(<Sample open={false} onOpenChange={onOpenChange} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('returns focus to the trigger when content closes it programmatically', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <Popover open={open} onOpenChange={setOpen} content={<button onClick={() => setOpen(false)}>Done</button>}>
          <button>Options</button>
        </Popover>
      );
    }
    render(<Controlled />);
    const trigger = screen.getByRole('button', { name: 'Options' });
    await user.click(trigger);
    await user.click(await screen.findByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});

describe('Popover — sheet presentation', () => {
  it('adaptive: renders a modal bottom sheet on touch devices', async () => {
    stubTouchDevice();
    const user = userEvent.setup();
    render(<Sample />);
    await user.click(screen.getByRole('button', { name: 'Filters' }));
    const sheet = await screen.findByRole('dialog', { name: 'Filters' });
    expect(sheet).toHaveAttribute('aria-modal', 'true');
  });

  it('presentation="popover" stays anchored on touch devices', async () => {
    stubTouchDevice();
    const user = userEvent.setup();
    render(<Sample presentation="popover" />);
    await user.click(screen.getByRole('button', { name: 'Filters' }));
    expect(await screen.findByRole('dialog')).not.toHaveAttribute('aria-modal');
  });

  it('presentation="sheet" closes on Escape through onOpenChange', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Sample presentation="sheet" onOpenChange={onOpenChange} />);
    await user.click(screen.getByRole('button', { name: 'Filters' }));
    expect(await screen.findByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });
});
