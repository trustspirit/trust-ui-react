import { useState, type ReactNode } from 'react';
import { RadioGroupContext } from './RadioContext';
import styles from './Radio.module.css';

export interface RadioGroupProps {
  /** Name attribute for all radios in this group */
  name: string;
  /** Controlled selected value */
  value?: string;
  /** Default selected value (uncontrolled) */
  defaultValue?: string;
  /** Callback when the selected value changes */
  onChange?: (value: string) => void;
  /** Color variant */
  variant?: 'primary' | 'secondary';
  /** Layout direction */
  direction?: 'horizontal' | 'vertical';
  /** Whether all radios are disabled */
  disabled?: boolean;
  /** Accessible label for the radio group */
  label?: string;
  /** Whether the group is in error state */
  error?: boolean;
  /** Error message displayed below the group */
  errorMessage?: string;
  /** Radio elements */
  children: ReactNode;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

export function RadioGroup({
  name,
  value: controlledValue,
  defaultValue,
  onChange,
  variant = 'primary',
  direction = 'vertical',
  disabled = false,
  label,
  error = false,
  errorMessage,
  children,
  className,
  style,
}: RadioGroupProps) {
  const [internalValue, setInternalValue] = useState<string | undefined>(defaultValue);

  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;
  const isError = error || !!errorMessage;

  const handleChange = (newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  const groupClassNames = [
    styles.group,
    styles[direction],
    isError ? styles.errorState : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <RadioGroupContext.Provider
      value={{
        name,
        value: currentValue,
        variant,
        disabled,
        error: isError,
        onChange: handleChange,
      }}
    >
      <div className={styles.wrapper} style={style}>
        <div
          role="radiogroup"
          aria-label={label || name}
          aria-invalid={isError || undefined}
          className={groupClassNames}
        >
          {children}
        </div>
        {errorMessage && (
          <p className={styles.errorMessage} role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    </RadioGroupContext.Provider>
  );
}

RadioGroup.displayName = 'RadioGroup';
