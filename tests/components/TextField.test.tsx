// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextField } from '../../src/components/TextField';

afterEach(cleanup);

describe('TextField', () => {
  it('레이블과 입력을 연결한다', () => {
    render(<TextField label="주문 단가" />);
    expect(screen.getByLabelText(/주문 단가/)).toBeInTheDocument();
  });

  it('오류 메시지를 노출한다', () => {
    render(<TextField label="수량" error errorMessage="1 이상이어야 합니다" />);
    expect(screen.getByText('1 이상이어야 합니다')).toBeInTheDocument();
  });

  it('포커스 상태를 JS 로 추적하지 않는다 — CSS 가 판단한다', async () => {
    const { container } = render(<TextField label="주문 단가" />);
    const wrapper = container.querySelector('[class*="inputWrapper"]')!;
    const before = wrapper.className;

    await userEvent.click(screen.getByLabelText(/주문 단가/));

    // .focused 클래스가 더는 붙지 않는다. 포커스 표현은 :focus-within 이 맡는다.
    expect(wrapper.className).toBe(before);
  });

  it('통화 서식에서 등폭 숫자를 쓴다', () => {
    const { container } = render(<TextField label="금액" format="currency" />);
    const input = container.querySelector('input')!;
    expect(input.className).toMatch(/numeric/);
  });

  it('사용자가 넘긴 id를 rest 스프레드가 덮어쓰지 않는다', () => {
    const { container } = render(
      <TextField label="주문 단가" id="custom-id" />,
    );

    // rest 스프레드로 인해 생성된 id가 사용자 id로 되돌아가는 회귀를 막는다.
    expect(screen.getByLabelText(/주문 단가/)).toBe(
      container.querySelector('#custom-id'),
    );
    expect(container.querySelector('input')!.id).toBe('custom-id');
  });

  it('required 를 실제 input 에 전달한다', () => {
    render(<TextField label="이름" required />);
    expect(screen.getByLabelText(/이름/)).toBeRequired();
  });

  it('숫자 defaultValue 와 서식을 함께 써도 렌더된다', () => {
    render(<TextField label="금액" format="currency" defaultValue={10000} />);
    expect(screen.getByLabelText(/금액/)).toHaveValue('10,000');
  });

  it.each([
    [{ type: 'tel' as const }, 'tel'],
    [{ format: 'currency' as const }, 'numeric'],
    [{ format: 'decimal' as const }, 'decimal'],
  ])('서식 필드에 맞는 가상 키보드를 요청한다 (%o → %s)', (props, mode) => {
    render(<TextField label="값" {...props} />);
    expect(screen.getByLabelText(/값/)).toHaveAttribute('inputmode', mode);
  });

  it('호출자가 넘긴 inputMode 가 기본값보다 우선한다', () => {
    render(<TextField label="값" type="tel" inputMode="numeric" />);
    expect(screen.getByLabelText(/값/)).toHaveAttribute('inputmode', 'numeric');
  });

  it('서식 필드의 onChange 이벤트에서 target.name 과 서식 적용된 값을 읽을 수 있다', async () => {
    const seen: Array<{ name: string; value: string }> = [];
    render(
      <TextField
        label="전화"
        type="tel"
        name="phone"
        onChange={(e) => seen.push({ name: e.target.name, value: e.target.value })}
      />,
    );

    await userEvent.type(screen.getByLabelText(/전화/), '0101');

    expect(seen.at(-1)).toEqual({ name: 'phone', value: '010-1' });
  });

  it('구분자 바로 뒤에서 Backspace 를 누르면 앞 숫자가 지워진다', async () => {
    const onValueChange = vi.fn();
    render(
      <TextField label="금액" format="currency" defaultValue="1234" onValueChange={onValueChange} />,
    );
    const input = screen.getByLabelText(/금액/) as HTMLInputElement;
    expect(input).toHaveValue('1,234');

    // 캐럿을 쉼표 바로 뒤(인덱스 2)에 둔다: "1,|234"
    await userEvent.type(input, '{Backspace}', { initialSelectionStart: 2, initialSelectionEnd: 2 });

    expect(input).toHaveValue('234');
    expect(onValueChange).toHaveBeenLastCalledWith('234');
    expect(input.selectionStart).toBe(0);
  });

  it('가운데에 숫자를 넣어도 캐럿이 넣은 숫자 뒤에 남는다', async () => {
    render(<TextField label="금액" format="currency" defaultValue="1234" />);
    const input = screen.getByLabelText(/금액/) as HTMLInputElement;

    // "1,2|34" 에 9 를 넣으면 "12,9|34"
    await userEvent.type(input, '9', { initialSelectionStart: 3, initialSelectionEnd: 3 });

    expect(input).toHaveValue('12,934');
    expect(input.selectionStart).toBe(4);
  });

  it('비밀번호 표시 토글에 키보드로 닿을 수 있고 눌림 상태를 알린다', async () => {
    const user = userEvent.setup();
    render(<TextField label="비밀번호" type="password" />);
    const input = screen.getByLabelText(/^비밀번호/);
    const toggle = screen.getByRole('button', { name: /password/i });

    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    input.focus();
    await user.tab();
    expect(toggle).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(input).toHaveAttribute('type', 'text');
  });
});
