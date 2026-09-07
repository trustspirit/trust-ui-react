import { useState } from 'react';
import { Select } from './Select';

export default {
  title: 'Form/Select',
  component: Select,
  tags: ['autodocs'],
};

const fruitOptions = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'date', label: 'Date' },
  { value: 'elderberry', label: 'Elderberry' },
  { value: 'fig', label: 'Fig' },
  { value: 'grape', label: 'Grape' },
];

const countryOptions = [
  { value: 'kr', label: 'South Korea' },
  { value: 'us', label: 'United States' },
  { value: 'jp', label: 'Japan' },
  { value: 'cn', label: 'China' },
  { value: 'gb', label: 'United Kingdom' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'it', label: 'Italy', disabled: true },
  { value: 'es', label: 'Spain' },
  { value: 'au', label: 'Australia' },
];

export const Default = () => {
  const [value, setValue] = useState('');
  return (
    <Select
      options={fruitOptions}
      value={value}
      onChange={(v) => setValue(v as string)}
      placeholder="Select a fruit"
    />
  );
};

/**
 * 표면 자체를 찍기 위한 스토리 — 트리거를 누르지 않고 defaultOpen 으로 바로
 * 드롭다운을 연다. Select 는 내부 useState 로만 열림 상태를 갖고 제어 prop 이
 * 없어서, click 에 의존하는 play 함수 없이 표면을 안정적으로 캡처하려면 이
 * 초기값이 필요하다.
 */
export const Open = () => (
  <Select options={fruitOptions} placeholder="Select a fruit" defaultOpen />
);

export const WithPlaceholder = () => (
  <Select options={fruitOptions} placeholder="Choose your favorite fruit..." />
);

export const Searchable = () => {
  const [value, setValue] = useState('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Select
        options={countryOptions}
        value={value}
        onChange={(v) => setValue(v as string)}
        searchable
        placeholder="Search countries..."
      />
      <span style={{ fontSize: 12, color: '#666' }}>Selected: {value || 'none'}</span>
    </div>
  );
};

export const MultiSelect = () => {
  const [values, setValues] = useState<string[]>([]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Select
        options={fruitOptions}
        value={values}
        onChange={(v) => setValues(v as string[])}
        multiple
        placeholder="Select fruits..."
      />
      <span style={{ fontSize: 12, color: '#666' }}>
        Selected: {values.join(', ') || 'none'}
      </span>
    </div>
  );
};

export const MultiSelectSearchable = () => {
  const [values, setValues] = useState<string[]>(['kr', 'us']);
  return (
    <Select
      options={countryOptions}
      value={values}
      onChange={(v) => setValues(v as string[])}
      multiple
      searchable
      placeholder="Search and select countries..."
    />
  );
};

export const Variants = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <Select variant="outlined" options={fruitOptions} placeholder="Outlined" />
    <Select variant="filled" options={fruitOptions} placeholder="Filled" />
  </div>
);

export const Sizes = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <Select size="sm" options={fruitOptions} placeholder="Small" />
    <Select size="md" options={fruitOptions} placeholder="Medium" />
    <Select size="lg" options={fruitOptions} placeholder="Large" />
  </div>
);

export const Disabled = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <Select options={fruitOptions} placeholder="Disabled select" disabled />
    <Select
      options={fruitOptions}
      value="apple"
      onChange={() => {}}
      disabled
    />
  </div>
);

export const Error = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <Select
      options={fruitOptions}
      placeholder="Required field"
      error
      errorMessage="Please select an option"
    />
    <Select
      options={fruitOptions}
      placeholder="Required field"
      variant="filled"
      error
      errorMessage="This field is required"
    />
  </div>
);

export const FullWidth = () => (
  <div style={{ maxWidth: 600 }}>
    <Select options={countryOptions} placeholder="Full width select" fullWidth />
  </div>
);

export const WithDisabledOptions = () => (
  <Select
    options={countryOptions}
    placeholder="Some options are disabled"
    searchable
  />
);
