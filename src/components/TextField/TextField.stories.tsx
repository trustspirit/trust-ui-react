import { useState } from 'react';
import { TextField } from './TextField';

export default {
  title: 'Form/TextField',
  component: TextField,
};

export const Default = () => <TextField label="Name" placeholder="Enter your name" />;

export const Variants = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <TextField variant="outlined" label="Outlined" placeholder="Outlined variant" />
    <TextField variant="filled" label="Filled" placeholder="Filled variant" />
  </div>
);

export const Sizes = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <TextField size="sm" label="Small" placeholder="Small size" />
    <TextField size="md" label="Medium" placeholder="Medium size" />
    <TextField size="lg" label="Large" placeholder="Large size" />
  </div>
);

export const Types = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <TextField type="tel" label="Phone" placeholder="010-1234-5678" />
    <TextField type="password" label="Password" placeholder="Enter password" />
    <TextField type="email" label="Email" placeholder="user@example.com" />
    <TextField type="number" label="Number" placeholder="Enter number" />
  </div>
);

export const CurrencyFormat = () => {
  const [raw, setRaw] = useState('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <TextField
        format="currency"
        label="Price"
        placeholder="0"
        prefix={<span>&#8361;</span>}
        onValueChange={setRaw}
      />
      <span style={{ fontSize: 12, color: '#666' }}>Raw value: {raw}</span>
    </div>
  );
};

export const DecimalFormat = () => {
  const [raw, setRaw] = useState('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <TextField
        format="decimal"
        label="Decimal"
        placeholder="0.00"
        onValueChange={setRaw}
      />
      <span style={{ fontSize: 12, color: '#666' }}>Raw value: {raw}</span>
    </div>
  );
};

export const WithHelperText = () => (
  <TextField
    label="Username"
    placeholder="Choose a username"
    helperText="Must be 3-20 characters long"
  />
);

export const WithError = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <TextField
      label="Email"
      placeholder="user@example.com"
      error
      errorMessage="Please enter a valid email address"
      defaultValue="invalid-email"
    />
    <TextField
      label="Password"
      type="password"
      error
      errorMessage="Password is too short"
    />
  </div>
);

export const WithPrefixSuffix = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <TextField label="Website" prefix={<span>https://</span>} placeholder="example.com" />
    <TextField label="Email" suffix={<span>@gmail.com</span>} placeholder="username" />
    <TextField
      label="Price"
      prefix={<span>$</span>}
      suffix={<span>USD</span>}
      placeholder="0.00"
    />
  </div>
);

export const Multiline = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <TextField
      multiline
      label="Description"
      placeholder="Enter a description..."
      rows={4}
    />
    <TextField
      multiline
      variant="filled"
      label="Notes"
      placeholder="Enter notes..."
      rows={3}
    />
  </div>
);

export const CharacterCount = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <TextField
      label="Bio"
      placeholder="Tell us about yourself"
      maxLength={100}
      helperText="Keep it brief"
    />
    <TextField
      multiline
      label="Comment"
      placeholder="Write a comment..."
      maxLength={500}
      rows={3}
    />
  </div>
);

export const Disabled = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <TextField label="Disabled outlined" placeholder="Cannot edit" disabled />
    <TextField
      variant="filled"
      label="Disabled filled"
      placeholder="Cannot edit"
      disabled
    />
  </div>
);

export const FullWidth = () => (
  <div style={{ maxWidth: 600 }}>
    <TextField
      fullWidth
      label="Full width"
      placeholder="This field fills the container"
    />
  </div>
);
