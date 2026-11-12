import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useId,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react';
import styles from './List.module.css';

/* ── Context ── */

interface ListContextValue {
  /** `li` 를 쓸 수 없는 컨테이너(div)에서는 role 로 목록 의미를 준다. */
  native: boolean;
}

const ListContext = createContext<ListContextValue>({ native: true });

/** List.Section 이 안쪽 List 에 넘기는 제목 id. */
const SectionContext = createContext<string | undefined>(undefined);

/* ── List ── */

export interface ListProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /**
   * Hairline between rows. `'inset'` starts the hairline at the text, after the leading slot.
   */
  dividers?: boolean | 'inset';
  /**
   * Row density. By default the list inherits the density of the page;
   * setting it scopes the density tokens to this list.
   */
  density?: 'comfortable' | 'compact';
  /** `outlined` draws the list on a sheet surface with a hairline border */
  variant?: 'plain' | 'outlined';
  /** Element to render. `div` keeps list semantics through roles. */
  as?: 'ul' | 'ol' | 'div';
  /** Accessible name of the list */
  'aria-label'?: string;
  /** Id of the element that names the list. Set automatically inside `List.Section`. */
  'aria-labelledby'?: string;
  /** `List.Item` elements */
  children?: ReactNode;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
}

const ListRoot = forwardRef<HTMLElement, ListProps>(
  (
    {
      dividers = true,
      density,
      variant = 'plain',
      as = 'ul',
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      children,
      className,
      style,
      ...rest
    },
    ref,
  ) => {
    const sectionHeadingId = useContext(SectionContext);
    const Component = as as ElementType;
    const native = as !== 'div';

    const classNames = [
      styles.list,
      variant === 'outlined' ? styles.outlined : '',
      dividers === 'inset' ? styles.dividersInset : dividers ? styles.dividers : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    // 직접 준 이름이 우선이다. 없을 때만 섹션 제목이 이름이 된다.
    const labelledBy = ariaLabelledBy ?? (ariaLabel ? undefined : sectionHeadingId);

    return (
      <ListContext.Provider value={{ native }}>
        <Component
          // list-style: none 인 목록은 Safari/VoiceOver 가 목록으로 읽지 않는다.
          // role 을 명시해 되살린다.
          role="list"
          {...rest}
          ref={ref}
          className={classNames}
          style={style}
          // 밀도 토큰은 data-density 로 범위가 정해진다. 주지 않으면 페이지 값을 물려받는다.
          data-density={density}
          aria-label={ariaLabel}
          aria-labelledby={labelledBy}
        >
          {children}
        </Component>
      </ListContext.Provider>
    );
  },
);

ListRoot.displayName = 'List';

/* ── 뒤쪽 슬롯이 스스로 누를 수 있는 것인지 ── */

const NATIVE_INTERACTIVE = new Set(['a', 'button', 'input', 'select', 'textarea', 'summary']);
const INTERACTIVE_ROLES = new Set([
  'button',
  'link',
  'switch',
  'checkbox',
  'radio',
  'menuitem',
  'combobox',
  'slider',
  'spinbutton',
  'textbox',
  'tab',
]);
// 라이브러리 컨트롤은 displayName 으로 알아본다. 가져오지 않으므로 List 만 쓰는
// 번들에 Switch 나 Button 이 딸려 오지 않는다.
const LIBRARY_CONTROLS = new Set([
  'Switch',
  'Checkbox',
  'Radio',
  'RadioGroup',
  'Button',
  'IconButton',
  'Chip',
  'Select',
  'Combobox',
  'Slider',
  'Stepper',
  'SegmentedControl',
  'TextField',
  'TextArea',
  'NumberInput',
  'TimeInput',
  'DatePicker',
  'DateRangePicker',
  'Menu',
  'Menu.Trigger',
]);
const HANDLER_PROPS = ['onClick', 'onChange', 'onValueChange', 'onCheckedChange', 'onPress', 'href', 'to'];

function isInteractive(node: ReactNode): boolean {
  return Children.toArray(node).some((child) => {
    if (!isValidElement(child)) return false;
    const props = child.props as Record<string, unknown>;
    const type = child.type as string | { displayName?: string; name?: string };

    if (typeof type === 'string') {
      if (NATIVE_INTERACTIVE.has(type)) return true;
    } else {
      const name = type?.displayName ?? type?.name;
      if (name && LIBRARY_CONTROLS.has(name)) return true;
    }
    if (typeof props.role === 'string' && INTERACTIVE_ROLES.has(props.role)) return true;
    if (typeof props.tabIndex === 'number' && props.tabIndex >= 0) return true;
    if (HANDLER_PROPS.some((key) => props[key] !== undefined)) return true;
    // <span><Switch/></span> 처럼 감싼 경우.
    return isInteractive(props.children as ReactNode);
  });
}

/* ── List.Item ── */

export interface ListItemProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'onClick'> {
  /** Main text of the row */
  title: ReactNode;
  /** Secondary text under the title */
  description?: ReactNode;
  /** Slot before the text: an icon or avatar */
  leading?: ReactNode;
  /**
   * Slot after the text: a value, badge, chevron or a control.
   * An interactive control here is kept outside the row link/button (see `trailingInteractive`).
   */
  trailing?: ReactNode;
  /** Makes the row a link. Adds a trailing chevron unless `trailing` is given. */
  href?: string;
  /** Makes the row a button */
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  /** Link component used for the row (e.g. a router `Link`). Makes the row a link. */
  as?: ElementType;
  /** Extra props for the row link or button (e.g. `to`, `target`, `rel`) */
  linkProps?: Record<string, unknown>;
  /** Whether the row is disabled */
  disabled?: boolean;
  /** Marks the current row of a navigation list (`aria-current="true"`) */
  selected?: boolean;
  /** Lets the title and description wrap instead of truncating */
  multiline?: boolean;
  /**
   * Whether `trailing` contains its own control. Detected automatically for native
   * controls, library controls and elements with handlers; set it for custom components.
   */
  trailingInteractive?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
}

function ChevronIcon() {
  return (
    <svg
      className="tui-mirror-rtl"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}

const ListItem = forwardRef<HTMLElement, ListItemProps>(
  (
    {
      title,
      description,
      leading,
      trailing,
      href,
      onClick,
      as: LinkComponent,
      linkProps,
      disabled = false,
      selected = false,
      multiline = false,
      trailingInteractive,
      className,
      style,
      ...rest
    },
    ref,
  ) => {
    const { native } = useContext(ListContext);
    const ItemTag = (native ? 'li' : 'div') as ElementType;

    const isLink = href !== undefined || LinkComponent !== undefined;
    const isButton = !isLink && onClick !== undefined;
    const interactive = isLink || isButton;

    const hasTrailing = trailing !== undefined && trailing !== null && trailing !== false;
    const trailingIsControl = hasTrailing && (trailingInteractive ?? isInteractive(trailing));
    // 누를 수 있는 것 안에 누를 수 있는 것을 넣지 않는다. 행 타깃은 글 영역만 덮고
    // 컨트롤은 그 바깥, 형제로 둔다.
    const trailingOutside = trailingIsControl;
    const showChevron = isLink && !hasTrailing;

    const hasDescription = description !== undefined && description !== null && description !== '';

    const rowContent = (
      <>
        {leading !== undefined && leading !== null && <span className={styles.leading}>{leading}</span>}
        <span className={styles.body}>
          <span className={styles.text}>
            <span className={styles.title}>{title}</span>
            {/* 플렉스 상자 안의 공백은 그려지지 않지만 접근성 이름에서는 낱말을 띄운다.
                없으면 "Wi-FiConnected" 로 읽는 보조 기술이 있다. */}
            {hasDescription && ' '}
            {hasDescription && <span className={styles.description}>{description}</span>}
          </span>
          {hasTrailing && !trailingOutside && ' '}
          {hasTrailing && !trailingOutside && <span className={styles.trailing}>{trailing}</span>}
          {showChevron && (
            <span className={`${styles.trailing} ${styles.chevron}`}>
              <ChevronIcon />
            </span>
          )}
        </span>
      </>
    );

    const rowClassNames = [styles.row, interactive ? styles.rowInteractive : '']
      .filter(Boolean)
      .join(' ');

    let row: ReactNode;
    if (isLink) {
      const LinkTag = (LinkComponent ?? 'a') as ElementType;
      row = (
        <LinkTag
          {...linkProps}
          className={rowClassNames}
          // 비활성 링크: href 를 빼면 포커스도 이동도 없다. role 과 aria-disabled 로
          // "지금은 쓸 수 없는 링크"임을 남긴다.
          // href 가 없을 때는 키 자체를 넘기지 않는다. 라우터 링크는 `to` 로 href 를
          // 만들기 때문에 undefined 를 넘기면 그 값을 덮어쓴다.
          {...(href !== undefined && !disabled ? { href } : null)}
          {...(disabled ? { href: undefined, role: 'link', 'aria-disabled': true } : null)}
          aria-current={selected ? 'true' : undefined}
          onClick={(event: MouseEvent<HTMLElement>) => {
            if (disabled) {
              event.preventDefault();
              return;
            }
            onClick?.(event);
          }}
        >
          {rowContent}
        </LinkTag>
      );
    } else if (isButton) {
      row = (
        <button
          {...linkProps}
          type="button"
          className={rowClassNames}
          disabled={disabled}
          aria-current={selected ? 'true' : undefined}
          onClick={onClick}
        >
          {rowContent}
        </button>
      );
    } else {
      row = <div className={rowClassNames}>{rowContent}</div>;
    }

    const itemClassNames = [
      styles.item,
      multiline ? styles.multiline : '',
      trailingOutside ? styles.split : '',
      selected ? styles.selected : '',
      disabled ? styles.itemDisabled : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <ItemTag
        role={native ? undefined : 'listitem'}
        {...rest}
        ref={ref}
        className={itemClassNames}
        style={style}
        aria-current={selected && !interactive ? 'true' : undefined}
      >
        {row}
        {trailingOutside && <span className={styles.trailingOutside}>{trailing}</span>}
      </ItemTag>
    );
  },
);

ListItem.displayName = 'List.Item';

/* ── List.Section ── */

export interface ListSectionProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Heading of the group. Names the list inside. */
  title: ReactNode;
  /** Heading level of the title */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  /** The `List` of this group */
  children?: ReactNode;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
}

const ListSection = forwardRef<HTMLDivElement, ListSectionProps>(
  ({ title, headingLevel = 3, children, className, style, ...rest }, ref) => {
    const headingId = `${useId()}-heading`;
    const Heading = `h${headingLevel}` as ElementType;

    return (
      <div
        {...rest}
        ref={ref}
        className={[styles.section, className ?? ''].filter(Boolean).join(' ')}
        style={style}
      >
        <Heading id={headingId} className={styles.sectionTitle}>
          {title}
        </Heading>
        <SectionContext.Provider value={headingId}>{children}</SectionContext.Provider>
      </div>
    );
  },
);

ListSection.displayName = 'List.Section';

/* ── Export as compound component ── */

export const List = Object.assign(ListRoot, {
  Item: ListItem,
  Section: ListSection,
});
