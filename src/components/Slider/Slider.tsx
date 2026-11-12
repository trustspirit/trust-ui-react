import { forwardRef, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { isRtl } from '../../utils/direction';
import styles from './Slider.module.css';

export interface SliderProps {
  /** Controlled value */
  value?: number;
  /** Default value (uncontrolled) */
  defaultValue?: number;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Change callback */
  onChange?: (value: number) => void;
  /** Color variant */
  variant?: 'primary' | 'secondary';
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  /** Show the current value label */
  showValue?: boolean;
  /** Whether the slider is disabled */
  disabled?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Accessible name. A slider always needs one of `aria-label` / `aria-labelledby`. */
  'aria-label'?: string;
  /** Id of an element that names the slider. */
  'aria-labelledby'?: string;
  /** Human-readable value, e.g. "30%" or "3 of 5". */
  'aria-valuetext'?: string;
  /** Id for the range input. */
  id?: string;
  /** Form field name. */
  name?: string;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      value: controlledValue,
      defaultValue,
      min = 0,
      max = 100,
      step = 1,
      onChange,
      variant = 'primary',
      size = 'md',
      showValue = false,
      disabled = false,
      className,
      style,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      'aria-valuetext': ariaValueText,
      id,
      name,
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = useState(defaultValue ?? min);

    // range input 은 RTL 에서 최솟값이 오른쪽에 온다. 채움도 그쪽에서 시작해야 한다.
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [rtl, setRtl] = useState(false);
    useEffect(() => {
      setRtl(isRtl(inputRef.current));
    });
    const setRefs = useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
      },
      [ref],
    );

    const isControlled = controlledValue !== undefined;
    const currentValue = isControlled ? controlledValue : internalValue;

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = Number(e.target.value);
        if (!isControlled) {
          setInternalValue(newValue);
        }
        onChange?.(newValue);
      },
      [isControlled, onChange],
    );

    // Calculate the fill percentage for the CSS gradient trick (WebKit)
    const fillPercent = useMemo(() => {
      if (max === min) return 0;
      return ((currentValue - min) / (max - min)) * 100;
    }, [currentValue, min, max]);

    // WebKit 은 range input 의 채워진/빈 트랙을 별도 의사 요소로 못 그리므로
    // 채움 비율을 그라데이션으로 표현한다 — 장식이 아니라 트랙을 채우는 기법이다.
    const trackBackground = useMemo(() => {
      const variantColor = variant === 'primary' ? 'var(--tui-accent)' : 'var(--tui-ink-2)';
      return `linear-gradient(${rtl ? 'to left' : 'to right'}, ${variantColor} 0%, ${variantColor} ${fillPercent}%, var(--tui-rule) ${fillPercent}%, var(--tui-rule) 100%)`;
    }, [variant, fillPercent, rtl]);

    const containerClassNames = [
      styles.container,
      styles[size],
      disabled ? styles.disabled : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    const sliderClassNames = [styles.slider, styles[variant]].filter(Boolean).join(' ');

    return (
      <div className={containerClassNames} style={style}>
        <div className={styles.sliderWrapper}>
          <input
            ref={setRefs}
            type="range"
            className={sliderClassNames}
            min={min}
            max={max}
            step={step}
            value={currentValue}
            disabled={disabled}
            onChange={handleChange}
            id={id}
            name={name}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            aria-valuetext={ariaValueText}
            aria-valuenow={currentValue}
            aria-valuemin={min}
            aria-valuemax={max}
            // 채움은 트랙 의사 요소가 그린다(Slider.module.css). 값만 넘긴다.
            style={{ '--tui-slider-track': trackBackground } as React.CSSProperties}
          />
          {showValue && (
            <span className={styles.valueLabel}>{currentValue}</span>
          )}
        </div>
      </div>
    );
  },
);

Slider.displayName = 'Slider';
