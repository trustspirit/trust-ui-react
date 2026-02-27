import { forwardRef, type InputHTMLAttributes } from 'react';
import styles from './Radio.module.css';
import { useRadioGroup } from './RadioContext';

export interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Value of this radio option */
  value: string;
  /** Text label */
  label?: string;
  /** Whether the radio is disabled */
  disabled?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ value, label, disabled = false, className, style, ...rest }, ref) => {
    const group = useRadioGroup();

    const isDisabled = disabled || group?.disabled || false;
    const variant = group?.variant ?? 'primary';
    const isChecked = group?.value !== undefined ? group.value === value : undefined;

    const handleChange = () => {
      if (!isDisabled) {
        group?.onChange?.(value);
      }
    };

    const containerClassNames = [
      styles.container,
      isDisabled ? styles.disabled : '',
      className ?? '',
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
          {...rest}
        />
        <span className={`${styles.indicator} ${styles[variant]}`}>
          <span className={styles.dot} />
        </span>
        {label && <span className={styles.label}>{label}</span>}
      </label>
    );
  },
);

Radio.displayName = 'Radio';
