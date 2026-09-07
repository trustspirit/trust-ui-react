import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './Avatar';

const meta: Meta<typeof Avatar> = {
  title: 'Components/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  argTypes: {
    shape: {
      control: 'select',
      options: ['circle', 'square'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

// 원격 이미지(i.pravatar.cc)는 시각 회귀 스위트에서 진짜 결함을 냈다 — 300ms
// 고정 대기가 네트워크 로드를 항상 기다려주지 못해 실행마다 빈 화면·대체
// 아이콘·실제 이미지 중 하나로 무작위로 정착했다. 인라인 data URI로 바꿔
// 네트워크 의존을 없앤다 — 실제 사진이 아니어도 "이미지 소스가 있을 때"를
// 검증하는 목적은 그대로 충족한다.
const PLACEHOLDER_AVATAR =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiB2aWV3Qm94PSIwIDAgMTUwIDE1MCI+CiAgPHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiNjOWM5YzkiLz4KICA8Y2lyY2xlIGN4PSI3NSIgY3k9IjU4IiByPSIyOCIgZmlsbD0iIzZlNmU2ZSIvPgogIDxjaXJjbGUgY3g9Ijc1IiBjeT0iMTY1IiByPSI1NSIgZmlsbD0iIzZlNmU2ZSIvPgo8L3N2Zz4=';

export const WithImage: Story = {
  args: {
    src: PLACEHOLDER_AVATAR,
    alt: 'User avatar',
  },
};

export const WithInitials: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Avatar name="John Doe" />
      <Avatar name="Alice" />
      <Avatar name="Bob Smith" />
    </div>
  ),
};

export const Fallback: Story = {
  args: {
    alt: 'Default avatar',
  },
};

export const Shapes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Avatar name="Circle" shape="circle" />
      <Avatar name="Square" shape="square" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Avatar name="Small User" size="sm" />
      <Avatar name="Medium User" size="md" />
      <Avatar name="Large User" size="lg" />
    </div>
  ),
};

export const Status: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Avatar name="John Doe" status="online" />
      <Avatar name="Mary Kim" status="away" />
      <Avatar name="Ryan Taylor" status="busy" />
      <Avatar name="Alex Lee" status="offline" />
    </div>
  ),
};

export const Outlined: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12 }}>
      <Avatar name="John Doe" outlined />
      <Avatar name="Mary Kim" outlined size="lg" />
    </div>
  ),
};
