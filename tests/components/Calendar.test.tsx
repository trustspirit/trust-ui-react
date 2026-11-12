// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { StrictMode } from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Calendar, DatePicker } from '../../src/components/DatePicker';

afterEach(cleanup);

// 2026년 3월: 1일이 일요일, 31일까지.
const MARCH = { currentYear: 2026, currentMonth: 2 };
// 두 달을 나란히 보여 주는 화면에서는 같은 날짜가 "이웃 달의 자투리 칸"으로 한 번 더
// 나온다. 그 달에 속한 칸만 고른다.
const cell = (name: RegExp) => {
  const found = screen.getAllByRole('gridcell', { name }).filter((c) => c.hasAttribute('data-in-month'));
  expect(found).toHaveLength(1);
  return found[0];
};

describe('Calendar — 키보드', () => {
  it('날짜 칸의 이름에 연·월·일이 모두 들어간다', () => {
    render(<Calendar {...MARCH} locale="ko-KR" onDateClick={() => {}} />);
    expect(cell(/2026년 3월 15일/)).toBeInTheDocument();
  });

  it('Tab 으로 닿는 칸은 하나뿐이고, 선택된 날짜가 그 칸이다', () => {
    render(
      <Calendar {...MARCH} locale="ko-KR" selectedDate={new Date(2026, 2, 15)} onDateClick={() => {}} />,
    );
    const tabbable = screen.getAllByRole('gridcell').filter((c) => c.tabIndex === 0);
    expect(tabbable).toHaveLength(1);
    expect(tabbable[0]).toBe(cell(/2026년 3월 15일/));
  });

  it('화살표 키로 하루, 한 주씩 포커스를 옮긴다', async () => {
    const user = userEvent.setup();
    render(
      <Calendar {...MARCH} locale="ko-KR" selectedDate={new Date(2026, 2, 15)} onDateClick={() => {}} />,
    );
    cell(/3월 15일/).focus();

    await user.keyboard('{ArrowRight}');
    expect(cell(/3월 16일/)).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(cell(/3월 23일/)).toHaveFocus();

    await user.keyboard('{ArrowLeft}{ArrowUp}');
    expect(cell(/3월 15일/)).toHaveFocus();
  });

  it('Home / End 는 그 주의 처음과 끝으로 간다', async () => {
    const user = userEvent.setup();
    render(
      <Calendar {...MARCH} locale="ko-KR" selectedDate={new Date(2026, 2, 18)} onDateClick={() => {}} />,
    );
    cell(/3월 18일/).focus();

    await user.keyboard('{Home}');
    expect(cell(/3월 15일/)).toHaveFocus(); // 일요일
    await user.keyboard('{End}');
    expect(cell(/3월 21일/)).toHaveFocus(); // 토요일
  });

  it('Enter 로 포커스된 날짜를 고른다', async () => {
    const user = userEvent.setup();
    const onDateClick = vi.fn();
    render(
      <Calendar {...MARCH} locale="ko-KR" selectedDate={new Date(2026, 2, 15)} onDateClick={onDateClick} />,
    );
    cell(/3월 15일/).focus();

    await user.keyboard('{ArrowRight}{Enter}');

    expect(onDateClick).toHaveBeenCalledTimes(1);
    expect(onDateClick.mock.calls[0][0]).toEqual(new Date(2026, 2, 16));
  });

  it('범위를 벗어난 날짜는 포커스는 되지만 고를 수 없다', async () => {
    const user = userEvent.setup();
    const onDateClick = vi.fn();
    render(
      <Calendar
        {...MARCH}
        locale="ko-KR"
        selectedDate={new Date(2026, 2, 15)}
        maxDate={new Date(2026, 2, 15)}
        onDateClick={onDateClick}
      />,
    );
    cell(/3월 15일/).focus();

    await user.keyboard('{ArrowRight}{Enter}');

    expect(cell(/3월 16일/)).toHaveFocus();
    expect(onDateClick).not.toHaveBeenCalled();
  });

  it('달 경계를 넘으면 부모에게 새 날짜를 알린다', async () => {
    const user = userEvent.setup();
    const onFocusedDateChange = vi.fn();
    render(
      <Calendar
        {...MARCH}
        locale="ko-KR"
        selectedDate={new Date(2026, 2, 31)}
        onDateClick={() => {}}
        onFocusedDateChange={onFocusedDateChange}
      />,
    );
    cell(/3월 31일/).focus();

    await user.keyboard('{ArrowRight}');

    expect(onFocusedDateChange).toHaveBeenLastCalledWith(new Date(2026, 3, 1));
  });
});

