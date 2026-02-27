import { useState } from 'react';
import { Checkbox } from './Checkbox';

export default {
  title: 'Form/Checkbox',
  component: Checkbox,
};

export const Default = () => {
  const [checked, setChecked] = useState(false);
  return (
    <Checkbox
      checked={checked}
      onChange={(e) => setChecked(e.target.checked)}
      label="Accept terms and conditions"
    />
  );
};

export const Checked = () => (
  <Checkbox checked onChange={() => {}} label="This is checked" />
);

export const Indeterminate = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <Checkbox indeterminate label="Indeterminate (primary)" />
    <Checkbox indeterminate variant="secondary" label="Indeterminate (secondary)" />
  </div>
);

export const Variants = () => {
  const [primary, setPrimary] = useState(true);
  const [secondary, setSecondary] = useState(true);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Checkbox
        checked={primary}
        onChange={(e) => setPrimary(e.target.checked)}
        variant="primary"
        label="Primary variant"
      />
      <Checkbox
        checked={secondary}
        onChange={(e) => setSecondary(e.target.checked)}
        variant="secondary"
        label="Secondary variant"
      />
    </div>
  );
};

export const Disabled = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <Checkbox disabled label="Disabled unchecked" />
    <Checkbox disabled checked onChange={() => {}} label="Disabled checked" />
    <Checkbox disabled indeterminate label="Disabled indeterminate" />
  </div>
);

export const WithLabel = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <Checkbox label="Remember me" />
    <Checkbox label="Subscribe to newsletter" />
    <Checkbox label="I agree to the privacy policy" />
  </div>
);

export const WithoutLabel = () => (
  <div style={{ display: 'flex', gap: 12 }}>
    <Checkbox aria-label="Option 1" />
    <Checkbox aria-label="Option 2" defaultChecked />
    <Checkbox aria-label="Option 3" />
  </div>
);
