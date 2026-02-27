import { useState } from 'react';
import { DateRangePicker } from './DateRangePicker';
import type { DateRange } from './DateRangePicker';

export default {
  title: 'Form/DateRangePicker',
  component: DateRangePicker,
};

export const Default = () => <DateRangePicker label="Date Range" />;

export const WithPresets = () => {
  const today = new Date();
  const presets = [
    {
      label: 'Last 7 days',
      range: {
        start: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - 6,
        ),
        end: today,
      },
    },
    {
      label: 'Last 30 days',
      range: {
        start: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() - 29,
        ),
        end: today,
      },
    },
    {
      label: 'This month',
      range: {
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: new Date(today.getFullYear(), today.getMonth() + 1, 0),
      },
    },
    {
      label: 'Last month',
      range: {
        start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
        end: new Date(today.getFullYear(), today.getMonth(), 0),
      },
    },
  ];

  return <DateRangePicker label="Period" presets={presets} />;
};

export const WithMinMax = () => {
  const today = new Date();
  return (
    <DateRangePicker
      label="Date range (this year)"
      minDate={new Date(today.getFullYear(), 0, 1)}
      maxDate={new Date(today.getFullYear(), 11, 31)}
    />
  );
};

export const Filled = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <DateRangePicker variant="outlined" label="Outlined" />
    <DateRangePicker variant="filled" label="Filled" />
  </div>
);

export const Disabled = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <DateRangePicker label="Disabled" disabled />
    <DateRangePicker
      label="Disabled with value"
      disabled
      defaultValue={{
        start: new Date(2025, 0, 1),
        end: new Date(2025, 0, 15),
      }}
    />
  </div>
);

export const CustomFormat = () => (
  <DateRangePicker
    label="Custom format"
    dateFormat="yyyy-MM-dd"
    locale="en-US"
  />
);

export const Controlled = () => {
  const [range, setRange] = useState<DateRange>({
    start: null,
    end: null,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <DateRangePicker label="Controlled" value={range} onChange={setRange} />
      <span style={{ fontSize: 12, color: '#666' }}>
        Start: {range.start ? range.start.toISOString().slice(0, 10) : 'none'}{' '}
        / End: {range.end ? range.end.toISOString().slice(0, 10) : 'none'}
      </span>
    </div>
  );
};
