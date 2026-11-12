// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { createRef } from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { Skeleton } from '../../src/components/Skeleton';

afterEach(cleanup);

describe('Skeleton', () => {
  it('기본은 장식이라 접근성 트리에서 숨긴다', () => {
    render(<Skeleton data-testid="sk" />);
    expect(screen.getByTestId('sk')).toHaveAttribute('aria-hidden', 'true');
  });

  it('기본 크기는 폭 100%, 높이 1em 이다', () => {
    render(<Skeleton data-testid="sk" />);
    expect(screen.getByTestId('sk')).toHaveStyle({ width: '100%', height: '1em' });
  });

  it('숫자 크기는 px 로, 문자열은 그대로 쓴다', () => {
    render(<Skeleton data-testid="sk" shape="rect" width={120} height="4rem" />);
    expect(screen.getByTestId('sk')).toHaveStyle({ width: '120px', height: '4rem' });
  });

  it('circle 은 폭과 높이가 같다', () => {
    render(<Skeleton data-testid="sk" shape="circle" width={48} height={12} />);
    expect(screen.getByTestId('sk')).toHaveStyle({ width: '48px', height: '48px' });
  });

  it('circle 에 height 만 주면 그 값을 지름으로 쓴다', () => {
    render(<Skeleton data-testid="sk" shape="circle" height={32} />);
    expect(screen.getByTestId('sk')).toHaveStyle({ width: '32px', height: '32px' });
  });

  it('lines 만큼 막대를 그리고 마지막 줄은 60% 폭이다', () => {
    render(<Skeleton data-testid="sk" lines={3} height={10} />);
    const bars = Array.from(screen.getByTestId('sk').children) as HTMLElement[];
    expect(bars).toHaveLength(3);
    expect(bars[0]).toHaveStyle({ width: '100%', height: '10px' });
    expect(bars[1]).toHaveStyle({ width: '100%' });
    expect(bars[2]).toHaveStyle({ width: '60%' });
    expect(screen.getByTestId('sk')).toHaveAttribute('aria-hidden', 'true');
  });

  it('lines 는 text 모양에서만 적용된다', () => {
    render(<Skeleton data-testid="sk" shape="rect" lines={3} />);
    expect(screen.getByTestId('sk').children).toHaveLength(0);
  });

  it('ref 와 className 을 루트에 전달한다', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Skeleton ref={ref} data-testid="sk" className="custom" />);
    expect(ref.current).toBe(screen.getByTestId('sk'));
    expect(ref.current).toHaveClass('custom');
  });
});
