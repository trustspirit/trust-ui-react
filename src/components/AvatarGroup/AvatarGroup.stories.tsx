import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from '../Avatar';
import { AvatarGroup } from './AvatarGroup';

const meta: Meta<typeof AvatarGroup> = {
  title: 'Components/AvatarGroup',
  component: AvatarGroup,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    spacing: { control: 'select', options: ['tight', 'normal'] },
    max: { control: 'number' },
    total: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof AvatarGroup>;

const NAMES = ['Ada Park', 'Ben Cho', 'Cy Lim', 'Di Seo', 'Eli Han', 'Fay Oh'];
const people = (count: number) => NAMES.slice(0, count).map((name) => <Avatar key={name} name={name} />);

export const Default: Story = {
  args: { children: people(6) },
};

export const Max: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <AvatarGroup max={2}>{people(6)}</AvatarGroup>
      <AvatarGroup max={3}>{people(6)}</AvatarGroup>
      <AvatarGroup max={6}>{people(6)}</AvatarGroup>
    </div>
  ),
};

export const Total: Story = {
  args: { max: 3, total: 128, children: people(3) },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <AvatarGroup size="sm">{people(6)}</AvatarGroup>
      <AvatarGroup size="md">{people(6)}</AvatarGroup>
      <AvatarGroup size="lg">{people(6)}</AvatarGroup>
    </div>
  ),
};

export const Spacing: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <AvatarGroup spacing="normal">{people(6)}</AvatarGroup>
      <AvatarGroup spacing="tight">{people(6)}</AvatarGroup>
    </div>
  ),
};

export const SquareAvatars: Story = {
  render: () => (
    <AvatarGroup max={3}>
      {NAMES.map((name) => (
        <Avatar key={name} name={name} shape="square" />
      ))}
    </AvatarGroup>
  ),
};

export const OnSheetSurface: Story = {
  render: () => (
    <div
      style={{
        padding: 16,
        background: 'var(--tui-sheet)',
        border: '1px solid var(--tui-rule)',
        borderRadius: 'var(--tui-radius-sheet)',
      }}
    >
      <AvatarGroup ringColor="var(--tui-sheet)">{people(6)}</AvatarGroup>
    </div>
  ),
};

export const CustomOverflow: Story = {
  render: () => (
    <AvatarGroup
      max={3}
      label="Project members"
      renderOverflow={(hidden, tile) => (
        <button
          type="button"
          onClick={() => undefined}
          style={{ all: 'unset', display: 'inline-flex', cursor: 'pointer', borderRadius: '999px' }}
          aria-label={`Show ${hidden} more members`}
        >
          {tile}
        </button>
      )}
    >
      {people(6)}
    </AvatarGroup>
  ),
};

export const RightToLeft: Story = {
  render: () => (
    <div dir="rtl">
      <AvatarGroup max={3}>{people(6)}</AvatarGroup>
    </div>
  ),
};
