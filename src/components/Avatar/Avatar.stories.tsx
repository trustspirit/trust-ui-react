import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './Avatar';

const meta: Meta<typeof Avatar> = {
  title: 'Components/Avatar',
  component: Avatar,
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

export const WithImage: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?img=32',
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
