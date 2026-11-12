import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { BottomNav, type BottomNavItem, type BottomNavProps } from './BottomNav';

const meta: Meta = {
  title: 'Navigation/BottomNav',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 390, border: '1px solid var(--tui-rule)' }}>
        <div style={{ padding: 24, minHeight: 120, color: 'var(--tui-ink-2)' }}>Screen content</div>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj;

const icon = (d: string) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const items: BottomNavItem[] = [
  { value: 'home', label: 'Home', icon: icon('M4 11l8-7 8 7v9h-5v-6H9v6H4z') },
  { value: 'markets', label: 'Markets', icon: icon('M4 19V9m5 10V5m5 14v-7m5 7V8') },
  { value: 'inbox', label: 'Inbox', icon: icon('M4 6h16v12H4zM4 7l8 6 8-6'), badge: 3 },
  { value: 'profile', label: 'Profile', icon: icon('M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c1.5-4 14.5-4 16 0') },
];

function Demo(props: Partial<BottomNavProps>) {
  const [value, setValue] = useState('home');
  // 스토리에서는 문서 흐름 안에 둔다. 실제 앱에서는 fixed(기본값)로 화면 아래에 붙는다.
  return <BottomNav items={items} value={value} onChange={setValue} fixed={false} {...props} />;
}

export const Default: Story = {
  render: () => <Demo />,
};

export const IconsOnly: Story = {
  render: () => <Demo showLabels={false} />,
};

export const WithDisabledItem: Story = {
  render: () => <Demo items={items.map((item) => (item.value === 'markets' ? { ...item, disabled: true } : item))} />,
};

export const AsLinks: Story = {
  render: function AsLinksStory() {
    const [value, setValue] = useState('home');
    return (
      <BottomNav
        fixed={false}
        value={value}
        items={items.map((item) => ({ ...item, href: `#${item.value}` }))}
        onChange={(next, event) => {
          // 클라이언트 라우터를 쓸 때는 여기서 기본 이동을 막고 직접 이동시킨다.
          event.preventDefault();
          setValue(next);
        }}
      />
    );
  },
};

export const FiveDestinations: Story = {
  render: () => (
    <Demo
      items={[
        ...items,
        { value: 'more', label: 'More', icon: icon('M5 12h.01M12 12h.01M19 12h.01') },
      ]}
    />
  ),
};
