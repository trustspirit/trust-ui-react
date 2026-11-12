import { forwardRef, type ChangeEvent, type InputHTMLAttributes } from 'react';
import styles from './Radio.module.css';
import { useRadioGroup } from './RadioContext';

export interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Value of this radio option */
  value: string;
  /** Text label */
  label?: string;
  /** Whether the field is required (shows red asterisk) */
  required?: boolean;
  /** Whether the radio is disabled */
  disabled?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ value, label, required = false, disabled = false, className, style, onChange, ...rest }, ref) => {
    const group = useRadioGroup();

    const isDisabled = disabled || group?.disabled || false;
    const variant = group?.variant ?? 'primary';
    // 그룹 안에서는 항상 제어 상태다. 값이 아직 없을 때 undefined 를 넘기면
    // 첫 선택에서 비제어 → 제어로 바뀌어 React 가 경고하고 DOM 체크가 남는다.
    const isChecked = group ? group.value === value : undefined;

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      if (isDisabled) return;
      group?.onChange?.(value);
      onChange?.(e);
    };

    const containerClassNames = [
      styles.container,
      isDisabled ? styles.disabled : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    const indicatorClassNames = [
      styles.indicator,
      styles[variant],
      group?.error ? styles.errorState : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <label className={containerClassNames} style={style}>
        <input
          ref={ref}
          type="radio"
          className={styles.hiddenInput}
          name={group?.name}
          value={value}
          checked={isChecked}
          onChange={handleChange}
          disabled={isDisabled}
          required={required}
          aria-invalid={group?.error || undefined}
          {...rest}
        />
        <span className={indicatorClassNames}>
          <span className={styles.dot} />
        </span>
        {label && (
          <span className={styles.label}>
            {label}
            {required && <span className={styles.requiredAsterisk}> *</span>}
          </span>
        )}
      </label>
    );
  },
);

Radio.displayName = 'Radio';
