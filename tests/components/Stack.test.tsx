// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { createRef } from 'react';
import { Stack, HStack, VStack } from '../../src/components/layout/Stack';

afterEach(cleanup);

const gapOf = (el: HTMLElement) => el.style.getPropertyValue('--tui-stack-gap');

describe('Stack', () => {
  it('기본값은 세로 방향, 간격 3, 줄바꿈 없음이다', () => {
    render(<Stack data-testid="s">내용</Stack>);
    const el = screen.getByTestId('s');

    expect(el.tagName).toBe('DIV');
    expect(el).toHaveAttribute('data-direction', 'vertical');
    expect(gapOf(el)).toBe('var(--tui-gap-3)');
    expect(el).not.toHaveAttribute('data-wrap');
    expect(el).not.toHaveAttribute('data-align');
    expect(el).not.toHaveAttribute('data-justify');
  });

  it('gap 을 간격 토큰으로 바꿔 커스텀 프로퍼티에 싣는다', () => {
    const { rerender } = render(<Stack data-testid="s" gap={5} />);
    expect(gapOf(screen.getByTestId('s'))).toBe('var(--tui-gap-5)');

    rerender(<Stack data-testid="s" gap={0} />);
    expect(gapOf(screen.getByTestId('s'))).toBe('0px');
  });

  it('direction, align, justify, wrap 을 스타일시트가 읽을 수 있는 속성으로 내보낸다', () => {
    render(
      <Stack data-testid="s" direction="horizontal" align="baseline" justify="between" wrap />,
    );
    const el = screen.getByTestId('s');

    expect(el).toHaveAttribute('data-direction', 'horizontal');
    expect(el).toHaveAttribute('data-align', 'baseline');
    expect(el).toHaveAttribute('data-justify', 'between');
    expect(el).toHaveAttribute('data-wrap');
  });

  it('flex 속성을 인라인 스타일로 박지 않는다 — className 으로 덮을 수 있어야 한다', () => {
    render(<Stack data-testid="s" direction="horizontal" align="center" justify="end" wrap gap={2} />);
    const { style } = screen.getByTestId('s');

    expect(style.display).toBe('');
    expect(style.gap).toBe('');
    expect(style.flexDirection).toBe('');
    expect(style.alignItems).toBe('');
    expect(style.justifyContent).toBe('');
    expect(style.flexWrap).toBe('');
  });

  it('as 로 지정한 요소로 렌더링한다', () => {
    render(
      <Stack as="ul" aria-label="할 일">
        <li>하나</li>
        <li>둘</li>
      </Stack>,
    );

    const list = screen.getByRole('list', { name: '할 일' });
    expect(list.tagName).toBe('UL');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('ref 를 루트 요소로 전달한다', () => {
    const ref = createRef<HTMLElement>();
    render(<Stack ref={ref} as="section" data-testid="s" />);
    expect(ref.current).toBe(screen.getByTestId('s'));
  });

  it('className, style, 네이티브 속성을 루트에 그대로 넘긴다', () => {
    render(
      <Stack
        data-testid="s"
        id="filters"
        className="mine"
        style={{ maxWidth: 320 }}
        aria-label="필터"
        role="group"
      />,
    );
    const el = screen.getByRole('group', { name: '필터' });

    expect(el).toHaveAttribute('id', 'filters');
    expect(el).toHaveClass('mine');
    expect(el.style.maxWidth).toBe('320px');
    // 사용자가 넘긴 style 이 간격 변수를 지우지 않는다
    expect(gapOf(el)).toBe('var(--tui-gap-3)');
  });

  it('style 로 넘긴 간격 변수가 gap prop 보다 우선한다', () => {
    render(
      <Stack
        data-testid="s"
        gap={2}
        style={{ '--tui-stack-gap': '3px' } as React.CSSProperties}
      />,
    );
    expect(gapOf(screen.getByTestId('s'))).toBe('3px');
  });
});

describe('HStack / VStack', () => {
  it('HStack 은 가로 방향으로 고정한다', () => {
    render(<HStack data-testid="h" gap={1} align="center" />);
    const el = screen.getByTestId('h');

    expect(el).toHaveAttribute('data-direction', 'horizontal');
    expect(el).toHaveAttribute('data-align', 'center');
    expect(gapOf(el)).toBe('var(--tui-gap-1)');
  });

  it('VStack 은 세로 방향으로 고정한다', () => {
    render(<VStack data-testid="v" />);
    expect(screen.getByTestId('v')).toHaveAttribute('data-direction', 'vertical');
  });

  it('프리셋도 as 와 ref 를 받는다', () => {
    const ref = createRef<HTMLElement>();
    render(<HStack ref={ref} as="nav" aria-label="주요" />);
    expect(ref.current).toBe(screen.getByRole('navigation', { name: '주요' }));
  });
});
