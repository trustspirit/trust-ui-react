import { forwardRef, useState, useId } from 'react';
import styles from './Switch.module.css';

export interface SwitchProps {
  /** Whether the switch is on (controlled) */
  checked?: boolean;
  /** Initial state (uncontrolled) */
  defaultChecked?: boolean;
  /** Callback when the switch is toggled */
  onChange?: (checked: boolean) => void;
  /** Color variant */
  variant?: 'primary' | 'secondary';
  /** Size of the switch */
  size?: 'sm' | 'md' | 'lg';
  /** Text label */
  label?: string;
  /** Whether the switch is disabled */
  disabled?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      checked: controlledChecked,
      defaultChecked = false,
      onChange,
      variant = 'primary',
      size = 'md',
      label,
      disabled = false,
      className,
      style,
    },
    ref,
  ) => {
    const [internalChecked, setInternalChecked] = useState(defaultChecked);
    const id = useId();

    const isControlled = controlledChecked !== undefined;
    const isChecked = isControlled ? controlledChecked : internalChecked;

    const handleClick = () => {
      if (disabled) return;
      const newValue = !isChecked;
      if (!isControlled) {
        setInternalChecked(newValue);
      }
      onChange?.(newValue);
    };

    const switchClassNames = [
      styles.switch,
      styles[size],
      styles[variant],
      isChecked ? styles.checked : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={styles.container} style={style}>
        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={isChecked}
          aria-labelledby={label ? `${id}-label` : undefined}
          className={switchClassNames}
          disabled={disabled}
          onClick={handleClick}
        >
          <span className={styles.thumb} />
        </button>
        {label && (
          <span
            id={`${id}-label`}
            className={styles.label}
            onClick={disabled ? undefined : handleClick}
          >
            {label}
          </span>
        )}
      </div>
    );
  },
);

Switch.displayName = 'Switch';
