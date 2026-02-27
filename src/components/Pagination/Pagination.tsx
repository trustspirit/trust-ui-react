import { useMemo, type CSSProperties } from 'react';
import styles from './Pagination.module.css';

/* ── Types ── */

export interface PaginationProps {
  /** Total number of pages */
  totalPages: number;
  /** Currently active page (1-indexed) */
  currentPage: number;
  /** Callback when page changes */
  onChange: (page: number) => void;
  /** Number of sibling pages to show around current (default: 1) */
  siblingCount?: number;
  /** Visual variant (default: 'default') */
  variant?: 'default' | 'simple';
  /** Size preset (default: 'md') */
  size?: 'sm' | 'md' | 'lg';
  /** Disable all pagination controls */
  disabled?: boolean;
  /** Additional CSS class name */
  className?: string;
  /** Additional inline styles */
  style?: CSSProperties;
}

/* ── Page range helper ── */

type PageItem = number | 'ellipsis-start' | 'ellipsis-end';

function buildPageRange(
  totalPages: number,
  currentPage: number,
  siblingCount: number,
): PageItem[] {
  // Total page numbers to show (siblings on each side + current + first + last)
  const totalPageNumbers = siblingCount * 2 + 5;

  // If total pages fits within the range, show all
  if (totalPages <= totalPageNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const showLeftEllipsis = leftSiblingIndex > 2;
  const showRightEllipsis = rightSiblingIndex < totalPages - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    // Show first pages + ellipsis + last
    const leftRange = Array.from(
      { length: siblingCount * 2 + 3 },
      (_, i) => i + 1,
    );
    return [...leftRange, 'ellipsis-end', totalPages];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    // Show first + ellipsis + last pages
    const rightRange = Array.from(
      { length: siblingCount * 2 + 3 },
      (_, i) => totalPages - (siblingCount * 2 + 2) + i,
    );
    return [1, 'ellipsis-start', ...rightRange];
  }

  // Both ellipses
  const middleRange = Array.from(
    { length: rightSiblingIndex - leftSiblingIndex + 1 },
    (_, i) => leftSiblingIndex + i,
  );
  return [1, 'ellipsis-start', ...middleRange, 'ellipsis-end', totalPages];
}

/* ── Icons ── */

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 4l-4 4 4 4" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4l4 4-4 4" />
    </svg>
  );
}

/* ── Pagination Component ── */

export function Pagination({
  totalPages,
  currentPage,
  onChange,
  siblingCount = 1,
  variant = 'default',
  size = 'md',
  disabled = false,
  className,
  style,
}: PaginationProps) {
  const pages = useMemo(
    () => buildPageRange(totalPages, currentPage, siblingCount),
    [totalPages, currentPage, siblingCount],
  );

  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;

  const classNames = [styles.pagination, styles[size], className]
    .filter(Boolean)
    .join(' ');

  if (variant === 'simple') {
    return (
      <nav aria-label="pagination" className={classNames} style={style}>
        <ul className={styles.list}>
          <li>
            <button
              type="button"
              className={[styles.button, styles.navButton].join(' ')}
              onClick={() => onChange(currentPage - 1)}
              disabled={disabled || isFirst}
              aria-label="Previous page"
            >
              <ChevronLeft />
              <span>Previous</span>
            </button>
          </li>
          <li>
            <span className={styles.pageInfo}>
              Page {currentPage} of {totalPages}
            </span>
          </li>
          <li>
            <button
              type="button"
              className={[styles.button, styles.navButton].join(' ')}
              onClick={() => onChange(currentPage + 1)}
              disabled={disabled || isLast}
              aria-label="Next page"
            >
              <span>Next</span>
              <ChevronRight />
            </button>
          </li>
        </ul>
      </nav>
    );
  }

  return (
    <nav aria-label="pagination" className={classNames} style={style}>
      <ul className={styles.list}>
        <li>
          <button
            type="button"
            className={[styles.button, styles.navButton].join(' ')}
            onClick={() => onChange(currentPage - 1)}
            disabled={disabled || isFirst}
            aria-label="Previous page"
          >
            <ChevronLeft />
          </button>
        </li>

        {pages.map((item, index) => {
          if (item === 'ellipsis-start' || item === 'ellipsis-end') {
            return (
              <li key={item}>
                <span className={styles.ellipsis} aria-hidden="true">
                  ...
                </span>
              </li>
            );
          }

          const page = item as number;
          const isActive = page === currentPage;

          return (
            <li key={page}>
              <button
                type="button"
                className={[
                  styles.button,
                  styles.pageButton,
                  isActive ? styles.active : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onChange(page)}
                disabled={disabled}
                aria-label={`Page ${page}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {page}
              </button>
            </li>
          );
        })}

        <li>
          <button
            type="button"
            className={[styles.button, styles.navButton].join(' ')}
            onClick={() => onChange(currentPage + 1)}
            disabled={disabled || isLast}
            aria-label="Next page"
          >
            <ChevronRight />
          </button>
        </li>
      </ul>
    </nav>
  );
}

Pagination.displayName = 'Pagination';
