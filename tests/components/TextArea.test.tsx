// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { TextArea } from '../../src/components/TextArea';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('TextArea — field wiring', () => {
  it('is named by its label', () => {
    render(<TextArea label="Message" />);
    const textarea = screen.getByRole('textbox', { name: 'Message' });
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea).toHaveAttribute('rows', '3');
  });

  it('keeps the name when the label is hidden', () => {
    render(<TextArea label="Message" hideLabel />);
    expect(screen.getByRole('textbox', { name: 'Message' })).toBeInTheDocument();
  });

  it('links helper text as the description', () => {
    render(<TextArea label="Message" helperText="Be kind" />);
    expect(screen.getByRole('textbox')).toHaveAccessibleDescription('Be kind');
  });

  it('links the error message and marks the field invalid', () => {
    render(<TextArea label="Message" helperText="Be kind" errorMessage="Required" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAccessibleDescription('Required');
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
  });

  it('passes required, disabled and readOnly to the textarea', () => {
    const { rerender } = render(<TextArea label="Message" required />);
    expect(screen.getByRole('textbox')).toBeRequired();
    rerender(<TextArea label="Message" disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
    rerender(<TextArea label="Message" readOnly />);
    expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
  });

  it('forwards the ref and native attributes to the textarea', () => {
    const ref = { current: null as HTMLTextAreaElement | null };
    render(<TextArea ref={ref} label="Message" name="message" placeholder="Write here" />);
    expect(ref.current?.tagName).toBe('TEXTAREA');
    expect(ref.current).toHaveAttribute('name', 'message');
    expect(ref.current).toHaveAttribute('placeholder', 'Write here');
  });
});

describe('TextArea — value', () => {
  it('calls onChange with the native event and onValueChange with the string', async () => {
    const onChange = vi.fn();
    const onValueChange = vi.fn();
    render(<TextArea label="Message" onChange={onChange} onValueChange={onValueChange} />);
    await userEvent.type(screen.getByRole('textbox'), 'hi');
    expect(onValueChange).toHaveBeenLastCalledWith('hi');
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange.mock.calls[1][0].target.value).toBe('hi');
  });

  it('works controlled', async () => {
    function Controlled() {
      const [value, setValue] = useState('a');
      return <TextArea label="Message" value={value} onValueChange={(v) => setValue(v.toUpperCase())} />;
    }
    render(<Controlled />);
    await userEvent.type(screen.getByRole('textbox'), 'b');
    expect(screen.getByRole('textbox')).toHaveValue('AB');
  });
});

