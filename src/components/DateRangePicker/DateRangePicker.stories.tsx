import { useState } from 'react';
import { DateRangePicker } from './DateRangePicker';
import type { DateRange } from './DateRangePicker';
import type { StoryObj } from '@storybook/react';

export default {
  title: 'Form/DateRangePicker',
  component: DateRangePicker,
  tags: ['autodocs'],
};

type Story = StoryObj<typeof DateRangePicker>;

export const Default = () => <DateRangePicker label="Date Range" />;

/**
 * 표면 자체를 찍기 위한 스토리 — 트리거를 누르지 않고 defaultOpen 으로 바로
 * 팝오버를 연다. 오늘 날짜가 달력 칸에 섞여 들어와 실행일마다 스냅샷이
 * 달라지지 않도록, 고정된 과거 달(2025년 1월)을 시작일로 미리 선택해 뷰를
 * 고정한다.
 */
export const Open = () => (
  <DateRangePicker
    label="Date Range"
    defaultValue={{ start: new Date(2025, 0, 10), end: new Date(2025, 0, 20) }}
    defaultOpen
  />
);

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

export const MobileModal: Story = {
  args: { mobileVariant: 'modal', label: 'Date Range (Modal)' },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};

export const MobileNative: Story = {
  args: { mobileVariant: 'native', label: 'Date Range (Native)' },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