describe('DatePicker — 키보드', () => {
  it('Enter 로 열면 선택된 날짜에 포커스가 가고, 달을 넘겨 고른 뒤 트리거로 돌아온다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DatePicker label="시작일" locale="ko-KR" defaultValue={new Date(2026, 2, 31)} onChange={onChange} />);
    const trigger = screen.getByRole('combobox');
    trigger.focus();

    await user.keyboard('{Enter}');
    expect(cell(/2026년 3월 31일/)).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(cell(/2026년 4월 1일/)).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 3, 1));
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('StrictMode 에서도 이전 달 버튼이 한 달씩만 움직인다', async () => {
    const user = userEvent.setup();
    render(
      <StrictMode>
        <DatePicker label="시작일" locale="ko-KR" defaultValue={new Date(2026, 1, 10)} />
      </StrictMode>,
    );
    await user.click(screen.getByRole('combobox'));

    await user.click(screen.getByRole('button', { name: 'Previous' })); // 2026년 1월
    await user.click(screen.getByRole('button', { name: 'Previous' })); // 2025년 12월

    expect(screen.getByText(/2025년 12월/)).toBeInTheDocument();
  });
});

describe('DateRangePicker — 키보드', () => {
  it('열면 시작일에 포커스가 가고, 화살표로 오른쪽 달까지 넘어가 범위를 고른다', async () => {
    const { DateRangePicker } = await import('../../src/components/DateRangePicker');
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DateRangePicker
        label="기간"
        locale="ko-KR"
        defaultValue={{ start: new Date(2026, 2, 31), end: null }}
        onChange={onChange}
      />,
    );
    const trigger = screen.getByRole('combobox');
    trigger.focus();

    await user.keyboard('{Enter}');
    expect(cell(/2026년 3월 31일/)).toHaveFocus();

    // 왼쪽 달(3월)의 마지막 날에서 오른쪽 달(4월)의 1일로 넘어간다. 보기는 그대로다.
    await user.keyboard('{ArrowRight}');
    expect(cell(/2026년 4월 1일/)).toHaveFocus();
    expect(screen.getByText(/2026년 3월/)).toBeInTheDocument();

    await user.keyboard('{Enter}'); // 시작일
    await user.keyboard('{ArrowRight}{ArrowRight}{Enter}'); // 종료일

    expect(onChange).toHaveBeenLastCalledWith({
      start: new Date(2026, 3, 1),
      end: new Date(2026, 3, 3),
    });
    expect(trigger).toHaveFocus();
  });

  it('보이는 두 달 밖으로 나가면 보기가 따라온다', async () => {
    const { DateRangePicker } = await import('../../src/components/DateRangePicker');
    const user = userEvent.setup();
    render(
      <DateRangePicker label="기간" locale="ko-KR" defaultValue={{ start: new Date(2026, 2, 1), end: null }} />,
    );
    screen.getByRole('combobox').focus();
    await user.keyboard('{Enter}');

    await user.keyboard('{ArrowLeft}'); // 2월 28일

    expect(cell(/2026년 2월 28일/)).toHaveFocus();
    expect(screen.getByText(/2026년 2월/)).toBeInTheDocument();
  });

  it('StrictMode 에서도 이전 달 버튼이 한 달씩만 움직인다', async () => {
    const { DateRangePicker } = await import('../../src/components/DateRangePicker');
    const user = userEvent.setup();
    render(
      <StrictMode>
        <DateRangePicker label="기간" locale="ko-KR" defaultValue={{ start: new Date(2026, 1, 10), end: null }} />
      </StrictMode>,
    );
    await user.click(screen.getByRole('combobox'));

    await user.click(screen.getByRole('button', { name: /prev/i }));
    await user.click(screen.getByRole('button', { name: /prev/i }));

    expect(screen.getByText(/2025년 12월/)).toBeInTheDocument();
  });
});

describe('DatePicker — 이름, 범위, 모바일', () => {
  const stubTouch = () =>
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('coarse'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));

  it('label 이 콤보박스의 이름이 되고 오류 메시지가 설명으로 연결된다', () => {
    render(<DatePicker label="생년월일" errorMessage="날짜를 고르세요" />);
    const combobox = screen.getByRole('combobox', { name: /생년월일/ });
    expect(combobox).toHaveAccessibleDescription('날짜를 고르세요');
  });

  it('네이티브 입력에 minDate / maxDate 를 전달하고 label 과 연결한다', async () => {
    stubTouch();
    render(
      <DatePicker
        label="예약일"
        mobileVariant="native"
        minDate={new Date(2026, 2, 5)}
        maxDate={new Date(2026, 2, 20)}
      />,
    );
    const input = await screen.findByLabelText(/예약일/);
    expect(input).toHaveAttribute('type', 'date');
    expect(input).toHaveAttribute('min', '2026-03-05');
    expect(input).toHaveAttribute('max', '2026-03-20');
    vi.unstubAllGlobals();
  });

  it('네이티브 입력으로 범위 밖 날짜가 들어오면 받지 않는다', async () => {
    stubTouch();
    const onChange = vi.fn();
    render(<DatePicker label="예약일" mobileVariant="native" minDate={new Date(2026, 2, 5)} onChange={onChange} />);
    const input = await screen.findByLabelText(/예약일/);

    const { fireEvent } = await import('@testing-library/react');
    fireEvent.change(input, { target: { value: '2026-03-01' } });

    expect(onChange).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
