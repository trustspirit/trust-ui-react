import {
  createContext,
  forwardRef,
  useContext,
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ElementType,
  type ForwardedRef,
  type HTMLAttributes,
  type JSXElementConstructor,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import styles from './Card.module.css';

/* ── Context ── */

interface CardContextValue {
  /**
   * 루트가 <button> 이나 <label> 이면 안쪽에는 구문(phrasing) 콘텐츠만 올 수 있다.
   * 그때 하위 파트는 div/heading 대신 span 으로 렌더한다.
   */
  phrasing: boolean;
  /** 제목의 히트 영역을 카드 전체로 늘릴지 */
  stretched: boolean;
}

const CardContext = createContext<CardContextValue>({ phrasing: false, stretched: false });

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

/* ── Card Root ── */

type CardElement = 'div' | 'article' | 'section' | 'li';
type CardAs = CardElement | JSXElementConstructor<any>;

interface CardOwnProps {
  /** Surface style: 'outlined' (sheet + hairline), 'filled' (field surface, no border) or 'plain' (no surface). */
  variant?: 'outlined' | 'filled' | 'plain';
  /** Inner padding of the header, content and footer. Media always runs edge to edge. */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /**
   * Makes the whole card a link. The card must then contain no other interactive element —
   * use `interactive="stretched"` when it needs inner actions.
   */
  href?: string;
  /** Link target, when `href` is set */
  target?: string;
  /** Link relationship, when `href` is set */
  rel?: string;
  /**
   * Without `href`, makes the whole card a `<button type="button">`. The card must then contain
   * no other interactive element. With `href`, it is called in addition to the navigation.
   */
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  /**
   * 'stretched': the card stays a plain container and the title rendered by `Card.Header`
   * (given `href` or `onClick`) becomes the link/button, with its hit area stretched over the
   * whole card. Other controls inside the card stay clickable above it. Root `href`/`onClick`
   * are ignored in this mode.
   */
  interactive?: 'stretched';
  /** Makes the card a selectable option backed by a native checkbox or radio input. */
  selectable?: boolean;
  /** 'multiple' (default) uses checkbox semantics, 'single' radio semantics (group by `name`). */
  selectionMode?: 'single' | 'multiple';
  /** Whether the card is selected (controlled) */
  selected?: boolean;
  /** Initial selection (uncontrolled) */
  defaultSelected?: boolean;
  /** Called when the user changes the selection. A 'single' card only reports becoming selected. */
  onSelectedChange?: (selected: boolean) => void;
  /** Form field name of a selectable card */
  name?: string;
  /** Form value submitted when a selectable card is selected */
  value?: string;
  /** Marks a selectable card as required for form validation */
  required?: boolean;
  /** Disables a clickable or selectable card */
  disabled?: boolean;
  /** Card content: `Card.Media`, `Card.Header`, `Card.Content`, `Card.Footer` or anything else */
  children?: ReactNode;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
}

export type CardProps<T extends CardAs = 'div'> = CardOwnProps & {
  /**
   * Element to render for a static card ('div', 'article', 'section' or 'li'), or a custom
   * link component (e.g. a router `Link`), which makes the whole card a link and receives the
   * remaining props.
   */
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, keyof CardOwnProps | 'as'>;

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  );
}

