import { forwardRef, type HTMLAttributes, type MouseEvent, type ReactNode } from 'react';
import styles from './BottomNav.module.css';

export interface BottomNavItem {
  /** Unique value identifying the destination. */
  value: string;
  /** Visible label; also the accessible name. */
  label: string;
  /** Icon shown above the label. Decorative: it is hidden from assistive technology. */
  icon: ReactNode;
  /** Small counter or status shown at the icon's corner. Read out after the label. */
  badge?: ReactNode;
  /** Renders the item as a link to this URL instead of a button. */
  href?: string;
  /** Whether the item is disabled. */
  disabled?: boolean;
}

export interface BottomNavProps extends Omit<HTMLAttributes<HTMLElement>, 'onChange'> {
  /** Destinations, in display order. Intended for 2–5 top-level destinations. */
  items: BottomNavItem[];
  /** Value of the active destination. */
  value: string;
  /**
   * Called when a destination is activated. The click event is passed as a second argument so
   * link items (`href`) can call `event.preventDefault()` for client-side routing.
   */
  onChange: (value: string, event: MouseEvent<HTMLElement>) => void;
  /** Accessible name of the navigation landmark. Default 'Primary'. */
  'aria-label'?: string;
  /** Fix the bar to the bottom of the viewport (padded by the bottom safe area). `false` renders it in flow. Default true. */
  fixed?: boolean;
  /** Show the text labels. When false they stay available to assistive technology. Default true. */
  showLabels?: boolean;
}

/**
 * Mobile bottom bar for top-level destinations.
 *
 * 탭 목록(tablist)이 아니라 내비게이션이다: 항목은 패널을 바꾸는 탭이 아니라 화면을 옮기는
 * 링크/버튼이므로 `<nav>` 안의 목록으로 두고, 현재 위치는 aria-current="page" 로 알린다.
 */
export const BottomNav = forwardRef<HTMLElement, BottomNavProps>(function BottomNav(
  {
    items,
    value,
    onChange,
    'aria-label': ariaLabel = 'Primary',
    fixed = true,
    showLabels = true,
    className,
    ...rest
  },
  ref,
) {
  const classNames = [styles.nav, fixed && styles.fixed, className].filter(Boolean).join(' ');

  return (
    <nav ref={ref} aria-label={ariaLabel} className={classNames} {...rest}>
      <ul className={styles.list}>
        {items.map((item) => {
          const active = item.value === value;
          const itemClassName = [styles.item, active && styles.active, item.disabled && styles.disabled]
            .filter(Boolean)
            .join(' ');
          const body = (
            <>
              <span className={styles.icon} aria-hidden="true">
                {item.icon}
              </span>
              <span className={showLabels ? styles.label : styles.visuallyHidden}>{item.label}</span>
              {/* 라벨 뒤에 둔다 — 접근 가능한 이름이 "Inbox 3" 순서로 읽힌다. 위치는 CSS 가 아이콘 모서리로 옮긴다. */}
              {item.badge !== undefined && item.badge !== null && item.badge !== false && (
                <span className={styles.badge}>{item.badge}</span>
              )}
            </>
          );

          return (
            <li key={item.value} className={styles.listItem}>
              {item.href !== undefined ? (
                <a
                  // 비활성 링크는 href 를 뗀다. href 없는 <a> 는 이동도 포커스도 되지 않는다.
                  href={item.disabled ? undefined : item.href}
                  aria-disabled={item.disabled ? true : undefined}
                  aria-current={active ? 'page' : undefined}
                  className={itemClassName}
                  onClick={item.disabled ? undefined : (e) => onChange(item.value, e)}
                >
                  {body}
                </a>
              ) : (
                <button
                  type="button"
                  disabled={item.disabled}
                  aria-current={active ? 'page' : undefined}
                  className={itemClassName}
                  onClick={(e) => onChange(item.value, e)}
                >
                  {body}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
});

BottomNav.displayName = 'BottomNav';
