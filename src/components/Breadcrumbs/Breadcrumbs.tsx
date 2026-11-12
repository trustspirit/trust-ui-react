import {
  Children,
  Fragment,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ElementType,
  type HTMLAttributes,
  type MouseEventHandler,
  type ReactElement,
  type ReactNode,
} from 'react';
import styles from './Breadcrumbs.module.css';

/** Fragment 로 묶인 자식까지 한 겹으로 펼친다. */
function flattenChildren(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap((child) =>
    isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment
      ? flattenChildren(child.props.children)
      : [child],
  );
}

/* ── Context ── */

interface ItemContextValue {
  /** 이 항목이 경로의 마지막(현재 페이지)인가. */
  current: boolean;
}

const ItemContext = createContext<ItemContextValue>({ current: false });

/* ── Breadcrumbs (root) ── */

export interface BreadcrumbsProps extends HTMLAttributes<HTMLElement> {
  /** Separator between items. Hidden from assistive technology. Default '/'. */
  separator?: ReactNode;
  /** Accessible name of the navigation landmark. Default 'Breadcrumb'. */
  'aria-label'?: string;
  /**
   * Maximum number of items shown. When the trail is longer, the middle collapses into a single
   * "…" button (the first item and the last `maxItems - 1` items stay) that expands the full trail.
   */
  maxItems?: number;
  /** Accessible label of the "…" button. Default 'Show path'. */
  expandLabel?: string;
  /** `Breadcrumbs.Item` elements. The last one is the current page. */
  children: ReactNode;
}

const BreadcrumbsRoot = forwardRef<HTMLElement, BreadcrumbsProps>(function Breadcrumbs(
  {
    separator = '/',
    'aria-label': ariaLabel = 'Breadcrumb',
    maxItems,
    expandLabel = 'Show path',
    children,
    className,
    ...rest
  },
  ref,
) {
  const [expanded, setExpanded] = useState(false);
  const listRef = useRef<HTMLOListElement | null>(null);
  const focusRevealedRef = useRef(false);

  const items = flattenChildren(children).filter((child): child is ReactElement => isValidElement(child));
  const lastIndex = items.length - 1;

  // 첫 항목 + "…" + 마지막 (limit - 1)개. 2 미만은 의미가 없으므로 2 로 올린다.
  const limit = maxItems === undefined ? Infinity : Math.max(maxItems, 2);
  const collapsed = !expanded && items.length > limit;
  const tailStart = collapsed ? items.length - (limit - 1) : 1;

  // "…" 버튼은 누르는 순간 사라진다. 포커스가 body 로 떨어지지 않도록 새로 드러난 첫 항목으로 옮긴다.
  useEffect(() => {
    if (!expanded || !focusRevealedRef.current) return;
    focusRevealedRef.current = false;
    listRef.current?.children[1]?.querySelector<HTMLElement>('a[href], button, [tabindex]')?.focus();
  }, [expanded]);

  const renderItem = (item: ReactElement, index: number) => (
    <li key={item.key ?? index} className={styles.item}>
      {index > 0 && (
        <span className={styles.separator} aria-hidden="true">
          {separator}
        </span>
      )}
      <ItemContext.Provider value={{ current: index === lastIndex }}>{item}</ItemContext.Provider>
    </li>
  );

  return (
    <nav
      ref={ref}
      aria-label={ariaLabel}
      className={[styles.breadcrumbs, className].filter(Boolean).join(' ')}
      {...rest}
    >
      <ol ref={listRef} className={styles.list}>
        {items.length > 0 && renderItem(items[0], 0)}
        {collapsed && (
          <li key="tui-breadcrumbs-ellipsis" className={styles.item}>
            <span className={styles.separator} aria-hidden="true">
              {separator}
            </span>
            <button
              type="button"
              className={styles.expandButton}
              aria-label={expandLabel}
              aria-expanded={false}
              onClick={() => {
                focusRevealedRef.current = true;
                setExpanded(true);
              }}
            >
              <span aria-hidden="true">…</span>
            </button>
          </li>
        )}
        {items.slice(tailStart).map((item, offset) => renderItem(item, tailStart + offset))}
      </ol>
    </nav>
  );
});

BreadcrumbsRoot.displayName = 'Breadcrumbs';

/* ── Breadcrumbs.Item ── */

interface BreadcrumbsItemOwnProps<C extends ElementType> {
  /**
   * Custom link component (e.g. a router `Link`). It receives `className`, `href`, `onClick` and
   * any extra props you pass (such as `to`). Not used for the last item, which is never a link.
   */
  as?: C;
  /** Link target. Renders an anchor. */
  href?: string;
  /** Click handler. Without `href` or `as` the item renders as a button. */
  onClick?: MouseEventHandler<HTMLElement>;
  /** Item content. */
  children?: ReactNode;
  /** Additional CSS class name. */
  className?: string;
}

export type BreadcrumbsItemProps<C extends ElementType = 'a'> = BreadcrumbsItemOwnProps<C> &
  Omit<ComponentPropsWithoutRef<C>, keyof BreadcrumbsItemOwnProps<C>>;

function BreadcrumbsItem<C extends ElementType = 'a'>({
  as,
  href,
  onClick,
  children,
  className,
  ...rest
}: BreadcrumbsItemProps<C>) {
  const { current } = useContext(ItemContext);

  // 현재 페이지는 링크가 아니다. 자기 자신으로 가는 링크는 갈 곳이 없고,
  // 스크린리더에는 "현재 페이지"와 "링크"가 겹쳐 읽힌다. href·as 가 있어도 글자로만 둔다.
  if (current) {
    return (
      <span aria-current="page" className={[styles.current, className].filter(Boolean).join(' ')}>
        {children}
      </span>
    );
  }

  const linkClassName = [styles.link, className].filter(Boolean).join(' ');

  if (as) {
    const Component = as as ElementType;
    return (
      <Component {...rest} {...(href !== undefined ? { href } : null)} onClick={onClick} className={linkClassName}>
        {children}
      </Component>
    );
  }

  if (href !== undefined) {
    return (
      <a {...(rest as ComponentPropsWithoutRef<'a'>)} href={href} onClick={onClick} className={linkClassName}>
        {children}
      </a>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${linkClassName} ${styles.linkButton}`}>
        {children}
      </button>
    );
  }

  return <span className={[styles.text, className].filter(Boolean).join(' ')}>{children}</span>;
}

BreadcrumbsItem.displayName = 'Breadcrumbs.Item';

/* ── Export as compound component ── */

export const Breadcrumbs = Object.assign(BreadcrumbsRoot, {
  Item: BreadcrumbsItem,
});
