// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { createRef } from 'react';
import { Grid, GridItem } from '../../src/components/layout/Grid';

afterEach(cleanup);

const prop = (el: HTMLElement, name: string) => el.style.getPropertyValue(name);

describe('Grid', () => {
  it('기본값은 최소 240px 트랙의 반응형 격자, 간격 4 다', () => {
    render(<Grid data-testid="g" />);
    const el = screen.getByTestId('g');

    expect(el.tagName).toBe('DIV');
    expect(el).toHaveAttribute('data-columns', 'responsive');
    expect(prop(el, '--tui-grid-min')).toBe('240px');
    expect(el).not.toHaveAttribute('data-max');
    expect(prop(el, '--tui-grid-row-gap')).toBe('var(--tui-gap-4)');
    expect(prop(el, '--tui-grid-column-gap')).toBe('var(--tui-gap-4)');
  });

  it('columns 가 숫자면 고정 열 수를 내보낸다', () => {
    render(<Grid data-testid="g" columns={3} />);
    const el = screen.getByTestId('g');

    expect(el).toHaveAttribute('data-columns', 'fixed');
    expect(prop(el, '--tui-grid-columns')).toBe('3');
    expect(prop(el, '--tui-grid-min')).toBe('');
  });

  it('columns 객체의 minWidth 와 max 를 내보낸다', () => {
    render(<Grid data-testid="g" columns={{ minWidth: 160, max: 4 }} />);
    const el = screen.getByTestId('g');

    expect(el).toHaveAttribute('data-columns', 'responsive');
    expect(el).toHaveAttribute('data-max');
    expect(prop(el, '--tui-grid-min')).toBe('160px');
    expect(prop(el, '--tui-grid-max')).toBe('4');
    expect(prop(el, '--tui-grid-columns')).toBe('');
  });

  it('쓸 수 없는 열 수는 1 로 끌어올린다', () => {
    const { rerender } = render(<Grid data-testid="g" columns={0} />);
    expect(prop(screen.getByTestId('g'), '--tui-grid-columns')).toBe('1');

    rerender(<Grid data-testid="g" columns={2.7} />);
    expect(prop(screen.getByTestId('g'), '--tui-grid-columns')).toBe('2');

    rerender(<Grid data-testid="g" columns={{ minWidth: 200, max: 0 }} />);
    expect(prop(screen.getByTestId('g'), '--tui-grid-max')).toBe('1');
  });

  it('gap 을 행·열 간격 모두에 적용하고 rowGap, columnGap 으로 따로 덮는다', () => {
    const { rerender } = render(<Grid data-testid="g" gap={2} />);
    let el = screen.getByTestId('g');
    expect(prop(el, '--tui-grid-row-gap')).toBe('var(--tui-gap-2)');
    expect(prop(el, '--tui-grid-column-gap')).toBe('var(--tui-gap-2)');

    rerender(<Grid data-testid="g" gap={2} rowGap={6} columnGap={0} />);
    el = screen.getByTestId('g');
    expect(prop(el, '--tui-grid-row-gap')).toBe('var(--tui-gap-6)');
    // 0 도 길이 단위를 붙인다 — max 계산의 calc() 안에서 쓰이기 때문이다
    expect(prop(el, '--tui-grid-column-gap')).toBe('0px');
  });

  it('격자 속성을 인라인 스타일로 박지 않는다', () => {
    render(<Grid data-testid="g" columns={2} gap={3} />);
    const { style } = screen.getByTestId('g');

    expect(style.display).toBe('');
    expect(style.gridTemplateColumns).toBe('');
    expect(style.gap).toBe('');
  });

  it('ref, className, style, 네이티브 속성을 루트에 넘긴다', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Grid
        ref={ref}
        id="cards"
        className="mine"
        style={{ maxWidth: 640 }}
        role="list"
        aria-label="카드"
      />,
    );
    const el = screen.getByRole('list', { name: '카드' });

    expect(ref.current).toBe(el);
    expect(el).toHaveAttribute('id', 'cards');
    expect(el).toHaveClass('mine');
    expect(el.style.maxWidth).toBe('640px');
    expect(prop(el, '--tui-grid-min')).toBe('240px');
  });
});

describe('Grid.Item', () => {
  it('Grid.Item 과 GridItem 은 같은 컴포넌트다', () => {
    expect(Grid.Item).toBe(GridItem);
  });

  it('span 이 없으면 열 배치를 건드리지 않는다', () => {
    render(<Grid.Item data-testid="i">칸</Grid.Item>);
    const el = screen.getByTestId('i');

    expect(el).not.toHaveAttribute('data-span');
    expect(prop(el, '--tui-grid-item-column')).toBe('');
  });

  it('숫자 span 은 그만큼의 열을 차지한다', () => {
    render(<Grid.Item data-testid="i" span={2} />);
    const el = screen.getByTestId('i');

    expect(el).toHaveAttribute('data-span', '2');
    expect(prop(el, '--tui-grid-item-column')).toBe('span 2');
  });

  it("span='full' 은 첫 줄부터 끝 줄까지 차지한다", () => {
    render(<Grid.Item data-testid="i" span="full" />);
    const el = screen.getByTestId('i');

    expect(el).toHaveAttribute('data-span', 'full');
    expect(prop(el, '--tui-grid-item-column')).toBe('1 / -1');
  });

  it('ref 와 네이티브 속성을 넘긴다', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Grid.Item ref={ref} role="listitem" className="mine" style={{ minHeight: 40 }}>
        칸
      </Grid.Item>,
    );
    const el = screen.getByRole('listitem');

    expect(ref.current).toBe(el);
    expect(el).toHaveClass('mine');
    expect(el.style.minHeight).toBe('40px');
  });
});
