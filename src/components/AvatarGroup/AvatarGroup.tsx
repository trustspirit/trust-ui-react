import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  type CSSProperties,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';
import type { AvatarProps } from '../Avatar';
import styles from './AvatarGroup.module.css';

export interface AvatarGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Avatars to stack. Each child should be an `Avatar` (or accept `size`, `className` and `style`). */
  children?: ReactNode;
  /** How many avatars to show before the rest collapse into a "+N" tile. Default 4. */
  max?: number;
  /** Real number of people when it is larger than the number of children passed. */
  total?: number;
  /** Size forwarded to every avatar that does not set its own, and used for the "+N" tile. */
  size?: 'sm' | 'md' | 'lg';
  /** How much neighbours overlap: 'normal' (a quarter of the avatar) or 'tight' (40%). */
  spacing?: 'tight' | 'normal';
  /** Accessible name of the group. Defaults to the head count, e.g. "5 people". */
  label?: string;
  /** Accessible name of the "+N" tile. Defaults to `"${hidden} more"`. */
  overflowLabel?: (hidden: number) => string;
  /**
   * Replaces the "+N" tile, e.g. to wrap it in a Popover that lists everyone.
   * Receives the hidden count and the default tile element.
   */
  renderOverflow?: (hidden: number, tile: ReactElement) => ReactNode;
  /**
   * Colour of the ring that separates overlapping avatars. Set it to the surface the group
   * sits on, e.g. `"var(--tui-sheet)"` inside a card. Defaults to `--tui-paper`.
   */
  ringColor?: string;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
}

const defaultLabel = (count: number) => (count === 1 ? '1 person' : `${count} people`);
const defaultOverflowLabel = (hidden: number) => `${hidden} more`;

type AvatarLikeProps = Pick<AvatarProps, 'size' | 'shape' | 'className' | 'style'>;

export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  (
    {
      children,
      max = 4,
      total,
      size = 'md',
      spacing = 'normal',
      label,
      overflowLabel = defaultOverflowLabel,
      renderOverflow,
      ringColor,
      className,
      style,
      ...rest
    },
    ref,
  ) => {
    const items = Children.toArray(children).filter(isValidElement) as ReactElement<AvatarLikeProps>[];
    const limit = Math.max(0, Math.floor(max));
    const visible = items.slice(0, limit);
    // total 은 "더 있다"는 뜻으로만 쓴다 — 넘겨받은 자식보다 작은 값은 틀린 값이다.
    const count = Math.max(items.length, total ?? 0);
    const hidden = count - visible.length;
    // 타일 모양은 앞선 아바타를 따른다 — 사각 아바타 줄 끝에 원이 붙지 않게.
    const tileShape = items[0]?.props.shape ?? 'circle';

    const classNames = [styles.group, styles[size], styles[spacing], className ?? '']
      .filter(Boolean)
      .join(' ');

    // 쌓임 순서를 DOM 순서와 반대로 준다. 글 방향과 무관하게 첫 아바타가 맨 위다.
    const layers = visible.length + 1;

    const tile = (
      <span
        className={[styles.tile, styles.ring, styles[tileShape]].join(' ')}
        role="img"
        aria-label={overflowLabel(hidden)}
      >
        <span aria-hidden="true">+{hidden}</span>
      </span>
    );

    return (
      <div
        ref={ref}
        role="group"
        aria-label={label ?? defaultLabel(count)}
        className={classNames}
        style={ringColor ? ({ '--tui-avatar-group-ring': ringColor, ...style } as CSSProperties) : style}
        {...rest}
      >
        {visible.map((child, index) =>
          cloneElement(child, {
            size: child.props.size ?? size,
            className: [styles.item, styles.ring, child.props.className ?? ''].filter(Boolean).join(' '),
            style: { zIndex: layers - index, ...child.props.style },
          }),
        )}
        {hidden > 0 && (
          <span className={styles.item} style={{ zIndex: 1 }}>
            {renderOverflow ? renderOverflow(hidden, tile) : tile}
          </span>
        )}
      </div>
    );
  },
);

AvatarGroup.displayName = 'AvatarGroup';
