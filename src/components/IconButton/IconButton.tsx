import { forwardRef, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react';
import { Tooltip, type TooltipProps } from '../Tooltip/Tooltip';
import styles from './IconButton.module.css';

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'aria-pressed' | 'aria-busy'> {
  /** Accessible name of the button. Required: an icon alone names nothing. */
  label: string;
  /** The icon. Mark decorative SVGs `aria-hidden`. `children` is used when omitted. */
  icon?: ReactNode;
  /** Alternative to `icon` */
  children?: ReactNode;
  /** Visual style variant (same set as Button). Default 'ghost'. */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  /** Size of the square box; follows the control height tokens */
  size?: 'sm' | 'md' | 'lg';
  /** Corner shape */
  shape?: 'square' | 'rounded' | 'pill';
  /** Shows a spinner instead of the icon, sets `aria-busy` and disables the button */
  loading?: boolean;
  /** Toggle state. When set (true or false) the button exposes `aria-pressed`. */
  pressed?: boolean;
  /**
   * Shows a tooltip. `true` shows the label; a string shows that text instead and also
   * becomes the button's accessible description.
   */
  tooltip?: boolean | string;
  /** Options passed to the underlying Tooltip (placement, delay, variant, mobile behaviour…) */
  tooltipProps?: Omit<TooltipProps, 'content' | 'children'>;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
}

interface BaseProps extends Omit<IconButtonProps, 'tooltip' | 'tooltipProps'> {
  /** 호출자가 준 aria-describedby. Tooltip 이 덧붙이는 id 와 구분하려고 따로 받는다. */
  describedBy?: string;
  /** 툴팁 글이 이름과 같으면 설명으로 다시 읽히지 않게 Tooltip 의 id 를 버린다. */
  dropTooltipDescription?: boolean;
}

const Base = forwardRef<HTMLButtonElement, BaseProps>(
  (
    {
      label,
      icon,
      children,
      variant = 'ghost',
      size = 'md',
      shape = 'square',
      loading = false,
      pressed,
      disabled = false,
      type = 'button',
      className,
      style,
      describedBy,
      dropTooltipDescription = false,
      'aria-describedby': tooltipDescribedBy,
      ...rest
    },
    ref,
  ) => {
    const classNames = [
      styles.iconButton,
      styles[variant],
      styles[size],
      styles[shape],
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    const description =
      [describedBy, dropTooltipDescription ? undefined : tooltipDescribedBy].filter(Boolean).join(' ') ||
      undefined;

    return (
      <button
        ref={ref}
        type={type}
        className={classNames}
        style={style}
        disabled={disabled || loading}
        aria-label={label}
        aria-pressed={pressed}
        aria-busy={loading || undefined}
        aria-describedby={description}
        {...rest}
      >
        {loading ? (
          <span className={styles.spinner} aria-hidden="true" />
        ) : (
          <span className={styles.icon}>{icon ?? children}</span>
        )}
      </button>
    );
  },
);

Base.displayName = 'IconButtonBase';

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ tooltip, tooltipProps, 'aria-describedby': describedBy, ...rest }, ref) => {
    if (!tooltip) {
      return <Base ref={ref} describedBy={describedBy} {...rest} />;
    }
    const content = typeof tooltip === 'string' ? tooltip : rest.label;
    return (
      // 자식이 <button> 문자열 타입이 아니라서 Tooltip 이 터치 동작을 추론하지 못한다.
      // 버튼은 탭이 곧 실행이므로 길게 누를 때만 보여 준다.
      <Tooltip mobileVariant="longpress" {...tooltipProps} content={content}>
        <Base
          ref={ref}
          describedBy={describedBy}
          dropTooltipDescription={content === rest.label}
          {...rest}
        />
      </Tooltip>
    );
  },
);

IconButton.displayName = 'IconButton';
