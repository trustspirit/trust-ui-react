import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Tabs } from './Tabs';

const meta: Meta = {
  title: 'Navigation/Tabs',
  decorators: [
    (Story) => (
      <div style={{ padding: 24, maxWidth: 600 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account">
      <Tabs.List>
        <Tabs.Trigger value="account">Account</Tabs.Trigger>
        <Tabs.Trigger value="password">Password</Tabs.Trigger>
        <Tabs.Trigger value="notifications">Notifications</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="account">
        <h3 style={{ margin: '0 0 8px' }}>Account Settings</h3>
        <p>Manage your account details and preferences here.</p>
      </Tabs.Content>
      <Tabs.Content value="password">
        <h3 style={{ margin: '0 0 8px' }}>Change Password</h3>
        <p>Update your password to keep your account secure.</p>
      </Tabs.Content>
      <Tabs.Content value="notifications">
        <h3 style={{ margin: '0 0 8px' }}>Notification Preferences</h3>
        <p>Choose which notifications you want to receive.</p>
      </Tabs.Content>
    </Tabs>
  ),
};

export const PillVariant: Story = {
  render: () => (
    <Tabs defaultValue="all" variant="pill">
      <Tabs.List>
        <Tabs.Trigger value="all">All</Tabs.Trigger>
        <Tabs.Trigger value="active">Active</Tabs.Trigger>
        <Tabs.Trigger value="completed">Completed</Tabs.Trigger>
        <Tabs.Trigger value="archived">Archived</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="all">
        <p>Showing all items.</p>
      </Tabs.Content>
      <Tabs.Content value="active">
        <p>Showing active items only.</p>
      </Tabs.Content>
      <Tabs.Content value="completed">
        <p>Showing completed items only.</p>
      </Tabs.Content>
      <Tabs.Content value="archived">
        <p>Showing archived items only.</p>
      </Tabs.Content>
    </Tabs>
  ),
};

export const Controlled: Story = {
  render: () => {
    function ControlledTabs() {
      const [activeTab, setActiveTab] = useState('tab1');
      return (
        <div>
          <p style={{ marginBottom: 12, color: 'var(--tui-text-secondary)' }}>
            Active tab: <strong>{activeTab}</strong>
          </p>
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Trigger value="tab1">First</Tabs.Trigger>
              <Tabs.Trigger value="tab2">Second</Tabs.Trigger>
              <Tabs.Trigger value="tab3">Third</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="tab1">
              <p>Content for the first tab.</p>
            </Tabs.Content>
            <Tabs.Content value="tab2">
              <p>Content for the second tab.</p>
            </Tabs.Content>
            <Tabs.Content value="tab3">
              <p>Content for the third tab.</p>
            </Tabs.Content>
          </Tabs>
        </div>
      );
    }
    return <ControlledTabs />;
  },
};

export const Disabled: Story = {
  render: () => (
    <Tabs defaultValue="general">
      <Tabs.List>
        <Tabs.Trigger value="general">General</Tabs.Trigger>
        <Tabs.Trigger value="advanced" disabled>
          Advanced
        </Tabs.Trigger>
        <Tabs.Trigger value="billing">Billing</Tabs.Trigger>
        <Tabs.Trigger value="danger" disabled>
          Danger Zone
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="general">
        <p>General settings.</p>
      </Tabs.Content>
      <Tabs.Content value="advanced">
        <p>Advanced settings (disabled).</p>
      </Tabs.Content>
      <Tabs.Content value="billing">
        <p>Billing information.</p>
      </Tabs.Content>
      <Tabs.Content value="danger">
        <p>Danger zone settings (disabled).</p>
      </Tabs.Content>
    </Tabs>
  ),
};

export const ManyTabs: Story = {
  render: () => (
    <Tabs defaultValue="tab-1">
      <Tabs.List>
        {Array.from({ length: 10 }, (_, i) => (
          <Tabs.Trigger key={i} value={`tab-${i + 1}`}>
            Tab {i + 1}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {Array.from({ length: 10 }, (_, i) => (
        <Tabs.Content key={i} value={`tab-${i + 1}`}>
          <p>Content for tab {i + 1}.</p>
        </Tabs.Content>
      ))}
    </Tabs>
  ),
};
