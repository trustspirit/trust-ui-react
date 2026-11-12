import { useState } from 'react';
import { NumberInput } from './NumberInput';

export default {
  title: 'Form/NumberInput',
  component: NumberInput,
  tags: ['autodocs'],
};

const column: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 280 };

export const Default = () => <NumberInput label="Quantity" defaultValue={1} min={0} max={99} />;

export const Variants = () => (
  <div style={column}>
    <NumberInput variant="outlined" label="Outlined" defaultValue={10} />
    <NumberInput variant="filled" label="Filled" defaultValue={10} />
  </div>
);

export const Sizes = () => (
  <div style={column}>
    <NumberInput size="sm" label="Small" defaultValue={1} />
    <NumberInput size="md" label="Medium" defaultValue={1} />
    <NumberInput size="lg" label="Large" defaultValue={1} />
  </div>
);

export const DecimalStep = () => (
  <NumberInput label="Interest rate" defaultValue={3.5} step={0.1} min={0} max={20} units="%" />
);

export const Formatted = () => {
  const [value, setValue] = useState<number | null>(1250000);
  return (
    <div style={column}>
      <NumberInput
        label="Transfer amount"
        value={value}
        onChange={setValue}
        step={10000}
        min={0}
        locale="ko-KR"
        formatOptions={{ style: 'currency', currency: 'KRW' }}
        helperText="Formatted when not focused"
      />
      <span style={{ fontSize: 12, color: 'var(--tui-ink-2)' }}>Value: {String(value)}</span>
    </div>
  );
};

export const WithUnits = () => <NumberInput label="Weight" defaultValue={62.5} step={0.5} units="kg" />;

export const WithoutSteppers = () => (
  <NumberInput label="Year of birth" placeholder="1990" showSteppers={false} min={1900} max={2100} />
);

export const WithError = () => (
  <NumberInput label="Quantity" defaultValue={120} max={99} errorMessage="At most 99 per order" />
);

export const Required = () => <NumberInput label="Guests" required helperText="Including yourself" />;

export const ReadOnly = () => <NumberInput label="Shares held" defaultValue={42} readOnly />;

export const Disabled = () => (
  <div style={column}>
    <NumberInput label="Disabled outlined" defaultValue={5} disabled />
    <NumberInput variant="filled" label="Disabled filled" defaultValue={5} disabled />
  </div>
);

export const FullWidth = () => (
  <div style={{ maxWidth: 600 }}>
    <NumberInput fullWidth label="Full width" defaultValue={0} />
  </div>
);
