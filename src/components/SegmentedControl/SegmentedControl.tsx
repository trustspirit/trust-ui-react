import { forwardRef, type CSSProperties, type ReactNode } from 'react';
import styles from './SegmentedControl.module.css';

export interface SegmentedControlOption<T extends string = string> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string = string> {
  /** Currently selected value. Controlled. */
  value: T;
  /** Called when the user selects a different segment. */
  onChange: (value: T) => void;
  /** Segment definitions (2 to 4 recommended). */
  options: SegmentedControlOption<T>[];
  /** Visual size. Default 'sm'. */
  size?: 'sm' | 'md';
  /** Optional className for the track element. */
  className?: string;
  style?: CSSProperties;
  /** Aria label for the segmented group. */
  'aria-label'?: string;
}

/**
 * iOS-style pill segmented control. Use for 2-4 mutually exclusive options
 * where a horizontal tab strip is overkill.
 *
 * Slide indicator animates between active segments using CSS custom properties
 * `--tui-seg-count` and `--tui-seg-active`. The component supports keyboard
 * focus via :focus-visible on each segment button.
 */
function SegmentedControlInner<T extends string = string>(
  props: SegmentedControlProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const { value, onChange, options, size = 'sm', className, style, ...rest } = props;
  const activeIdx = Math.max(0, options.findIndex((opt) => opt.value === value));
  const count = options.length;

  const trackClassName = [styles.track, styles[size], className].filter(Boolean).join(' ');

  const trackStyle = {
    '--tui-seg-count': String(count),
    '--tui-seg-active': String(activeIdx),
    ...style,
  } as CSSProperties;

  return (
    <div ref={ref} className={trackClassName} style={trackStyle} role="tablist" {...rest}>
      <span className={styles.indicator} aria-hidden="true" />
      {options.map((option) => {
        const isActive = option.value === value;
        const segClassName = [styles.segment, isActive && styles.active]
          .filter(Boolean)
          .join(' ');
        return (
          <button
            key={String(option.value)}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={option.disabled}
            className={segClassName}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export const SegmentedControl = forwardRef(SegmentedControlInner) as <T extends string = string>(
  props: SegmentedControlProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> },
) => ReturnType<typeof SegmentedControlInner>;
