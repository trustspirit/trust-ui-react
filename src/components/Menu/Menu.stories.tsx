import type { Meta, StoryObj } from '@storybook/react';
import { Menu } from './Menu';
import { Button } from '../Button';

const meta: Meta = {
  title: 'Overlay/Menu',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ padding: 40 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Menu>
      <Menu.Trigger>
        <Button variant="outline">Open Menu</Button>
      </Menu.Trigger>
      <Menu.Content>
        <Menu.Item onClick={() => console.log('Edit')}>Edit</Menu.Item>
        <Menu.Item onClick={() => console.log('Duplicate')}>Duplicate</Menu.Item>
        <Menu.Item onClick={() => console.log('Share')}>Share</Menu.Item>
      </Menu.Content>
    </Menu>
  ),
};

/**
 * 표면 자체를 찍기 위한 스토리 — 트리거를 누르지 않고 defaultOpen 으로 바로
 * 연다. Menu 는 내부 useState 로만 열림 상태를 갖고 제어 prop 이 없어서,
 * click 애니메이션에 의존하는 play 함수 없이 표면을 안정적으로 캡처하려면
 * 이 초기값이 필요하다.
 */
export const Open: Story = {
  render: () => (
    <Menu defaultOpen>
      <Menu.Trigger>
        <Button variant="outline">Open Menu</Button>
      </Menu.Trigger>
      <Menu.Content>
        <Menu.Item onClick={() => console.log('Edit')}>Edit</Menu.Item>
        <Menu.Item onClick={() => console.log('Duplicate')}>Duplicate</Menu.Item>
        <Menu.Item onClick={() => console.log('Share')}>Share</Menu.Item>
      </Menu.Content>
    </Menu>
  ),
};

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M11 2l3 3L5 14H2v-3L11 2z" />
  </svg>
);

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="5" y="5" width="9" height="9" rx="1" />
    <path d="M11 5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v7a1 1 0 001 1h2" />
  </svg>
);

const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M4 8v5a1 1 0 001 1h6a1 1 0 001-1V8" />
    <path d="M8 2v8M5 5l3-3 3 3" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v5M10 7v5" />
    <path d="M3 4l1 10a1 1 0 001 1h6a1 1 0 001-1l1-10" />
  </svg>
);

export const WithIcons: Story = {
  render: () => (
    <Menu>
      <Menu.Trigger>
        <Button variant="outline">Actions</Button>
      </Menu.Trigger>
      <Menu.Content>
        <Menu.Item startIcon={<EditIcon />} onClick={() => console.log('Edit')}>
          Edit
        </Menu.Item>
        <Menu.Item startIcon={<CopyIcon />} onClick={() => console.log('Duplicate')}>
          Duplicate
        </Menu.Item>
        <Menu.Item startIcon={<ShareIcon />} onClick={() => console.log('Share')}>
          Share
        </Menu.Item>
      </Menu.Content>
    </Menu>
  ),
};

export const WithDivider: Story = {
  render: () => (
    <Menu>
      <Menu.Trigger>
        <Button variant="outline">File</Button>
      </Menu.Trigger>
      <Menu.Content>
        <Menu.Item startIcon={<EditIcon />}>Edit</Menu.Item>
        <Menu.Item startIcon={<CopyIcon />}>Duplicate</Menu.Item>
        <Menu.Divider />
        <Menu.Item startIcon={<ShareIcon />}>Share</Menu.Item>
        <Menu.Divider />
        <Menu.Item danger startIcon={<TrashIcon />}>
          Delete
        </Menu.Item>
      </Menu.Content>
    </Menu>
  ),
};

export const DangerItem: Story = {
  render: () => (
    <Menu>
      <Menu.Trigger>
        <Button variant="outline">Settings</Button>
      </Menu.Trigger>
      <Menu.Content>
        <Menu.Item>Profile</Menu.Item>
        <Menu.Item>Preferences</Menu.Item>
        <Menu.Divider />
        <Menu.Item danger>Delete Account</Menu.Item>
      </Menu.Content>
    </Menu>
  ),
};

export const AlignEnd: Story = {
  render: () => (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <Menu>
        <Menu.Trigger>
          <Button variant="outline">Align End</Button>
        </Menu.Trigger>
        <Menu.Content align="end">
          <Menu.Item>Option A</Menu.Item>
          <Menu.Item>Option B</Menu.Item>
          <Menu.Item>Option C</Menu.Item>
        </Menu.Content>
      </Menu>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Menu>
      <Menu.Trigger>
        <Button variant="outline">Menu with disabled</Button>
      </Menu.Trigger>
      <Menu.Content>
        <Menu.Item>Available</Menu.Item>
        <Menu.Item disabled>Unavailable</Menu.Item>
        <Menu.Item>Also Available</Menu.Item>
        <Menu.Divider />
        <Menu.Item disabled danger>
          Delete (no permission)
        </Menu.Item>
      </Menu.Content>
    </Menu>
  ),
};

export const MobileSheet: Story = {
  args: { mobileVariant: 'sheet' },
  render: (args) => (
    <Menu mobileVariant={args.mobileVariant as 'dropdown' | 'sheet' | undefined}>
      <Menu.Trigger>
        <Button variant="outline">Actions (sheet on touch)</Button>
      </Menu.Trigger>
      <Menu.Content>
        <Menu.Item onClick={() => console.log('Edit')}>Edit</Menu.Item>
        <Menu.Item onClick={() => console.log('Duplicate')}>Duplicate</Menu.Item>
        <Menu.Item onClick={() => console.log('Share')}>Share</Menu.Item>
        <Menu.Item danger onClick={() => console.log('Delete')}>
          Delete
        </Menu.Item>
      </Menu.Content>
    </Menu>
  ),
};
