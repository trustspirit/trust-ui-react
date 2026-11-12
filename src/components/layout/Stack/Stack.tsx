import {
  forwardRef,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type JSX,
  type ReactNode,
} from 'react';
import { gapValue, type StackGap } from './gap';
import styles from './Stack.module.css';

export type { StackGap } from './gap';

export interface StackProps extends HTMLAttributes<HTMLElement> {
  /** Main axis. `'vertical'` stacks children top to bottom, `'horizontal'` lays them out in a row. Default: `'vertical'`. */
  direction?: 'vertical' | 'horizontal';
  /** Space between children on the spacing scale: `0` = none, `1`–`6` = `--tui-gap-1`…`--tui-gap-6`. Default: `3`. */
  gap?: StackGap;
  /** Cross-axis alignment of children (`align-items`). Unset keeps the flexbox default (stretch). */
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  /** Main-axis distribution of children (`justify-content`). Unset keeps the flexbox default (start). */
  justify?: 'start' | 'center' | 'end' | 'between';
  /** Let children wrap onto further lines instead of overflowing. Default: `false`. */
  wrap?: boolean;
  /** Element to render, e.g. `'ul'`, `'section'`, `'nav'`. Default: `'div'`. */
  as?: keyof JSX.IntrinsicElements;
  /** Stack content */
  children?: ReactNode;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
}

/**
 * Flexbox stack with a gap from the spacing scale.
 *
 * 배치 값은 인라인 flex 스타일이 아니라 data 속성과 `--tui-stack-gap` 변수로만
 * 내보낸다. 인라인 스타일은 어떤 클래스로도 덮을 수 없어서, 소비자가 특정
 * 브레이크포인트에서 방향이나 간격을 바꾸려면 `!important` 가 필요해진다.
 */
export const Stack = forwardRef<HTMLElement, StackProps>(function Stack(
  {
    direction = 'vertical',
    gap = 3,
    align,
    justify,
    wrap = false,
    as = 'div',
    className,
    style,
    children,
    ...rest
  },
  ref,
) {
  // keyof JSX.IntrinsicElements 는 SVG 태그까지 포함해 ref·속성 타입이 하나로
  // 좁혀지지 않는다. 루트는 항상 요소 하나이므로 ElementType 으로 넓혀 쓴다.
  const Tag = as as ElementType;

  return (
    <Tag
      ref={ref}
      className={[styles.stack, className].filter(Boolean).join(' ')}
      data-direction={direction}
      data-align={align}
      data-justify={justify}
      data-wrap={wrap ? '' : undefined}
      style={{ '--tui-stack-gap': gapValue(gap, 3), ...style } as CSSProperties}
      {...rest}
    >
      {children}
    </Tag>
  );
});
Stack.displayName = 'Stack';

export type HStackProps = Omit<StackProps, 'direction'>;
export type VStackProps = Omit<StackProps, 'direction'>;

/** `Stack` fixed to `direction="horizontal"`. */
export const HStack = forwardRef<HTMLElement, HStackProps>(function HStack(props, ref) {
  return <Stack ref={ref} {...props} direction="horizontal" />;
});
HStack.displayName = 'HStack';

/** `Stack` fixed to `direction="vertical"`. */
export const VStack = forwardRef<HTMLElement, VStackProps>(function VStack(props, ref) {
  return <Stack ref={ref} {...props} direction="vertical" />;
});
VStack.displayName = 'VStack';
