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
  /** Whether the field is required (shows red asterisk) */
  required?: boolean;
  /** Whether the switch is disabled */
  disabled?: boolean;
  /** Whether the field is in error state */
  error?: boolean;
  /** Error message displayed below the switch */
  errorMessage?: string;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Accessible name when there is no visible `label`. */
  'aria-label'?: string;
  /** Id of an element that names the switch. */
  'aria-labelledby'?: string;
  /** Id for the switch button. */
  id?: string;
  /** Form field name. When set, the value is submitted with the form. */
  name?: string;
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
      required = false,
      disabled = false,
      error = false,
      errorMessage,
      className,
      style,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      id: idProp,
      name,
    },
    ref,
  ) => {
    const [internalChecked, setInternalChecked] = useState(defaultChecked);
    const id = useId();
    const errorId = `${id}-error`;

    const isControlled = controlledChecked !== undefined;
    const isChecked = isControlled ? controlledChecked : internalChecked;
    const isError = error || !!errorMessage;

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
      isError ? styles.errorState : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={styles.wrapper} style={style}>
        <div className={styles.container}>
          <button
            ref={ref}
            type="button"
            role="switch"
            aria-checked={isChecked}
            aria-invalid={isError || undefined}
            aria-required={required || undefined}
            aria-label={label ? undefined : ariaLabel}
            aria-labelledby={ariaLabelledBy ?? (label ? `${id}-label` : undefined)}
            aria-describedby={errorMessage ? errorId : undefined}
            id={idProp}
            className={switchClassNames}
            disabled={disabled}
            onClick={handleClick}
          >
            <span className={styles.thumb} />
          </button>
          {/* 버튼은 폼 값이 없다. name 이 있으면 숨은 input 으로 제출에 참여시킨다. */}
          {name && isChecked && <input type="hidden" name={name} value="on" />}
          {label && (
            <span
              id={`${id}-label`}
              className={styles.label}
              onClick={disabled ? undefined : handleClick}
            >
              {label}
              {required && <span className={styles.requiredAsterisk}> *</span>}
            </span>
          )}
        </div>
        {errorMessage && (
          <p className={styles.errorMessage} id={errorId} role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    );
  },
);

Switch.displayName = 'Switch';
