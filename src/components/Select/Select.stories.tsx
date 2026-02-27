import { useState } from 'react';
import { Select } from './Select';

export default {
  title: 'Form/Select',
  component: Select,
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
