import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { gapValue, type StackGap } from '../Stack/gap';
import styles from './Grid.module.css';

/** Spacing step shared with `Stack`: `0` = none, `1`–`6` = `--tui-gap-1`…`--tui-gap-6`. */
export type GridGap = StackGap;

/** Responsive column definition: as many tracks as fit, each at least `minWidth` px wide. */
export interface GridResponsiveColumns {
  /** Minimum track width in px. Below this the grid drops a column; on very narrow screens it collapses to one. */
  minWidth: number;
  /** Upper bound on the number of columns, however wide the container gets. */
  max?: number;
}

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Column layout. A number means exactly that many equal tracks at every
   * width. An object is responsive: tracks are at least `minWidth` px, at most
   * `max` columns, collapsing to a single column when the container is
   * narrower than `minWidth`. Default: `{ minWidth: 240 }`.
   */
  columns?: number | GridResponsiveColumns;
  /** Space between rows and columns on the spacing scale. Default: `4`. */
  gap?: GridGap;
  /** Space between rows. Overrides `gap` for the block axis. */
  rowGap?: GridGap;
  /** Space between columns. Overrides `gap` for the inline axis. */
  columnGap?: GridGap;
  /** Grid content — any elements, or `Grid.Item` when a cell needs to span columns */
  children?: ReactNode;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
}

export interface GridItemProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Columns this cell occupies. `'full'` stretches across the whole row at any
   * column count. A number is a fixed span — pair it with a numeric `columns`,
   * since a responsive grid may have fewer columns than the span.
   */
  span?: number | 'full';
  /** Cell content */
  children?: ReactNode;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
}

// 0, 음수, 소수, NaN 은 repeat()/span 에 넣으면 선언 전체가 무효가 되어 격자가
// 한 줄로 무너진다. 가장 가까운 유효한 값으로 맞춘다.
const toCount = (n: number) => (Number.isFinite(n) ? Math.max(1, Math.floor(n)) : 1);

const DEFAULT_COLUMNS: GridResponsiveColumns = { minWidth: 240 };

/**
 * Grid cell that can span columns. Also available as `Grid.Item`. Plain
 * children work as cells too — this is only needed for `span`.
 */
export const GridItem = forwardRef<HTMLDivElement, GridItemProps>(function GridItem(
  { span, className, style, children, ...rest },
  ref,
) {
  const column =
    span === undefined ? undefined : span === 'full' ? '1 / -1' : `span ${toCount(span)}`;
  const vars = column === undefined ? undefined : { '--tui-grid-item-column': column };

  return (
    <div
      ref={ref}
      className={[styles.item, className].filter(Boolean).join(' ')}
      data-span={span === undefined ? undefined : span === 'full' ? 'full' : toCount(span)}
      style={{ ...vars, ...style } as CSSProperties}
      {...rest}
    >
      {children}
    </div>
  );
});
GridItem.displayName = 'Grid.Item';

const GridRoot = forwardRef<HTMLDivElement, GridProps>(function Grid(
  { columns = DEFAULT_COLUMNS, gap = 4, rowGap, columnGap, className, style, children, ...rest },
  ref,
) {
  const fixed = typeof columns === 'number';
  const max = !fixed && columns.max !== undefined ? toCount(columns.max) : undefined;

  // 열 정의와 간격은 변수로만 내보낸다. grid-template-columns 를 인라인으로
  // 쓰면 소비자가 className 으로 덮을 수 없다.
  const vars: Record<string, string | number> = {
    '--tui-grid-row-gap': gapValue(rowGap ?? gap, 4),
    '--tui-grid-column-gap': gapValue(columnGap ?? gap, 4),
  };
  if (fixed) {
    vars['--tui-grid-columns'] = toCount(columns);
  } else {
    const minWidth = Number.isFinite(columns.minWidth) ? Math.max(0, columns.minWidth) : 240;
    vars['--tui-grid-min'] = `${minWidth}px`;
    if (max !== undefined) vars['--tui-grid-max'] = max;
  }

  return (
    <div
      ref={ref}
      className={[styles.grid, className].filter(Boolean).join(' ')}
      data-columns={fixed ? 'fixed' : 'responsive'}
      data-max={max !== undefined ? '' : undefined}
      style={{ ...vars, ...style } as CSSProperties}
      {...rest}
    >
      {children}
    </div>
  );
});
GridRoot.displayName = 'Grid';

/**
 * CSS grid with a gap from the spacing scale. Responsive by default without
 * media queries: the track count follows the container, not the viewport.
 */
export const Grid = Object.assign(GridRoot, { Item: GridItem });
