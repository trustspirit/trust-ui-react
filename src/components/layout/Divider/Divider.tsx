import {
  forwardRef,
  useId,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from 'react';
import styles from './Divider.module.css';

export interface DividerProps extends HTMLAttributes<HTMLElement> {
  /** Direction of the rule. `'vertical'` separates items laid out in a row. Default: `'horizontal'`. */
  orientation?: 'horizontal' | 'vertical';
  /** Rule weight: `'subtle'` uses `--tui-rule`, `'strong'` uses `--tui-rule-strong`. Default: `'subtle'`. */
  variant?: 'subtle' | 'strong';
  /**
   * Centred label with a rule on both sides, e.g. "or". Becomes the
   * separator's accessible name. Horizontal only — ignored when
   * `orientation="vertical"`.
   */
  label?: ReactNode;
  /**
   * Marks the rule as purely visual: it renders `role="presentation"` and
   * assistive technology skips it. Use when the surrounding structure
   * (headings, lists, landmarks) already conveys the separation. Default: `false`.
   */
  decorative?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
}

/**
 * Hairline between sections or inline items.
 */
export const Divider = forwardRef<HTMLElement, DividerProps>(function Divider(
  {
    orientation = 'horizontal',
    variant = 'subtle',
    label,
    decorative = false,
    className,
    style,
    ...rest
  },
  ref,
) {
  const labelId = useId();
  const vertical = orientation === 'vertical';
  const hasLabel = !vertical && label !== undefined && label !== null && label !== false;

  const shared = {
    'data-orientation': orientation,
    'data-variant': variant,
    style,
  };

  if (hasLabel) {
    // separator 의 자식은 접근성 트리에서 표현용으로 취급되어 글자가 이름이 되지
    // 않는다. aria-labelledby 로 직접 연결해야 스크린 리더가 "또는, 구분선" 으로
    // 읽는다. 소비자가 이름을 직접 줬으면 그쪽을 따른다.
    const named = rest['aria-label'] !== undefined || rest['aria-labelledby'] !== undefined;
    return (
      <div
        ref={ref as Ref<HTMLDivElement>}
        role={decorative ? 'presentation' : 'separator'}
        aria-labelledby={decorative || named ? undefined : labelId}
        className={[styles.labelled, className].filter(Boolean).join(' ')}
        {...shared}
        {...rest}
      >
        <span className={styles.rule} aria-hidden="true" />
        <span id={labelId} className={styles.label}>
          {label}
        </span>
        <span className={styles.rule} aria-hidden="true" />
      </div>
    );
  }

  if (vertical) {
    return (
      <div
        ref={ref as Ref<HTMLDivElement>}
        role={decorative ? 'presentation' : 'separator'}
        aria-orientation={decorative ? undefined : 'vertical'}
        className={[styles.vertical, className].filter(Boolean).join(' ')}
        {...shared}
        {...rest}
      />
    );
  }

  return (
    <hr
      ref={ref as Ref<HTMLHRElement>}
      role={decorative ? 'presentation' : undefined}
      className={[styles.horizontal, className].filter(Boolean).join(' ')}
      {...shared}
      {...rest}
    />
  );
});
Divider.displayName = 'Divider';
