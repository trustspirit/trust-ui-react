import { useState } from 'react';
import { DatePicker } from './DatePicker';

export default {
  title: 'Form/DatePicker',
  component: DatePicker,
};

export const Default = () => <DatePicker label="Date" />;

export const WithLabel = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <DatePicker label="Start Date" placeholder="Select a start date" />
    <DatePicker label="End Date" placeholder="Select an end date" />
  </div>
);

export const Filled = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <DatePicker variant="outlined" label="Outlined" />
    <DatePicker variant="filled" label="Filled" />
  </div>
);

export const WithMinMax = () => {
  const today = new Date();
  const minDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const maxDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return (
    <DatePicker
      label="Date (this month only)"
      minDate={minDate}
      maxDate={maxDate}
    />
  );
};

export const Disabled = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <DatePicker label="Disabled" disabled />
    <DatePicker
      label="Disabled with value"
      disabled
      defaultValue={new Date(2025, 0, 15)}
    />
  </div>
);

export const Error = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <DatePicker label="Date" error />
    <DatePicker label="Date" error errorMessage="Please select a valid date" />
  </div>
);

export const CustomFormat = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <DatePicker label="Korean format" dateFormat="yyyy.MM.dd" locale="ko-KR" />
    <DatePicker
      label="Dash format"
      dateFormat="yyyy-MM-dd"
      locale="en-US"
    />
  </div>
);

export const Sizes = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <DatePicker size="sm" label="Small" />
    <DatePicker size="md" label="Medium" />
    <DatePicker size="lg" label="Large" />
  </div>
);

export const Controlled = () => {
  const [date, setDate] = useState<Date | null>(new Date());
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <DatePicker label="Controlled" value={date} onChange={setDate} />
      <span style={{ fontSize: 12, color: '#666' }}>
        Selected: {date ? date.toISOString().slice(0, 10) : 'none'}
      </span>
    </div>
  );
};
