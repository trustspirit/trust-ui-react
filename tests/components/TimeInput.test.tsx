// @vitest-environment jsdom
import * as React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimeInput } from '../../src/components/TimeInput';

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

const hour = () => screen.getByRole('spinbutton', { name: 'Hour' });
const minute = () => screen.getByRole('spinbutton', { name: 'Minute' });
const period = () => screen.getByRole('spinbutton', { name: 'AM/PM' });

describe('TimeInput — 구조', () => {
  it('label 로 이름 붙은 group 안에 시·분 spinbutton 이 있다', () => {
    render(<TimeInput label="Start" hourCycle={24} defaultValue="09:05" helperText="Local time" />);
    const group = screen.getByRole('group', { name: 'Start' });
    expect(group).toHaveAccessibleDescription('Local time');
    expect(group).toContainElement(hour());
    expect(group).toContainElement(minute());
    expect(screen.queryByRole('spinbutton', { name: 'AM/PM' })).toBeNull();

    expect(hour()).toHaveAttribute('aria-valuenow', '9');
    expect(hour()).toHaveAttribute('aria-valuemin', '0');
    expect(hour()).toHaveAttribute('aria-valuemax', '23');
    expect(hour()).toHaveTextContent('09');
    expect(minute()).toHaveAttribute('aria-valuenow', '5');
    expect(minute()).toHaveAttribute('aria-valuemax', '59');
    expect(minute()).toHaveTextContent('05');
  });

  it('12시간제는 AM/PM 조각을 더하고 시를 1–12 로 보여 준다', () => {
    render(<TimeInput label="Start" hourCycle={12} locale="en-US" defaultValue="15:30" />);
    expect(hour()).toHaveAttribute('aria-valuenow', '3');
    expect(hour()).toHaveAttribute('aria-valuemin', '1');
    expect(hour()).toHaveAttribute('aria-valuemax', '12');
    expect(hour()).toHaveAttribute('aria-valuetext', '3 PM');
    expect(period()).toHaveAttribute('aria-valuetext', 'PM');
  });

  it('hourCycle 을 주지 않으면 locale 에서 정한다', () => {
    const { unmount } = render(<TimeInput label="Start" locale="en-US" />);
    expect(screen.getAllByRole('spinbutton')).toHaveLength(3);
    unmount();
    render(<TimeInput label="Start" locale="en-GB" />);
    expect(screen.getAllByRole('spinbutton')).toHaveLength(2);
  });

  it('자정과 정오를 12 로 보여 준다', () => {
    const { rerender } = render(<TimeInput label="Start" hourCycle={12} locale="en-US" value="00:00" />);
    expect(hour()).toHaveAttribute('aria-valuetext', '12 AM');
    rerender(<TimeInput label="Start" hourCycle={12} locale="en-US" value="12:00" />);
    expect(hour()).toHaveAttribute('aria-valuetext', '12 PM');
  });

  it('오류와 required 를 조각에 알리고, 오류 메시지는 group 의 설명이 된다', () => {
    render(<TimeInput label="Start" hourCycle={24} required errorMessage="Pick a time" />);
    expect(screen.getByRole('group')).toHaveAccessibleDescription('Pick a time');
    expect(hour()).toHaveAttribute('aria-invalid', 'true');
    expect(hour()).toHaveAttribute('aria-required', 'true');
    expect(minute()).toHaveAttribute('aria-invalid', 'true');
  });

  it('disabled 면 조각이 탭 순서에서 빠진다', () => {
    render(<TimeInput label="Start" hourCycle={24} disabled />);
    expect(hour()).toHaveAttribute('tabindex', '-1');
    expect(hour()).toHaveAttribute('aria-disabled', 'true');
  });

  it('name 이 있으면 HH:mm 을 폼 값으로 낸다', () => {
    const { container } = render(<TimeInput label="Start" hourCycle={12} locale="en-US" name="start" defaultValue="15:30" />);
    expect((container.querySelector('input[type="hidden"][name="start"]') as HTMLInputElement).value).toBe('15:30');
  });
});

