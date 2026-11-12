import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { IconButton } from './IconButton';

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

const StarIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </svg>
);

const meta: Meta<typeof IconButton> = {
  title: 'Components/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger'],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    shape: { control: 'select', options: ['square', 'rounded', 'pill'] },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    pressed: { control: 'boolean' },
  },
  args: {
    label: 'Close',
    icon: <CloseIcon />,
  },
};

export default meta;
type Story = StoryObj<typeof IconButton>;

const row = { display: 'flex', gap: 12, alignItems: 'center' } as const;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <div style={row}>
      <IconButton label="Close" icon={<CloseIcon />} variant="ghost" />
      <IconButton label="Close" icon={<CloseIcon />} variant="outline" />
      <IconButton label="Close" icon={<CloseIcon />} variant="secondary" />
      <IconButton label="Close" icon={<CloseIcon />} variant="primary" />
      <IconButton label="Delete" icon={<TrashIcon />} variant="danger" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={row}>
      <IconButton label="Close" icon={<CloseIcon />} variant="outline" size="sm" />
      <IconButton label="Close" icon={<CloseIcon />} variant="outline" size="md" />
      <IconButton label="Close" icon={<CloseIcon />} variant="outline" size="lg" />
    </div>
  ),
};

export const Shapes: Story = {
  render: () => (
    <div style={row}>
      <IconButton label="Close" icon={<CloseIcon />} variant="outline" shape="square" />
      <IconButton label="Close" icon={<CloseIcon />} variant="outline" shape="rounded" />
      <IconButton label="Close" icon={<CloseIcon />} variant="outline" shape="pill" />
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div style={row}>
      <IconButton label="Refresh" icon={<CloseIcon />} loading />
      <IconButton label="Refresh" icon={<CloseIcon />} variant="outline" loading />
      <IconButton label="Refresh" icon={<CloseIcon />} variant="primary" loading />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div style={row}>
      <IconButton label="Close" icon={<CloseIcon />} disabled />
      <IconButton label="Close" icon={<CloseIcon />} variant="outline" disabled />
      <IconButton label="Close" icon={<CloseIcon />} variant="primary" disabled />
    </div>
  ),
};

function ToggleExample({ variant }: { variant: 'ghost' | 'outline' | 'primary' }) {
  const [on, setOn] = useState(variant !== 'ghost');
  return (
    <IconButton
      label="Favourite"
      variant={variant}
      pressed={on}
      onClick={() => setOn((v) => !v)}
      icon={<StarIcon filled={on} />}
    />
  );
}

export const Pressed: Story = {
  render: () => (
    <div style={row}>
      <ToggleExample variant="ghost" />
      <ToggleExample variant="outline" />
      <ToggleExample variant="primary" />
    </div>
  ),
};

export const WithTooltip: Story = {
  render: () => (
    <div style={{ ...row, padding: 48 }}>
      <IconButton label="Close" icon={<CloseIcon />} tooltip />
      <IconButton
        label="Delete"
        icon={<TrashIcon />}
        variant="outline"
        tooltip="Delete this transaction"
        tooltipProps={{ placement: 'bottom' }}
      />
    </div>
  ),
};
