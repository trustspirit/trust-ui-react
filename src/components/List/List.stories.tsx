import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { List } from './List';
import { Switch } from '../Switch';
import { Badge } from '../Badge';

const meta: Meta<typeof List> = {
  title: 'Components/List',
  component: List,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 420 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof List>;

function WifiIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.55a11 11 0 0 1 14 0" />
      <path d="M8.5 16.1a6 6 0 0 1 7 0" />
      <line x1="12" y1="20" x2="12" y2="20" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

export const Default: Story = {
  render: () => (
    <List aria-label="Settings">
      <List.Item title="Account" description="Profile, password and security" leading={<UserIcon />} href="#account" />
      <List.Item title="Notifications" leading={<BellIcon />} href="#notifications" trailing={<Badge size="sm">3</Badge>} />
      <List.Item title="Language" href="#language" trailing="English" />
      <List.Item title="Version" trailing="2.2.0" />
    </List>
  ),
};

export const Outlined: Story = {
  render: () => (
    <List variant="outlined" aria-label="Settings">
      <List.Item title="Account" leading={<UserIcon />} href="#account" />
      <List.Item title="Notifications" leading={<BellIcon />} href="#notifications" />
      <List.Item title="Sign out" onClick={() => {}} />
    </List>
  ),
};

export const Dividers: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tui-gap-5)' }}>
      <List variant="outlined" dividers aria-label="Full dividers">
        <List.Item title="Account" leading={<UserIcon />} href="#account" />
        <List.Item title="Notifications" leading={<BellIcon />} href="#notifications" />
      </List>
      <List variant="outlined" dividers="inset" aria-label="Inset dividers">
        <List.Item title="Account" leading={<UserIcon />} href="#account" />
        <List.Item title="Notifications" leading={<BellIcon />} href="#notifications" />
      </List>
      <List variant="outlined" dividers={false} aria-label="No dividers">
        <List.Item title="Account" leading={<UserIcon />} href="#account" />
        <List.Item title="Notifications" leading={<BellIcon />} href="#notifications" />
      </List>
    </div>
  ),
};

export const Density: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tui-gap-5)' }}>
      <List variant="outlined" density="comfortable" aria-label="Comfortable">
        <List.Item title="Comfortable" trailing="56px" />
        <List.Item title="Row" trailing="56px" />
      </List>
      <List variant="outlined" density="compact" aria-label="Compact">
        <List.Item title="Compact" trailing="46px" />
        <List.Item title="Row" trailing="46px" />
      </List>
    </div>
  ),
};

export const WithControls: Story = {
  render: function Render() {
    const [wifi, setWifi] = useState(true);
    const [push, setPush] = useState(false);
    return (
      <List variant="outlined" aria-label="Network">
        {/* 행은 상세 화면으로 가는 링크, 스위치는 그 옆의 별도 타깃이다. */}
        <List.Item
          title="Wi-Fi"
          description={wifi ? 'Connected' : 'Off'}
          leading={<WifiIcon />}
          href="#wifi"
          trailing={<Switch aria-label="Wi-Fi" checked={wifi} onChange={setWifi} />}
        />
        <List.Item
          title="Push notifications"
          leading={<BellIcon />}
          trailing={<Switch aria-label="Push notifications" checked={push} onChange={setPush} />}
        />
      </List>
    );
  },
};

export const Navigation: Story = {
  render: function Render() {
    const [current, setCurrent] = useState('orders');
    const rows = [
      { id: 'home', title: 'Home' },
      { id: 'orders', title: 'Orders' },
      { id: 'customers', title: 'Customers' },
    ];
    return (
      <nav aria-label="Main">
        <List dividers={false}>
          {rows.map((row) => (
            <List.Item
              key={row.id}
              title={row.title}
              selected={current === row.id}
              onClick={() => setCurrent(row.id)}
            />
          ))}
          <List.Item title="Reports" onClick={() => {}} disabled />
        </List>
      </nav>
    );
  },
};

export const Multiline: Story = {
  render: () => (
    <List variant="outlined" aria-label="Messages">
      <List.Item
        title="A long title that is truncated with an ellipsis when it does not fit on one line"
        description="The description is clamped to two lines by default. Anything after the second line is cut off so that rows keep a predictable height in dense collections."
      />
      <List.Item
        multiline
        title="A long title that wraps onto as many lines as it needs when multiline is set"
        description="With multiline the description is shown in full. Use it for rows whose text is the content, such as messages or notices."
      />
    </List>
  ),
};

export const Sections: Story = {
  render: () => (
    <div>
      <List.Section title="Network">
        <List variant="outlined">
          <List.Item title="Wi-Fi" leading={<WifiIcon />} href="#wifi" trailing="Office" />
          <List.Item title="Mobile data" href="#data" />
        </List>
      </List.Section>
      <List.Section title="Account">
        <List variant="outlined">
          <List.Item title="Profile" leading={<UserIcon />} href="#profile" />
          <List.Item title="Sign out" onClick={() => {}} />
        </List>
      </List.Section>
    </div>
  ),
};

export const RightToLeft: Story = {
  render: () => (
    <div dir="rtl">
      <List variant="outlined" dividers="inset" aria-label="الإعدادات">
        <List.Item title="الحساب" description="الملف الشخصي والأمان" leading={<UserIcon />} href="#account" />
        <List.Item title="الإشعارات" leading={<BellIcon />} href="#notifications" />
      </List>
    </div>
  ),
};