describe('TimeInput — 조각 편집 (24시간제)', () => {
  it('시와 분이 모두 정해지기 전에는 null 이다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimeInput label="Start" hourCycle={24} onChange={onChange} />);
    hour().focus();

    await user.keyboard('1');
    await user.keyboard('4');
    expect(hour()).toHaveTextContent('14');
    expect(onChange).not.toHaveBeenCalled();
    // 두 자리를 채우면 분으로 넘어간다.
    expect(minute()).toHaveFocus();

    await user.keyboard('30');
    expect(onChange).toHaveBeenLastCalledWith('14:30');
  });

  it('더 이어질 수 없는 첫 자리는 바로 다음 조각으로 넘어간다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimeInput label="Start" hourCycle={24} onChange={onChange} />);
    hour().focus();
    await user.keyboard('9');
    expect(hour()).toHaveTextContent('09');
    expect(minute()).toHaveFocus();
    await user.keyboard('7');
    expect(onChange).toHaveBeenLastCalledWith('09:07');
  });

  it('화살표는 조각 값을 바꾸고 양 끝에서 돌아간다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimeInput label="Start" hourCycle={24} defaultValue="23:59" onChange={onChange} />);
    hour().focus();
    await user.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith('00:59');
    await user.keyboard('{ArrowDown}');
    expect(onChange).toHaveBeenLastCalledWith('23:59');

    minute().focus();
    await user.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith('23:00');
    await user.keyboard('{ArrowDown}');
    expect(onChange).toHaveBeenLastCalledWith('23:59');
  });

  it('분 화살표는 step 단위로 움직인다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimeInput label="Start" hourCycle={24} defaultValue="10:07" step={15} onChange={onChange} />);
    minute().focus();
    await user.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith('10:15');
    await user.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith('10:00');
    await user.keyboard('{ArrowDown}');
    expect(onChange).toHaveBeenLastCalledWith('10:45');
  });

  it('좌우 화살표와 ":" 으로 조각 사이를 옮긴다', async () => {
    const user = userEvent.setup();
    render(<TimeInput label="Start" hourCycle={12} locale="en-US" defaultValue="09:30" />);
    hour().focus();
    await user.keyboard('{ArrowRight}');
    expect(minute()).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(period()).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(period()).toHaveFocus();
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(hour()).toHaveFocus();
    await user.keyboard(':');
    expect(minute()).toHaveFocus();
  });

  it('Backspace 는 조각을 비우고 값은 null 이 된다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimeInput label="Start" hourCycle={24} defaultValue="09:30" onChange={onChange} />);
    minute().focus();
    await user.keyboard('{Backspace}');
    expect(minute()).not.toHaveAttribute('aria-valuenow');
    expect(minute()).toHaveAttribute('aria-valuetext', 'Empty');
    expect(onChange).toHaveBeenLastCalledWith(null);
    // 시는 그대로 남는다.
    expect(hour()).toHaveTextContent('09');
  });

  it('IME 조합 중의 키는 무시한다', () => {
    const onChange = vi.fn();
    render(<TimeInput label="Start" hourCycle={24} defaultValue="09:30" onChange={onChange} />);
    hour().focus();
    fireEvent.keyDown(hour(), { key: 'ArrowUp', isComposing: true });
    fireEvent.keyDown(hour(), { key: '1', keyCode: 229 });
    expect(onChange).not.toHaveBeenCalled();
    expect(hour()).toHaveTextContent('09');
  });

  it('제어 모드: 부분 입력 중 부모가 null 을 돌려줘도 입력한 조각이 남는다', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = React.useState<string | null>('09:30');
      return (
        <>
          <TimeInput label="Start" hourCycle={24} value={value} onChange={setValue} />
          <output>{String(value)}</output>
          <button type="button" onClick={() => setValue('18:45')}>
            set
          </button>
        </>
      );
    }
    render(<Controlled />);
    hour().focus();
    await user.keyboard('{Backspace}');
    expect(screen.getByRole('status')).toHaveTextContent('null');
    expect(minute()).toHaveTextContent('30');

    await user.keyboard('7');
    expect(screen.getByRole('status')).toHaveTextContent('07:30');

    await user.click(screen.getByRole('button', { name: 'set' }));
    expect(hour()).toHaveTextContent('18');
    expect(minute()).toHaveTextContent('45');
  });
});

