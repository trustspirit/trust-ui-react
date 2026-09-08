import { useCallback, type CSSProperties, type ReactNode } from 'react';
import styles from './Table.module.css';
import { getNestedValue, toneOf } from './values';
import { useSort } from './useSort';
import type { Column, SortDirection, TableProps } from './types';

export type { Column, TableProps, Tone, MobileSlot } from './types';

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

const TONE_CLASS = {
  rise: styles.rise,
  fall: styles.fall,
  neutral: '',
} as const;

/**
 * 수치 열은 지정하지 않으면 우측으로 정렬한다. 자릿수가 오른쪽에서 맞아야
 * 위아래 행을 비교할 수 있기 때문이다. align 을 직접 주면 그것이 이긴다.
 */
function alignClass<T>(col: Column<T>): string | undefined {
  const align = col.align ?? (col.numeric ? 'right' : undefined);
  if (align === 'right') return styles.alignRight;
  if (align === 'center') return styles.alignCenter;
  return undefined;
}

function cellContent<T>(col: Column<T>, row: T, index: number): ReactNode {
  const value = getNestedValue(row, col.key);
  return col.render ? col.render(value, row, index) : (value as ReactNode);
}

/** 방향을 갖는 열인지. 굵기(550)는 열 전체에 걸고 행별 방향에는 걸지 않는다. */
function isToned<T>(col: Column<T>): boolean {
  return Boolean(col.tone) && col.tone !== 'none';
}

/**
 * 정렬 표시. 정렬 가능함을 알리는 신호는 형태이지 색이 아니므로,
 * 아직 정렬되지 않은 열에도 옅은 겹화살표를 남겨 둔다.
 */
function SortIcon({ direction }: { direction: SortDirection }) {
  const common = {
    width: 12,
    height: 12,
    viewBox: '0 0 12 12',
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  if (direction === 'asc') {
    return (
      <svg {...common} strokeWidth={2}>
        <path d="M6 9V3M3 5l3-3 3 3" />
      </svg>
    );
  }
  if (direction === 'desc') {
    return (
      <svg {...common} strokeWidth={2}>
        <path d="M6 3v6M3 7l3 3 3-3" />
      </svg>
    );
  }
  return (
    <svg {...common} strokeWidth={1.5}>
      <path d="M4 4.5L6 2.5l2 2M4 7.5L6 9.5l2-2" />
    </svg>
  );
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  stickyHeader = false,
  hoverable = true,
  emptyText = 'No data available',
  onRowClick,
  rowKey,
  className,
  style,
}: TableProps<T>) {
  const { sort, toggle, sorted } = useSort(data);

  const getRowKey = useCallback(
    (row: T, index: number): string => {
      if (!rowKey) return String(index);
      if (typeof rowKey === 'function') return rowKey(row);
      return String(getNestedValue(row, rowKey) ?? index);
    },
    [rowKey],
  );

  return (
    <div
      className={cx(styles.wrapper, stickyHeader && styles.stickyWrapper, className)}
      style={style}
    >
      <table className={cx(styles.table, hoverable && styles.hoverable)}>
        <thead className={stickyHeader ? styles.stickyHeader : undefined}>
          <tr>
            {columns.map((col) => {
              const isSorted = sort.key === col.key;
              const thStyle: CSSProperties = {};
              if (col.width) {
                thStyle.width = typeof col.width === 'number' ? `${col.width}px` : col.width;
              }
              return (
                <th
                  key={col.key}
                  scope="col"
                  className={cx(styles.th, alignClass(col), isSorted && styles.sorted)}
                  style={thStyle}
                  aria-sort={
                    isSorted
                      ? sort.direction === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  }
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      className={styles.sortButton}
                      onClick={() => toggle(col.key)}
                    >
                      <span className={styles.headerText}>{col.header}</span>
                      <span className={styles.sortIndicator}>
                        <SortIcon direction={isSorted ? sort.direction : null} />
                      </span>
                    </button>
                  ) : (
                    <span className={styles.headerLabel}>{col.header}</span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td className={styles.emptyCell} colSpan={Math.max(columns.length, 1)}>
                {emptyText}
              </td>
            </tr>
          ) : (
            sorted.map((row, rowIndex) => (
              <tr
                key={getRowKey(row, rowIndex)}
                className={onRowClick ? styles.clickableRow : undefined}
                onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cx(
                      styles.td,
                      alignClass(col),
                      isToned(col) && styles.toned,
                      TONE_CLASS[toneOf(col, row)],
                    )}
                  >
                    {cellContent(col, row, rowIndex)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

Table.displayName = 'Table';
