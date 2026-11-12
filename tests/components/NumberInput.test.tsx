// @vitest-environment jsdom
import * as React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NumberInput } from '../../src/components/NumberInput';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function stubTouchDevice() {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('coarse'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

describe('NumberInput — 역할과 상태', () => {
  it('label 로 이름 붙은 spinbutton 이고 범위와 현재 값을 알린다', () => {
    render(<NumberInput label="Quantity" defaultValue={3} min={0} max={10} />);
    const input = screen.getByRole('spinbutton', { name: 'Quantity' });
    expect(input).toHaveAttribute('aria-valuenow', '3');
    expect(input).toHaveAttribute('aria-valuemin', '0');
    expect(input).toHaveAttribute('aria-valuemax', '10');
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('inputmode', 'numeric');
  });

  it('소수 자리가 있으면 decimal 키패드를 요청한다', () => {
    render(<NumberInput label="Rate" step={0.1} />);
    expect(screen.getByRole('spinbutton')).toHaveAttribute('inputmode', 'decimal');
  });

  it('오류 메시지를 설명으로 잇는다', () => {
    render(<NumberInput label="Quantity" errorMessage="Too many" />);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAccessibleDescription('Too many');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('포커스가 없으면 서식된 값을, 편집 중에는 원래 숫자를 보여 준다', async () => {
    const user = userEvent.setup();
    render(
      <NumberInput
        label="Amount"
        defaultValue={1234567}
        locale="en-US"
        formatOptions={{ style: 'currency', currency: 'KRW' }}
      />,
    );
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    expect(input.value).toBe('₩1,234,567');
    expect(input).toHaveAttribute('aria-valuetext', '₩1,234,567');

    await user.click(input);
    expect(input.value).toBe('1234567');

    await user.tab();
    expect(input.value).toBe('₩1,234,567');
  });

  it('name 이 있으면 서식 없는 숫자를 폼 값으로 낸다', () => {
    const { container } = render(
      <NumberInput label="Amount" name="amount" defaultValue={1234} formatOptions={{}} locale="en-US" />,
    );
    const hidden = container.querySelector('input[type="hidden"][name="amount"]') as HTMLInputElement;
    expect(hidden.value).toBe('1234');
    expect(screen.getByRole('spinbutton')).not.toHaveAttribute('name');
  });
});

describe('NumberInput — 키보드', () => {
  it('화살표는 step, PageUp/PageDown 은 step × 10 만큼 움직인다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberInput label="Quantity" defaultValue={5} step={2} onChange={onChange} />);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    await user.click(input);

    await user.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith(7);
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(onChange).toHaveBeenLastCalledWith(3);
    await user.keyboard('{PageUp}');
    expect(onChange).toHaveBeenLastCalledWith(23);
    await user.keyboard('{PageDown}');
    expect(onChange).toHaveBeenLastCalledWith(3);
    expect(input.value).toBe('3');
    expect(input).toHaveAttribute('aria-valuenow', '3');
  });

  it('Home/End 는 min/max 가 있을 때만 그 값으로 간다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberInput label="Quantity" defaultValue={5} min={1} max={9} onChange={onChange} />);
    await user.click(screen.getByRole('spinbutton'));
    await user.keyboard('{End}');
    expect(onChange).toHaveBeenLastCalledWith(9);
    await user.keyboard('{Home}');
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it('min/max 가 없으면 Home/End 를 가로채지 않는다(캐럿 이동)', () => {
    render(<NumberInput label="Quantity" defaultValue={5} />);
    const input = screen.getByRole('spinbutton');
    expect(fireEvent.keyDown(input, { key: 'Home' })).toBe(true);
    expect(fireEvent.keyDown(input, { key: 'End' })).toBe(true);
  });

  it('스텝 이동은 범위를 넘지 않는다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberInput label="Quantity" defaultValue={9} min={0} max={10} step={5} onChange={onChange} />);
    await user.click(screen.getByRole('spinbutton'));
    await user.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith(10);
    await user.keyboard('{PageDown}');
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it('부동소수 오차를 남기지 않는다 — 0.1 + 0.2 는 0.3', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberInput label="Rate" defaultValue={0.1} step={0.2} precision={1} onChange={onChange} />);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    await user.click(input);
    await user.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith(0.3);
    expect(input.value).toBe('0.3');
  });

  it('precision 기본값은 step 의 소수 자릿수다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberInput label="Rate" defaultValue={0.1} step={0.1} onChange={onChange} />);
    await user.click(screen.getByRole('spinbutton'));
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith(0.3);
  });

  it('IME 조합 중의 키는 무시한다', () => {
    const onChange = vi.fn();
    render(<NumberInput label="Quantity" defaultValue={5} onChange={onChange} />);
    const input = screen.getByRole('spinbutton');
    fireEvent.keyDown(input, { key: 'ArrowUp', isComposing: true });
    fireEvent.keyDown(input, { key: 'ArrowUp', keyCode: 229 });
    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveAttribute('aria-valuenow', '5');
  });

  it('readOnly 는 스텝 이동을 막는다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberInput label="Quantity" defaultValue={5} readOnly onChange={onChange} />);
    await user.click(screen.getByRole('spinbutton'));
    await user.keyboard('{ArrowUp}');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('휠은 값을 바꾸지 않는다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberInput label="Quantity" defaultValue={5} onChange={onChange} />);
    const input = screen.getByRole('spinbutton');
    await user.click(input);
    fireEvent.wheel(input, { deltaY: -100 });
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('NumberInput — 입력', () => {
  it('"-" 나 "1." 같은 중간 문자열을 지우지 않는다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberInput label="Rate" precision={2} onChange={onChange} />);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    await user.click(input);

    await user.keyboard('-');
    expect(input.value).toBe('-');
    await user.keyboard('1');
    expect(onChange).toHaveBeenLastCalledWith(-1);
    await user.keyboard('.');
    expect(input.value).toBe('-1.');
    expect(onChange).toHaveBeenLastCalledWith(-1);
    await user.keyboard('5');
    expect(input.value).toBe('-1.5');
    expect(onChange).toHaveBeenLastCalledWith(-1.5);
  });

  it('제어 모드에서도 중간 문자열이 유지된다', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = React.useState<number | null>(null);
      return <NumberInput label="Rate" precision={1} value={value} onChange={setValue} />;
    }
    render(<Controlled />);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    await user.click(input);
    await user.keyboard('1.');
    expect(input.value).toBe('1.');
    await user.keyboard('5');
    expect(input.value).toBe('1.5');
  });

  it('숫자가 아닌 글자는 받아들이지 않는다', async () => {
    const user = userEvent.setup();
    render(<NumberInput label="Quantity" />);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    await user.click(input);
    await user.keyboard('1a2');
    expect(input.value).toBe('12');
  });

  it('비우면 null 이다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberInput label="Quantity" defaultValue={7} onChange={onChange} />);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    await user.clear(input);
    expect(onChange).toHaveBeenLastCalledWith(null);
    await user.tab();
    expect(input.value).toBe('');
    expect(input).not.toHaveAttribute('aria-valuenow');
  });

  it('blur 때 범위 안으로 당기고 precision 으로 반올림한다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberInput label="Rate" min={0} max={10} precision={2} onChange={onChange} />);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;

    await user.click(input);
    await user.keyboard('25');
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith(10);
    expect(input.value).toBe('10');

    await user.clear(input);
    await user.keyboard('1.239');
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith(1.24);
    expect(input.value).toBe('1.24');
  });

  it('제어 값이 밖에서 바뀌면 표시를 따라간다', () => {
    const { rerender } = render(<NumberInput label="Quantity" value={1} />);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    expect(input.value).toBe('1');
    rerender(<NumberInput label="Quantity" value={42} />);
    expect(input.value).toBe('42');
    rerender(<NumberInput label="Quantity" value={null} />);
    expect(input.value).toBe('');
  });
});

describe('NumberInput — 스테퍼 버튼', () => {
  it('이름이 있고 탭 순서에는 없다', () => {
    render(<NumberInput label="Quantity" incrementLabel="More" decrementLabel="Less" />);
    const more = screen.getByRole('button', { name: 'More' });
    const less = screen.getByRole('button', { name: 'Less' });
    expect(more).toHaveAttribute('tabindex', '-1');
    expect(less).toHaveAttribute('tabindex', '-1');
    expect(more).not.toHaveAttribute('aria-hidden');
  });

  it('누르면 한 스텝 움직이고, 한계에서는 비활성이다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<NumberInput label="Quantity" defaultValue={9} max={10} onChange={onChange} />);
    const up = screen.getByRole('button', { name: 'Increase' });
    await user.click(up);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith(10);
    expect(up).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Decrease' })).toBeEnabled();
  });

  it('누르고 있으면 반복한다', () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(<NumberInput label="Quantity" defaultValue={0} onChange={onChange} />);
    const up = screen.getByRole('button', { name: 'Increase' });

    fireEvent.pointerDown(up, { button: 0 });
    expect(onChange).toHaveBeenLastCalledWith(1);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    const held = onChange.mock.calls.length;
    expect(held).toBeGreaterThan(3);

    fireEvent.pointerUp(up);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onChange.mock.calls.length).toBe(held);
  });

  it('showSteppers={false} 와 터치 기기에서는 그리지 않는다', async () => {
    const { unmount } = render(<NumberInput label="Quantity" showSteppers={false} />);
    expect(screen.queryByRole('button')).toBeNull();
    unmount();

    stubTouchDevice();
    render(<NumberInput label="Quantity" showSteppers />);
    await act(async () => {});
    expect(screen.queryByRole('button')).toBeNull();
  });
});