describe('TimeInput — 12시간제 편집', () => {
  it('입력한 시를 AM/PM 과 합쳐 24시간 값으로 낸다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimeInput label="Start" hourCycle={12} locale="en-US" onChange={onChange} />);
    hour().focus();
    await user.keyboard('3');
    expect(minute()).toHaveFocus();
    await user.keyboard('05');
    expect(onChange).toHaveBeenLastCalledWith('03:05');
    // 분을 채우면 AM/PM 으로 넘어간다.
    expect(period()).toHaveFocus();
    await user.keyboard('p');
    expect(onChange).toHaveBeenLastCalledWith('15:05');
    await user.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith('03:05');
  });

  it('12 는 AM 이면 0시, PM 이면 12시다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimeInput label="Start" hourCycle={12} locale="en-US" onChange={onChange} />);
    hour().focus();
    await user.keyboard('12');
    await user.keyboard('00');
    expect(onChange).toHaveBeenLastCalledWith('00:00');
    await user.keyboard('p');
    expect(onChange).toHaveBeenLastCalledWith('12:00');
  });

  it('시 화살표는 1–12 안에서 돌고 AM/PM 은 바꾸지 않는다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimeInput label="Start" hourCycle={12} locale="en-US" defaultValue="23:00" onChange={onChange} />);
    hour().focus();
    await user.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith('12:00');
    await user.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith('13:00');
  });

  it('시를 정하기 전에 고른 AM/PM 을 기억한다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimeInput label="Start" hourCycle={12} locale="en-US" onChange={onChange} />);
    period().focus();
    await user.keyboard('p');
    hour().focus();
    await user.keyboard('7');
    await user.keyboard('15');
    expect(onChange).toHaveBeenLastCalledWith('19:15');
  });
});

describe('TimeInput — min / max', () => {
  it('범위 밖 값은 내보내지 않고 invalid 로 표시한 뒤, 나갈 때 가장 가까운 값에 놓는다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <>
        <TimeInput label="Start" hourCycle={24} defaultValue="10:00" min="09:00" max="18:00" onChange={onChange} />
        <button type="button">next</button>
      </>,
    );
    hour().focus();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    // 08:00 — 범위 밖.
    expect(hour()).toHaveTextContent('08');
    expect(hour()).toHaveAttribute('aria-invalid', 'true');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith('09:00');

    await user.tab(); // 분
    await user.tab(); // 바깥 버튼
    expect(hour()).toHaveTextContent('09');
    expect(hour()).not.toHaveAttribute('aria-invalid');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('max 를 넘으면 max 에 놓는다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimeInput label="Start" hourCycle={24} defaultValue="17:30" min="09:00" max="18:00" onChange={onChange} />);
    minute().focus();
    await user.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith('17:31');
    hour().focus();
    await user.keyboard('{ArrowUp}');
    expect(hour()).toHaveAttribute('aria-invalid', 'true');
    await user.tab();
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith('18:00');
    expect(minute()).toHaveTextContent('00');
  });

  it('조각 사이를 옮기는 동안에는 당기지 않는다', async () => {
    const user = userEvent.setup();
    render(<TimeInput label="Start" hourCycle={24} defaultValue="10:00" min="09:00" />);
    hour().focus();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    await user.keyboard('{ArrowRight}');
    expect(hour()).toHaveTextContent('08');
  });
});

describe('TimeInput — 터치', () => {
  it('네이티브 time 입력을 쓰고 min/max/step 을 넘긴다', async () => {
    stubTouchDevice();
    const onChange = vi.fn();
    render(
      <TimeInput label="Start" defaultValue="09:30" min="09:00" max="18:00" step={15} name="start" onChange={onChange} />,
    );
    const input = (await screen.findByLabelText('Start')) as HTMLInputElement;
    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveAttribute('type', 'time');
    expect(input.value).toBe('09:30');
    expect(input).toHaveAttribute('min', '09:00');
    expect(input).toHaveAttribute('max', '18:00');
    // step 은 초 단위다.
    expect(input).toHaveAttribute('step', '900');
    expect(input).toHaveAttribute('name', 'start');
    expect(screen.queryByRole('spinbutton')).toBeNull();

    fireEvent.change(input, { target: { value: '10:15' } });
    expect(onChange).toHaveBeenLastCalledWith('10:15');
    fireEvent.change(input, { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('네이티브 입력도 범위 밖 값을 받아들이지 않는다 (iOS 피커는 min/max 를 강제하지 않는다)', async () => {
    stubTouchDevice();
    const onChange = vi.fn();
    render(<TimeInput label="Start" defaultValue="10:00" min="09:00" max="18:00" onChange={onChange} />);
    const input = (await screen.findByLabelText('Start')) as HTMLInputElement;
    await act(async () => {});

    fireEvent.change(input, { target: { value: '20:00' } });
    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveAttribute('aria-invalid', 'true');

    fireEvent.blur(input);
    expect(onChange).toHaveBeenLastCalledWith('18:00');
    expect(input.value).toBe('18:00');
    expect(input).not.toHaveAttribute('aria-invalid');
  });
});