function CardRoot(
  {
    as,
    variant = 'outlined',
    padding = 'md',
    href,
    onClick,
    interactive,
    selectable = false,
    selectionMode = 'multiple',
    selected,
    defaultSelected,
    onSelectedChange,
    name,
    value,
    required,
    disabled = false,
    children,
    className,
    style,
    ...rest
  }: CardProps<CardAs>,
  ref: ForwardedRef<HTMLElement>,
) {
  const surface = cx(styles.card, styles[variant], styles[`pad_${padding}`]);
  const stretched = interactive === 'stretched';

  /* ── 선택형: label 이 카드를 감싸고, 숨긴 네이티브 input 이 상태와 폼 값을 가진다 ── */
  if (selectable) {
    // 이름·설명은 컨트롤인 input 의 것이다. 나머지 속성은 루트 label 로 간다.
    const {
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      'aria-describedby': ariaDescribedBy,
      ...labelRest
    } = rest as HTMLAttributes<HTMLLabelElement>;
    return (
      <label
        ref={ref as ForwardedRef<HTMLLabelElement>}
        className={cx(styles.selectableRoot, className)}
        style={style}
        {...labelRest}
      >
        <input
          type={selectionMode === 'single' ? 'radio' : 'checkbox'}
          className={styles.input}
          name={name}
          value={value}
          checked={selected}
          defaultChecked={selected === undefined ? defaultSelected : undefined}
          disabled={disabled}
          required={required}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          // 제어 모드에서 핸들러가 없어도 React 가 읽기 전용 경고를 내지 않게 항상 단다.
          onChange={(event: ChangeEvent<HTMLInputElement>) => onSelectedChange?.(event.target.checked)}
        />
        <span className={cx(surface, styles.selectableSurface)}>
          <CardContext.Provider value={{ phrasing: true, stretched: false }}>
            {children}
          </CardContext.Provider>
          <span
            className={cx(styles.check, selectionMode === 'single' && styles.checkRound)}
            aria-hidden="true"
          >
            <CheckIcon />
          </span>
        </span>
      </label>
    );
  }

  /* ── stretched: 루트는 컨테이너, 제목이 링크/버튼 ── */
  if (stretched) {
    const Container = (typeof as === 'string' ? as : 'div') as ElementType;
    return (
      <Container
        ref={ref}
        className={cx(surface, styles.stretched, className)}
        style={style}
        {...rest}
      >
        <CardContext.Provider value={{ phrasing: false, stretched: true }}>
          {children}
        </CardContext.Provider>
      </Container>
    );
  }

  /* ── 링크: href 가 있거나 as 가 커스텀 링크 컴포넌트 ── */
  if (href !== undefined || (as !== undefined && typeof as !== 'string')) {
    const Link = (as !== undefined && typeof as !== 'string' ? as : 'a') as ElementType;
    return (
      <Link
        ref={ref}
        // 커스텀 링크는 주소를 다른 prop(to 등)으로 받기도 한다. 없는 href 를 넘겨 덮지 않는다.
        {...(href !== undefined ? { href } : null)}
        className={cx(surface, styles.clickable, disabled && styles.disabled, className)}
        style={style}
        // 링크에는 disabled 가 없다. 포커스는 남기고 활성화만 막는다.
        aria-disabled={disabled || undefined}
        onClick={(event: MouseEvent<HTMLElement>) => {
          if (disabled) {
            event.preventDefault();
            return;
          }
          onClick?.(event);
        }}
        {...rest}
      >
        <CardContext.Provider value={{ phrasing: false, stretched: false }}>
          {children}
        </CardContext.Provider>
      </Link>
    );
  }

  /* ── 버튼 ── */
  if (onClick) {
    return (
      <button
        ref={ref as ForwardedRef<HTMLButtonElement>}
        type="button"
        className={cx(surface, styles.clickable, className)}
        style={style}
        disabled={disabled}
        onClick={onClick}
        {...(rest as HTMLAttributes<HTMLButtonElement>)}
      >
        <CardContext.Provider value={{ phrasing: true, stretched: false }}>
          {children}
        </CardContext.Provider>
      </button>
    );
  }

  /* ── 정적 컨테이너 ── */
  const Container = (as ?? 'div') as ElementType;
  return (
    <Container ref={ref} className={cx(surface, className)} style={style} {...rest}>
      <CardContext.Provider value={{ phrasing: false, stretched: false }}>
        {children}
      </CardContext.Provider>
    </Container>
  );
}

/* ── Card.Header ── */

export interface CardHeaderProps extends Omit<HTMLAttributes<HTMLElement>, 'title' | 'onClick'> {
  /** Title text */
  title: ReactNode;
  /** Secondary text under the title */
  description?: ReactNode;
  /** Trailing slot (badge, menu button…). Interactive content is only allowed in static or stretched cards. */
  action?: ReactNode;
  /** Element for the title. Use a heading level that fits the page outline. Default 'div'. */
  titleAs?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div';
  /** Turns the title into a link. Inside `<Card interactive="stretched">` its hit area covers the card. */
  href?: string;
  /** Link target, when `href` is set */
  target?: string;
  /** Link relationship, when `href` is set */
  rel?: string;
  /** Custom link component for the title (e.g. a router `Link`); receives `href`, `className` and children. */
  linkAs?: ElementType;
  /** Without `href`, turns the title into a `<button type="button">`. */
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  /** Extra content under the title and description */
  children?: ReactNode;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
}

