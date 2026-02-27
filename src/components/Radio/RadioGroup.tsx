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
  children,
  className,
  style,
}: RadioGroupProps) {
  const [internalValue, setInternalValue] = useState<string | undefined>(defaultValue);

  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;

  const handleChange = (newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  const groupClassNames = [
    styles.group,
    styles[direction],
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
        onChange: handleChange,
      }}
    >
      <div role="radiogroup" className={groupClassNames} style={style}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

RadioGroup.displayName = 'RadioGroup';
