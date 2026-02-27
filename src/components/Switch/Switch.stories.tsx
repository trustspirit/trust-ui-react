import { useState } from 'react';
import { Switch } from './Switch';

export default {
  title: 'Form/Switch',
  component: Switch,
};

export const Default = () => {
  const [checked, setChecked] = useState(false);
  return <Switch checked={checked} onChange={setChecked} label="Enable notifications" />;
};

export const Checked = () => (
  <Switch checked onChange={() => {}} label="Enabled" />
);

export const Sizes = () => {
  const [sm, setSm] = useState(true);
  const [md, setMd] = useState(true);
  const [lg, setLg] = useState(true);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Switch size="sm" checked={sm} onChange={setSm} label="Small" />
      <Switch size="md" checked={md} onChange={setMd} label="Medium" />
      <Switch size="lg" checked={lg} onChange={setLg} label="Large" />
    </div>
  );
};

export const Variants = () => {
  const [primary, setPrimary] = useState(true);
  const [secondary, setSecondary] = useState(true);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Switch
        variant="primary"
        checked={primary}
        onChange={setPrimary}
        label="Primary"
      />
      <Switch
        variant="secondary"
        checked={secondary}
        onChange={setSecondary}
        label="Secondary"
      />
    </div>
  );
};

export const Disabled = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <Switch disabled label="Disabled off" />
    <Switch disabled checked onChange={() => {}} label="Disabled on" />
  </div>
);

export const WithLabel = () => {
  const [dark, setDark] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Switch checked={dark} onChange={setDark} label="Dark mode" />
      <Switch
        checked={notifications}
        onChange={setNotifications}
        label="Push notifications"
      />
      <Switch checked={autoSave} onChange={setAutoSave} label="Auto-save" />
    </div>
  );
};

export const Uncontrolled = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <Switch defaultChecked={false} label="Uncontrolled (off)" />
    <Switch defaultChecked={true} label="Uncontrolled (on)" />
  </div>
);
