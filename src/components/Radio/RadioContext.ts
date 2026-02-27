import { createContext, useContext } from 'react';

export interface RadioGroupContextValue {
  name: string;
  value?: string;
  variant: 'primary' | 'secondary';
  disabled?: boolean;
  onChange?: (value: string) => void;
}

export const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export function useRadioGroup(): RadioGroupContextValue | null {
  return useContext(RadioGroupContext);
}
