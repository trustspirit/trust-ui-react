import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DatePicker } from './DatePicker';

const meta: Meta<typeof DatePicker> = {
  title: 'Form/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DatePicker>;

export const Default = () => <DatePicker label="Date" />;

/**
 * 표면 자체를 찍기 위한 스토리 — 트리거를 누르지 않고 defaultOpen 으로 바로
 * 팝오버를 연다. 오늘 날짜가 달력 칸에 섞여 들어와 실행일마다 스냅샷이
 * 달라지지 않도록, 고정된 과거 달(2025년 1월)을 defaultValue 로 미리 선택해
 * 뷰를 고정한다.
 */
export const Open = () => (
  <DatePicker label="Date" defaultValue={new Date(2025, 0, 15)} defaultOpen />
);

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

export const MobileModal: Story = {
  args: { mobileVariant: 'modal', label: 'Mobile Modal' },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};

export const MobileNative: Story = {
  args: { mobileVariant: 'native', label: 'Mobile Native' },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
