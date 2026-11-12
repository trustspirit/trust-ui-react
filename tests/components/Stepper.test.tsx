// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Stepper } from '../../src/components/Stepper';

afterEach(() => {
  cleanup();
});

function Sample(props: Partial<React.ComponentProps<typeof Stepper>>) {
  return (
    <Stepper activeStep={1} {...props}>
      <Stepper.Step label="Cart" />
      <Stepper.Step label="Shipping" description="Address and method" />
      <Stepper.Step label="Payment" optional />
      <Stepper.Step label="Review" disabled />
    </Stepper>
  );
}

describe('Stepper — semantics', () => {
  it('is a labelled group containing an ordered list of steps', () => {
    render(<Sample />);
    const group = screen.getByRole('group', { name: 'Progress' });
    const list = within(group).getByRole('list');
    expect(list.tagName).toBe('OL');
    expect(within(list).getAllByRole('listitem')).toHaveLength(4);
  });

  it('accepts a custom label', () => {
    render(<Sample label="Checkout" />);
    expect(screen.getByRole('group', { name: 'Checkout' })).toBeInTheDocument();
  });

  it('marks only the active step with aria-current="step"', () => {
    render(<Sample />);
    const items = screen.getAllByRole('listitem');
    expect(items.map((li) => li.getAttribute('aria-current'))).toEqual([null, 'step', null, null]);
  });

  it('exposes completed / current state as text', () => {
    render(<Sample />);
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent(/Completed/);
    expect(items[0]).toHaveTextContent(/Cart/);
    expect(items[1]).toHaveTextContent(/Current/);
    expect(items[1]).toHaveTextContent(/Address and method/);
    expect(items[2]).not.toHaveTextContent(/Completed|Current/);
    expect(items[2]).toHaveTextContent(/Optional/);
  });

  it('state text is overridable', () => {
    render(<Sample completedLabel="완료" currentLabel="진행 중" />);
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent(/완료/);
    expect(items[1]).toHaveTextContent(/진행 중/);
  });

  it('exposes an error state in text', () => {
    render(
      <Stepper activeStep={1}>
        <Stepper.Step label="Cart" />
        <Stepper.Step label="Shipping" error />
      </Stepper>,
    );
    expect(screen.getAllByRole('listitem')[1]).toHaveTextContent(/Error/);
  });

  it('marks every step completed once activeStep passes the end', () => {
    render(<Sample activeStep={4} />);
    for (const li of screen.getAllByRole('listitem')) {
      expect(li).toHaveTextContent(/Completed/);
      expect(li).not.toHaveAttribute('aria-current');
    }
  });

  it('keeps the compact summary out of the accessibility tree', () => {
    render(<Sample />);
    const summary = screen.getByText(/Step 2 of 4/);
    expect(summary.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(summary.closest('[aria-hidden="true"]')).toHaveTextContent('Shipping');
  });

  it('has no compact summary in vertical orientation', () => {
    render(<Sample orientation="vertical" />);
    expect(screen.queryByText(/Step 2 of 4/)).not.toBeInTheDocument();
  });
});

describe('Stepper — interaction', () => {
  it('renders no buttons without onStepClick', () => {
    render(<Sample />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders steps as buttons and reports the clicked index', async () => {
    const user = userEvent.setup();
    const onStepClick = vi.fn();
    render(<Sample onStepClick={onStepClick} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
    await user.click(screen.getByRole('button', { name: /Cart/ }));
    expect(onStepClick).toHaveBeenCalledWith(0);

    // aria-current 는 실제로 포커스를 받는 버튼에 붙는다.
    expect(screen.getByRole('button', { name: /Shipping/ })).toHaveAttribute('aria-current', 'step');
    expect(screen.getAllByRole('listitem')[1]).not.toHaveAttribute('aria-current');
  });

  it('button names carry the state', () => {
    render(<Sample onStepClick={() => {}} />);
    expect(screen.getByRole('button', { name: /Completed.*Cart/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Current.*Shipping/ })).toBeInTheDocument();
  });

  it('disabled steps cannot be clicked', async () => {
    const user = userEvent.setup();
    const onStepClick = vi.fn();
    render(<Sample onStepClick={onStepClick} />);
    const review = screen.getByRole('button', { name: /Review/ });
    expect(review).toBeDisabled();
    await user.click(review);
    expect(onStepClick).not.toHaveBeenCalled();
  });
});
