import type { Meta, StoryObj } from '@storybook/react';
import { Chip } from './Chip';

const meta: Meta<typeof Chip> = {
  title: 'Components/Chip',
  component: Chip,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['filled', 'outlined', 'subtle', 'solid', 'outline'],
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'danger', 'warning', 'info'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
    },
  },
  args: {
    children: 'Chip',
  },
};

export default meta;
type Story = StoryObj<typeof Chip>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Chip variant="solid">Filled</Chip>
      <Chip variant="outline">Outlined</Chip>
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Chip color="primary">Primary</Chip>
      <Chip color="secondary">Secondary</Chip>
      <Chip color="success">Success</Chip>
      <Chip color="danger">Danger</Chip>
      <Chip color="warning">Warning</Chip>
      <Chip color="info">Info</Chip>
      <Chip variant="outline" color="primary">Primary</Chip>
      <Chip variant="outline" color="secondary">Secondary</Chip>
      <Chip variant="outline" color="success">Success</Chip>
      <Chip variant="outline" color="danger">Danger</Chip>
      <Chip variant="outline" color="warning">Warning</Chip>
      <Chip variant="outline" color="info">Info</Chip>
    </div>
  ),
};

export const Subtle: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Chip variant="subtle" color="primary">Primary</Chip>
      <Chip variant="subtle" color="success">Success</Chip>
      <Chip variant="subtle" color="danger">Danger</Chip>
      <Chip variant="subtle" color="warning">Warning</Chip>
      <Chip variant="subtle" color="info">Info</Chip>
    </div>
  ),
};

export const Deletable: Story = {
  args: {
    children: 'Deletable',
    onDelete: () => alert('Deleted!'),
  },
};

export const Clickable: Story = {
  args: {
    children: 'Clickable',
    onClick: () => alert('Clicked!'),
  },
};

const TagIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
    <circle cx="5" cy="5" r="1.5" />
    <path d="M1 1h6l7 7-6 6-7-7V1z" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

export const WithIcon: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Chip startIcon={<TagIcon />}>Tag</Chip>
      <Chip startIcon={<TagIcon />} variant="outline">
        Outlined tag
      </Chip>
    </div>
  ),
};