const CardHeader = forwardRef<HTMLElement, CardHeaderProps>(
  (
    {
      title,
      description,
      action,
      titleAs = 'div',
      href,
      target,
      rel,
      linkAs,
      onClick,
      children,
      className,
      style,
      ...rest
    },
    ref,
  ) => {
    const { phrasing, stretched } = useContext(CardContext);
    const Box = (phrasing ? 'span' : 'div') as ElementType;
    const Title = (phrasing ? 'span' : titleAs) as ElementType;

    let titleNode: ReactNode = title;
    // 카드 전체가 이미 링크·버튼·라벨이면 제목을 다시 컨트롤로 만들지 않는다(중첩 금지).
    if (!phrasing) {
      const triggerClass = cx(styles.trigger, stretched && styles.stretchedTrigger);
      if (href !== undefined || linkAs) {
        const Link = (linkAs ?? 'a') as ElementType;
        titleNode = (
          <Link
            {...(href !== undefined ? { href } : null)}
            target={target}
            rel={rel}
            onClick={onClick}
            className={triggerClass}
          >
            {title}
          </Link>
        );
      } else if (onClick) {
        titleNode = (
          <button type="button" onClick={onClick} className={triggerClass}>
            {title}
          </button>
        );
      }
    }

    return (
      <Box ref={ref} className={cx(styles.header, className)} style={style} {...rest}>
        <Box className={styles.headerText}>
          <Title className={styles.title}>{titleNode}</Title>
          {description != null && <Box className={styles.description}>{description}</Box>}
          {children}
        </Box>
        {action != null && <Box className={styles.action}>{action}</Box>}
      </Box>
    );
  },
);
CardHeader.displayName = 'Card.Header';

/* ── Card.Content / Card.Footer ── */

export interface CardContentProps extends HTMLAttributes<HTMLElement> {
  /** Body of the card */
  children?: ReactNode;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
}

const CardContent = forwardRef<HTMLElement, CardContentProps>(({ className, ...rest }, ref) => {
  const { phrasing } = useContext(CardContext);
  const Box = (phrasing ? 'span' : 'div') as ElementType;
  return <Box ref={ref} className={cx(styles.content, className)} {...rest} />;
});
CardContent.displayName = 'Card.Content';

export interface CardFooterProps extends HTMLAttributes<HTMLElement> {
  /** Footer content, laid out in a wrapping row (meta text, actions) */
  children?: ReactNode;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
}

const CardFooter = forwardRef<HTMLElement, CardFooterProps>(({ className, ...rest }, ref) => {
  const { phrasing } = useContext(CardContext);
  const Box = (phrasing ? 'span' : 'div') as ElementType;
  return <Box ref={ref} className={cx(styles.footer, className)} {...rest} />;
});
CardFooter.displayName = 'Card.Footer';

/* ── Card.Media ── */

export interface CardMediaProps extends HTMLAttributes<HTMLElement> {
  /** CSS aspect ratio of the media box, e.g. "16 / 9". The image inside covers the box. */
  aspectRatio?: string;
  /** Image, video or any visual; rendered edge to edge regardless of the card padding */
  children?: ReactNode;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
}

const CardMedia = forwardRef<HTMLElement, CardMediaProps>(
  ({ aspectRatio, className, style, ...rest }, ref) => {
    const { phrasing } = useContext(CardContext);
    const Box = (phrasing ? 'span' : 'div') as ElementType;
    return (
      <Box
        ref={ref}
        className={cx(styles.media, className)}
        style={aspectRatio ? { aspectRatio, ...style } : style}
        {...rest}
      />
    );
  },
);
CardMedia.displayName = 'Card.Media';

/* ── Compound export ── */

interface CardComponent {
  <T extends CardAs = 'div'>(
    props: CardProps<T> & { ref?: ForwardedRef<HTMLElement> },
  ): ReactElement | null;
  displayName?: string;
  Header: typeof CardHeader;
  Content: typeof CardContent;
  Footer: typeof CardFooter;
  Media: typeof CardMedia;
}

export const Card = Object.assign(forwardRef(CardRoot), {
  Header: CardHeader,
  Content: CardContent,
  Footer: CardFooter,
  Media: CardMedia,
}) as unknown as CardComponent;

Card.displayName = 'Card';
