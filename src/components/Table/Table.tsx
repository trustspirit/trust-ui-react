import { useState, useMemo, useCallback, type CSSProperties, type ReactNode } from 'react';
import styles from './Table.module.css';

/* ── Types ── */

export interface Column<T> {
  /** Property key to access in row data */
  key: string;
  /** Column header text */
  header: string;
  /** Custom cell renderer */
  render?: (value: any, row: T, index: number) => ReactNode;
  /** Enable sorting for this column */
  sortable?: boolean;
  /** Fixed column width */
  width?: string | number;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T> {
  /** Column definitions */
  columns: Column<T>[];
  /** Data rows */
  data: T[];
  /** Visual variant (default: 'default') */
  variant?: 'default' | 'striped' | 'bordered';
  /** Size preset (default: 'md') */
  size?: 'sm' | 'md' | 'lg';
  /** Sticky header on scroll (default: false) */
  stickyHeader?: boolean;
  /** Highlight rows on hover (default: true) */
  hoverable?: boolean;
  /** Text shown when data is empty */
  emptyText?: string;
  /** Row click handler */
  onRowClick?: (row: T, index: number) => void;
  /** Key extractor for row identity */
  rowKey?: string | ((row: T) => string);
  /** Additional CSS class name */
  className?: string;
  /** Additional inline styles */
  style?: CSSProperties;
}

type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  key: string | null;
  direction: SortDirection;
}

/* ── Helper ── */

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

/* ── Table Component ── */

export function Table<T extends Record<string, any>>({
  columns,
  data,
  variant = 'default',
  size = 'md',
  stickyHeader = false,
  hoverable = true,
  emptyText = 'No data available',
  onRowClick,
  rowKey,
  className,
  style,
}: TableProps<T>) {
  const [sort, setSort] = useState<SortState>({ key: null, direction: null });

  const handleSort = useCallback((columnKey: string) => {
    setSort((prev) => {
      if (prev.key !== columnKey) {
        return { key: columnKey, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { key: columnKey, direction: 'desc' };
      }
      return { key: null, direction: null };
    });
  }, []);

  const sortedData = useMemo(() => {
    if (!sort.key || !sort.direction) return data;

    const sorted = [...data].sort((a, b) => {
      const aVal = getNestedValue(a, sort.key!);
      const bVal = getNestedValue(b, sort.key!);

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal);
      const bStr = String(bVal);
      const cmp = aStr.localeCompare(bStr);
      return sort.direction === 'asc' ? cmp : -cmp;
    });

    return sorted;
  }, [data, sort.key, sort.direction]);

  const getRowKey = useCallback(
    (row: T, index: number): string => {
      if (!rowKey) return String(index);
      if (typeof rowKey === 'function') return rowKey(row);
      return String(getNestedValue(row, rowKey) ?? index);
    },
    [rowKey],
  );

  const classNames = [
    styles.wrapper,
    stickyHeader ? styles.stickyWrapper : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const tableClassNames = [
    styles.table,
    styles[variant],
    styles[size],
    hoverable ? styles.hoverable : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} style={style}>
      <table className={tableClassNames}>
        <thead className={stickyHeader ? styles.stickyHeader : undefined}>
          <tr>
            {columns.map((col) => {
              const thStyle: CSSProperties = {};
              if (col.width) {
                thStyle.width = typeof col.width === 'number' ? `${col.width}px` : col.width;
              }
              if (col.align) {
                thStyle.textAlign = col.align;
              }

              const isSorted = sort.key === col.key;
              const thClassNames = [
                styles.th,
                col.sortable ? styles.sortable : '',
                isSorted ? styles.sorted : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <th
                  key={col.key}
                  className={thClassNames}
                  style={thStyle}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  aria-sort={
                    isSorted && sort.direction === 'asc'
                      ? 'ascending'
                      : isSorted && sort.direction === 'desc'
                        ? 'descending'
                        : undefined
                  }
                >
                  <span className={styles.headerContent}>
                    {col.header}
                    {col.sortable && (
                      <span className={styles.sortIndicator} aria-hidden="true">
                        {isSorted && sort.direction === 'asc' && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 9V3M3 5l3-3 3 3" />
                          </svg>
                        )}
                        {isSorted && sort.direction === 'desc' && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M6 3v6M3 7l3 3 3-3" />
                          </svg>
                        )}
                        {!isSorted && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4">
                            <path d="M4 4.5L6 2.5l2 2M4 7.5L6 9.5l2-2" />
                          </svg>
                        )}
                      </span>
                    )}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td className={styles.emptyCell} colSpan={columns.length}>
                {emptyText}
              </td>
            </tr>
          ) : (
            sortedData.map((row, rowIndex) => {
              const tdStyle = (col: Column<T>): CSSProperties => {
                const s: CSSProperties = {};
                if (col.align) s.textAlign = col.align;
                return s;
              };

              return (
                <tr
                  key={getRowKey(row, rowIndex)}
                  className={onRowClick ? styles.clickableRow : undefined}
                  onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={styles.td} style={tdStyle(col)}>
                      {col.render
                        ? col.render(getNestedValue(row, col.key), row, rowIndex)
                        : getNestedValue(row, col.key)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

Table.displayName = 'Table';
