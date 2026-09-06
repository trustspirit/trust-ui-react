// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
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
});
