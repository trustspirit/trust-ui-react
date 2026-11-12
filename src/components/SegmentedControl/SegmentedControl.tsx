import { forwardRef, useRef, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { isRtl } from '../../utils/direction';
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
  const selectedIdx = options.findIndex((opt) => opt.value === value);
  const count = options.length;
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);

  const trackClassName = [styles.track, styles[size], className].filter(Boolean).join(' ');

  const trackStyle = {
    '--tui-seg-count': String(count),
    '--tui-seg-active': String(Math.max(0, selectedIdx)),
    ...style,
  } as CSSProperties;

  // Tab 으로 닿는 세그먼트는 하나다: 선택된 것, 없으면 첫 번째 활성 세그먼트.
  const firstEnabled = options.findIndex((opt) => !opt.disabled);
  const tabStop = selectedIdx >= 0 && !options[selectedIdx].disabled ? selectedIdx : firstEnabled;

  /** from 에서 step 방향으로 가장 가까운 활성 세그먼트. 끝에서는 반대쪽으로 넘어간다. */
  const nextEnabled = (from: number, step: 1 | -1) => {
    for (let i = 1; i <= count; i++) {
      const idx = (from + step * i + count * i) % count;
      if (!options[idx].disabled) return idx;
    }
    return from;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    // 좌우 화살표는 화면에서의 방향이다. RTL 에서는 왼쪽이 "다음"이다.
    const horizontal: 1 | -1 = isRtl(e.currentTarget) ? -1 : 1;
    let target: number;
    switch (e.key) {
      case 'ArrowRight':
        target = nextEnabled(index, horizontal);
        break;
      case 'ArrowLeft':
        target = nextEnabled(index, horizontal === 1 ? -1 : 1);
        break;
      case 'ArrowDown':
        target = nextEnabled(index, 1);
        break;
      case 'ArrowUp':
        target = nextEnabled(index, -1);
        break;
      case 'Home':
        target = nextEnabled(-1, 1);
        break;
      case 'End':
        target = nextEnabled(count, -1);
        break;
      default:
        return;
    }
    e.preventDefault();
    buttonsRef.current[target]?.focus();
    if (options[target].value !== value) onChange(options[target].value);
  };

  return (
    // 탭 패널을 가진 탭이 아니라 "여럿 중 하나"를 고르는 컨트롤이므로 라디오 그룹이다.
    <div ref={ref} className={trackClassName} style={trackStyle} role="radiogroup" {...rest}>
      {selectedIdx >= 0 && <span className={styles.indicator} aria-hidden="true" />}
      {options.map((option, index) => {
        const isActive = option.value === value;
        const segClassName = [styles.segment, isActive && styles.active]
          .filter(Boolean)
          .join(' ');
        return (
          <button
            key={String(option.value)}
            ref={(node) => {
              buttonsRef.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={isActive}
            tabIndex={index === tabStop ? 0 : -1}
            disabled={option.disabled}
            className={segClassName}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
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
