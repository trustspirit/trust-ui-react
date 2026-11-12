// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { createRef } from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { Spinner } from '../../src/components/Spinner';

afterEach(cleanup);

describe('Spinner', () => {
  it('status 역할이고 기본 이름은 Loading 이다', () => {
    render(<Spinner />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('label 이 접근 가능한 이름이 된다', () => {
    render(<Spinner label="Saving changes" />);
    expect(screen.getByRole('status', { name: 'Saving changes' })).toBeInTheDocument();
  });

  it('showLabel 이 없으면 라벨을 화면에서만 숨기고 접근성 트리에는 남긴다', () => {
    render(<Spinner label="Saving changes" />);
    const label = screen.getByText('Saving changes');
    expect(label).toHaveAttribute('data-visually-hidden');
    // aria-hidden 이나 hidden 으로 숨기면 스크린 리더도 못 읽는다
    expect(label.closest('[aria-hidden="true"], [hidden]')).toBeNull();
  });

  it('showLabel 이면 라벨을 보이게 그리고 이름도 유지한다', () => {
    render(<Spinner label="Saving changes" showLabel />);
    expect(screen.getByText('Saving changes')).not.toHaveAttribute('data-visually-hidden');
    expect(screen.getByRole('status', { name: 'Saving changes' })).toBeInTheDocument();
  });

  it('여러 개를 그려도 각자 자기 라벨로 이름 붙는다', () => {
    render(
      <>
        <Spinner label="One" />
        <Spinner label="Two" />
      </>,
    );
    expect(screen.getByRole('status', { name: 'One' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Two' })).toBeInTheDocument();
  });

  it('ref 와 나머지 속성을 루트에 전달한다', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Spinner ref={ref} data-testid="sp" size="lg" />);
    expect(ref.current).toBe(screen.getByTestId('sp'));
    expect(ref.current).toHaveAttribute('role', 'status');
  });
});