describe('TextArea — counter', () => {
  it('shows count/max when maxLength is set', async () => {
    render(<TextArea label="Bio" maxLength={200} defaultValue="hello world!" />);
    expect(screen.getByText('12/200')).toBeInTheDocument();
    await userEvent.type(screen.getByRole('textbox'), '!');
    expect(screen.getByText('13/200')).toBeInTheDocument();
  });

  it('has no counter without maxLength, or with showCount={false}', () => {
    const { rerender } = render(<TextArea label="Bio" defaultValue="abc" />);
    expect(screen.queryByText(/^\d+\/\d+$/)).toBeNull();
    rerender(<TextArea label="Bio" defaultValue="abc" maxLength={10} showCount={false} />);
    expect(screen.queryByText(/^\d+\/\d+$/)).toBeNull();
  });

  it('the counter is part of the description and is announced politely near the limit', () => {
    render(<TextArea label="Bio" maxLength={20} defaultValue="0123456789012345" helperText="Short" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAccessibleDescription('Short 16/20');
    const live = screen.getByRole('status');
    expect(live).toHaveAttribute('aria-live', 'polite');
    expect(live).toHaveTextContent('4 characters remaining');
  });

  it('stays quiet while far from the limit', () => {
    render(<TextArea label="Bio" maxLength={200} defaultValue="abc" />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('marks the over-limit state', () => {
    render(<TextArea label="Bio" maxLength={5} value="too long" onChange={() => {}} />);
    const counter = screen.getByText('8/5');
    expect(counter).toHaveAttribute('data-over', 'true');
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('3 characters over the limit');
  });

  it('does not change the count while an IME composition is in progress', () => {
    render(<TextArea label="Bio" maxLength={20} defaultValue="ab" />);
    const textarea = screen.getByRole('textbox');
    fireEvent.compositionStart(textarea);
    fireEvent.change(textarea, { target: { value: 'abㅎ' } });
    fireEvent.change(textarea, { target: { value: 'ab하' } });
    expect(screen.getByText('2/20')).toBeInTheDocument();
    fireEvent.compositionEnd(textarea);
    expect(screen.getByText('3/20')).toBeInTheDocument();
  });
});

describe('TextArea — auto resize', () => {
  let scrollHeight = 0;

  beforeEach(() => {
    scrollHeight = 0;
    vi.spyOn(HTMLTextAreaElement.prototype, 'scrollHeight', 'get').mockImplementation(() => scrollHeight);
    const real = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el: Element, pseudo?: string | null) => {
      const cs = real(el, pseudo);
      if (el.tagName !== 'TEXTAREA') return cs;
      return new Proxy(cs, {
        get(target, prop) {
          if (prop === 'lineHeight') return '20px';
          if (prop === 'paddingTop' || prop === 'paddingBottom') return '10px';
          if (prop === 'borderTopWidth' || prop === 'borderBottomWidth') return '0px';
          if (prop === 'boxSizing') return 'border-box';
          const value = Reflect.get(target, prop);
          return typeof value === 'function' ? value.bind(target) : value;
        },
      });
    });
  });

  it('sets an inline height from scrollHeight', () => {
    scrollHeight = 100;
    render(<TextArea label="Message" defaultValue={'a\nb\nc\nd'} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea.style.height).toBe('100px');
    expect(textarea.style.overflowY).toBe('hidden');
  });

  it('measures again when the value changes', () => {
    scrollHeight = 80;
    render(<TextArea label="Message" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea.style.height).toBe('80px');
    scrollHeight = 120;
    fireEvent.change(textarea, { target: { value: 'a\nb\nc\nd\ne' } });
    expect(textarea.style.height).toBe('120px');
  });

  it('caps the height at maxRows and scrolls beyond it', () => {
    scrollHeight = 500;
    render(<TextArea label="Message" maxRows={4} defaultValue="long" />);
    const textarea = screen.getByRole('textbox');
    // 4 줄 × 20px + 위아래 여백 20px
    expect(textarea.style.height).toBe('100px');
    expect(textarea.style.overflowY).toBe('auto');
  });

  it('measures again when the width changes', () => {
    const callbacks: ResizeObserverCallback[] = [];
    let width = 300;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(cb: ResizeObserverCallback) {
          callbacks.push(cb);
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    vi.spyOn(HTMLTextAreaElement.prototype, 'clientWidth', 'get').mockImplementation(() => width);
    scrollHeight = 60;
    render(<TextArea label="Message" defaultValue="wraps" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea.style.height).toBe('60px');

    // 높이만 바뀐 알림(자기 자신이 바꾼 높이)에는 다시 재지 않는다.
    scrollHeight = 90;
    act(() => callbacks.forEach((cb) => cb([], {} as ResizeObserver)));
    expect(textarea.style.height).toBe('60px');

    width = 200;
    act(() => callbacks.forEach((cb) => cb([], {} as ResizeObserver)));
    expect(textarea.style.height).toBe('90px');
    vi.unstubAllGlobals();
  });

  it('does not touch the height when autoResize is off', () => {
    scrollHeight = 100;
    render(<TextArea label="Message" autoResize={false} defaultValue="abc" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea.style.height).toBe('');
    fireEvent.change(textarea, { target: { value: 'abcd' } });
    expect(textarea.style.height).toBe('');
  });
});
