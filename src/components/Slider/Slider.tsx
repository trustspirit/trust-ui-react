import { forwardRef, useState, useCallback, useMemo } from 'react';
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
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = useState(defaultValue ?? min);

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
      return `linear-gradient(to right, ${variantColor} 0%, ${variantColor} ${fillPercent}%, var(--tui-rule) ${fillPercent}%, var(--tui-rule) 100%)`;
    }, [variant, fillPercent]);

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
            ref={ref}
            type="range"
            className={sliderClassNames}
            min={min}
            max={max}
            step={step}
            value={currentValue}
            disabled={disabled}
            onChange={handleChange}
            aria-valuenow={currentValue}
            aria-valuemin={min}
            aria-valuemax={max}
            style={
              {
                background: trackBackground,
                borderRadius: 'var(--tui-radius-full)',
              } as React.CSSProperties
            }
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
