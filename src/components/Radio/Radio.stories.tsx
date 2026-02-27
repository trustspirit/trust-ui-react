import { useState } from 'react';
import { Radio } from './Radio';
import { RadioGroup } from './RadioGroup';

export default {
  title: 'Form/Radio',
  component: Radio,
};

export const Default = () => {
  const [value, setValue] = useState('');
  return (
    <RadioGroup name="default" value={value} onChange={setValue}>
      <Radio value="option1" label="Option 1" />
      <Radio value="option2" label="Option 2" />
      <Radio value="option3" label="Option 3" />
    </RadioGroup>
  );
};

export const Controlled = () => {
  const [value, setValue] = useState('react');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <RadioGroup name="framework" value={value} onChange={setValue}>
        <Radio value="react" label="React" />
        <Radio value="vue" label="Vue" />
        <Radio value="angular" label="Angular" />
        <Radio value="svelte" label="Svelte" />
      </RadioGroup>
      <p style={{ fontSize: 14, color: '#666' }}>Selected: {value}</p>
    </div>
  );
};

export const Horizontal = () => {
  const [value, setValue] = useState('sm');
  return (
    <RadioGroup name="size" value={value} onChange={setValue} direction="horizontal">
      <Radio value="sm" label="Small" />
      <Radio value="md" label="Medium" />
      <Radio value="lg" label="Large" />
    </RadioGroup>
  );
};

export const Disabled = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
    <RadioGroup name="disabled-all" defaultValue="a" disabled>
      <Radio value="a" label="All disabled - Selected" />
      <Radio value="b" label="All disabled - Option B" />
    </RadioGroup>
    <RadioGroup name="disabled-single" defaultValue="a">
      <Radio value="a" label="Enabled option" />
      <Radio value="b" label="Disabled option" disabled />
      <Radio value="c" label="Another enabled" />
    </RadioGroup>
  </div>
);

export const Variants = () => {
  const [primary, setPrimary] = useState('a');
  const [secondary, setSecondary] = useState('a');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <p style={{ marginBottom: 8, fontWeight: 500 }}>Primary</p>
        <RadioGroup name="primary" variant="primary" value={primary} onChange={setPrimary}>
          <Radio value="a" label="Option A" />
          <Radio value="b" label="Option B" />
        </RadioGroup>
      </div>
      <div>
        <p style={{ marginBottom: 8, fontWeight: 500 }}>Secondary</p>
        <RadioGroup
          name="secondary"
          variant="secondary"
          value={secondary}
          onChange={setSecondary}
        >
          <Radio value="a" label="Option A" />
          <Radio value="b" label="Option B" />
        </RadioGroup>
      </div>
    </div>
  );
};

export const DefaultValue = () => (
  <RadioGroup name="default-val" defaultValue="banana">
    <Radio value="apple" label="Apple" />
    <Radio value="banana" label="Banana" />
    <Radio value="cherry" label="Cherry" />
  </RadioGroup>
);
