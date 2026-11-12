// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { createRef } from 'react';
import { Divider } from '../../src/components/layout/Divider';

afterEach(cleanup);

describe('Divider', () => {
  it('기본은 <hr> 이다 — 가로 구분선', () => {
    render(<Divider />);
    const el = screen.getByRole('separator');

    expect(el.tagName).toBe('HR');
    // hr 의 암묵적 방향이 horizontal 이라 속성을 중복해 달지 않는다
    expect(el).not.toHaveAttribute('aria-orientation');
  });

  it('세로는 aria-orientation 을 단 separator 다', () => {
    render(<Divider orientation="vertical" />);
    const el = screen.getByRole('separator');

    expect(el.tagName).toBe('DIV');
    expect(el).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('decorative 면 어느 방향이든 separator 로 노출하지 않는다', () => {
    const { rerender } = render(<Divider decorative data-testid="d" />);
    expect(screen.queryByRole('separator')).toBeNull();
    expect(screen.getByTestId('d').tagName).toBe('HR');
    expect(screen.getByTestId('d')).toHaveAttribute('role', 'presentation');

    rerender(<Divider decorative orientation="vertical" data-testid="d" />);
    expect(screen.queryByRole('separator')).toBeNull();
    expect(screen.getByTestId('d')).toHaveAttribute('role', 'presentation');
    expect(screen.getByTestId('d')).not.toHaveAttribute('aria-orientation');
  });

  it('label 이 있으면 그 글자가 separator 의 이름이 된다', () => {
    render(<Divider label="또는" />);
    const el = screen.getByRole('separator', { name: '또는' });

    expect(el.tagName).toBe('DIV');
    expect(el).toHaveTextContent('또는');
  });

  it('label 이 요소여도 이름을 얻는다', () => {
    render(
      <Divider
        label={
          <>
            <svg aria-hidden="true" />
            <strong>2026년 11월</strong>
          </>
        }
      />,
    );
    expect(screen.getByRole('separator', { name: '2026년 11월' })).toBeInTheDocument();
  });

  it('aria-label 을 직접 주면 그것이 이름이 된다', () => {
    render(<Divider label="또는" aria-label="다른 로그인 방법" />);
    expect(screen.getByRole('separator', { name: '다른 로그인 방법' })).toBeInTheDocument();
  });

  it('구분선이 여러 개여도 이름이 섞이지 않는다', () => {
    render(
      <>
        <Divider label="오늘" />
        <Divider label="어제" />
      </>,
    );
    expect(screen.getByRole('separator', { name: '오늘' })).toBeInTheDocument();
    expect(screen.getByRole('separator', { name: '어제' })).toBeInTheDocument();
  });

  it('decorative 에 label 을 주면 글자는 남고 separator 역할만 뺀다', () => {
    render(<Divider decorative label="또는" />);
    expect(screen.queryByRole('separator')).toBeNull();
    expect(screen.getByText('또는')).toBeInTheDocument();
  });

  it('세로 구분선은 label 을 그리지 않는다', () => {
    render(<Divider orientation="vertical" label="또는" />);
    expect(screen.queryByText('또는')).toBeNull();
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('variant 를 스타일시트가 읽을 수 있게 내보낸다', () => {
    const { rerender } = render(<Divider />);
    expect(screen.getByRole('separator')).toHaveAttribute('data-variant', 'subtle');

    rerender(<Divider variant="strong" />);
    expect(screen.getByRole('separator')).toHaveAttribute('data-variant', 'strong');
  });

  it('ref 를 루트 요소로 전달한다', () => {
    const ref = createRef<HTMLElement>();
    const { rerender } = render(<Divider ref={ref} />);
    expect(ref.current?.tagName).toBe('HR');

    rerender(<Divider ref={ref} orientation="vertical" />);
    expect(ref.current).toBe(screen.getByRole('separator'));

    rerender(<Divider ref={ref} label="또는" />);
    expect(ref.current).toBe(screen.getByRole('separator'));
  });

  it('className, style, 네이티브 속성을 루트에 넘긴다', () => {
    render(<Divider id="cut" className="mine" style={{ marginBlock: 8 }} data-testid="d" />);
    const el = screen.getByTestId('d');

    expect(el).toBe(screen.getByRole('separator'));
    expect(el).toHaveAttribute('id', 'cut');
    expect(el).toHaveClass('mine');
    expect(el.style.marginBlock).toBe('8px');
  });
});
