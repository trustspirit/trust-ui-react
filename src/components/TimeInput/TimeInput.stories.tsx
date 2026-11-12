import { useState } from 'react';
import { TimeInput } from './TimeInput';

export default {
  title: 'Form/TimeInput',
  component: TimeInput,
  tags: ['autodocs'],
};

const column: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 280 };

export const Default = () => <TimeInput label="Start time" hourCycle={24} />;

export const Variants = () => (
  <div style={column}>
    <TimeInput variant="outlined" label="Outlined" hourCycle={24} defaultValue="09:30" />
    <TimeInput variant="filled" label="Filled" hourCycle={24} defaultValue="09:30" />
  </div>
);

export const Sizes = () => (
  <div style={column}>
    <TimeInput size="sm" label="Small" hourCycle={24} defaultValue="09:30" />
    <TimeInput size="md" label="Medium" hourCycle={24} defaultValue="09:30" />
    <TimeInput size="lg" label="Large" hourCycle={24} defaultValue="09:30" />
  </div>
);

export const TwelveHour = () => (
  <TimeInput label="Reminder" hourCycle={12} locale="en-US" defaultValue="15:30" />
);

export const KoreanLocale = () => <TimeInput label="알림 시각" locale="ko-KR" defaultValue="15:30" />;

export const Controlled = () => {
  const [value, setValue] = useState<string | null>('09:00');
  return (
    <div style={column}>
      <TimeInput label="Start time" hourCycle={24} value={value} onChange={setValue} />
      <span style={{ fontSize: 12, color: 'var(--tui-ink-2)' }}>Value: {String(value)}</span>
    </div>
  );
};

export const MinMax = () => (
  <TimeInput
    label="Transfer time"
    hourCycle={24}
    defaultValue="10:00"
    min="09:00"
    max="15:30"
    helperText="Between 09:00 and 15:30"
  />
);

export const Step = () => (
  <TimeInput label="Meeting" hourCycle={24} defaultValue="10:00" step={15} helperText="Arrow keys move 15 minutes" />
);

export const WithError = () => (
  <TimeInput label="Start time" hourCycle={24} required errorMessage="Enter a start time" />
);

export const ReadOnly = () => <TimeInput label="Market opens" hourCycle={24} defaultValue="09:00" readOnly />;

export const Disabled = () => (
  <div style={column}>
    <TimeInput label="Disabled outlined" hourCycle={24} defaultValue="09:30" disabled />
    <TimeInput variant="filled" label="Disabled filled" hourCycle={24} defaultValue="09:30" disabled />
  </div>
);

export const FullWidth = () => (
  <div style={{ maxWidth: 600 }}>
    <TimeInput fullWidth label="Full width" hourCycle={24} />
  </div>
);
