import { useEffect, useRef, useState } from 'react';
import { Combobox, type ComboboxOption } from './Combobox';

export default {
  title: 'Form/Combobox',
  component: Combobox,
  tags: ['autodocs'],
};

const banks: ComboboxOption[] = [
  { value: 'kb', label: '국민은행' },
  { value: 'sh', label: '신한은행' },
  { value: 'wr', label: '우리은행' },
  { value: 'hn', label: '하나은행' },
  { value: 'nh', label: '농협은행' },
  { value: 'ibk', label: '기업은행' },
  { value: 'kakao', label: '카카오뱅크' },
  { value: 'toss', label: '토스뱅크' },
  { value: 'sc', label: 'SC제일은행', disabled: true },
];

const stocks: ComboboxOption[] = [
  { value: '005930', label: '삼성전자', description: '005930 · KOSPI' },
  { value: '000660', label: 'SK하이닉스', description: '000660 · KOSPI' },
  { value: '035420', label: 'NAVER', description: '035420 · KOSPI' },
  { value: '035720', label: '카카오', description: '035720 · KOSPI' },
  { value: '207940', label: '삼성바이오로직스', description: '207940 · KOSPI' },
  { value: '006400', label: '삼성SDI', description: '006400 · KOSPI' },
  { value: '247540', label: '에코프로비엠', description: '247540 · KOSDAQ' },
];

const column: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 320 };

export const Default = () => (
  <div style={{ maxWidth: 320 }}>
    <Combobox fullWidth label="Bank" placeholder="Type to search" options={banks} />
  </div>
);

export const Variants = () => (
  <div style={column}>
    <Combobox variant="outlined" label="Outlined" options={banks} defaultValue="kb" />
    <Combobox variant="filled" label="Filled" options={banks} defaultValue="sh" />
  </div>
);

export const Sizes = () => (
  <div style={column}>
    <Combobox size="sm" label="Small" options={banks} />
    <Combobox size="md" label="Medium" options={banks} />
    <Combobox size="lg" label="Large" options={banks} />
  </div>
);

export const Controlled = () => {
  const [value, setValue] = useState<string | null>('hn');
  return (
    <div style={column}>
      <Combobox label="Bank" options={banks} value={value} onChange={setValue} />
      <span style={{ fontSize: 12, color: 'var(--tui-ink-2)' }}>Value: {String(value)}</span>
    </div>
  );
};

export const WithDescriptions = () => (
  <div style={{ maxWidth: 320 }}>
    <Combobox fullWidth label="Stock" placeholder="Name or code" options={stocks} />
  </div>
);

/** The caller searches on the server: `filter={null}` shows the returned options as they are. */
export const AsyncSearch = () => {
  const [options, setOptions] = useState<ComboboxOption[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const search = (query: string) => {
    clearTimeout(timer.current);
    setLoading(true);
    timer.current = setTimeout(() => {
      const q = query.toLowerCase();
      setOptions(
        stocks.filter(
          (stock) => stock.label.toLowerCase().includes(q) || stock.value.includes(q),
        ),
      );
      setLoading(false);
    }, 600);
  };

  return (
    <div style={{ maxWidth: 320 }}>
      <Combobox
        fullWidth
        label="Stock"
        placeholder="At least 2 characters"
        helperText="Results come from a simulated request"
        options={options}
        loading={loading}
        onSearch={search}
        filter={null}
        minQueryLength={2}
      />
    </div>
  );
};

export const WithError = () => (
  <Combobox label="Bank" options={banks} required errorMessage="Choose a bank" />
);

export const NotClearable = () => (
  <Combobox label="Bank" options={banks} defaultValue="kb" clearable={false} />
);

export const Disabled = () => (
  <div style={column}>
    <Combobox label="Disabled outlined" options={banks} defaultValue="kb" disabled />
    <Combobox variant="filled" label="Disabled filled" options={banks} defaultValue="kb" disabled />
  </div>
);

export const FullWidth = () => (
  <div style={{ maxWidth: 600 }}>
    <Combobox fullWidth label="Full width" options={banks} />
  </div>
);
