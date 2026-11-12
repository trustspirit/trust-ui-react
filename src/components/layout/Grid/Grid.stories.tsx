import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Grid } from './Grid';

const meta: Meta<typeof Grid> = {
  title: 'Layout/Grid',
  component: Grid,
  tags: ['autodocs'],
  argTypes: {
    gap: { control: 'select', options: [0, 1, 2, 3, 4, 5, 6] },
    rowGap: { control: 'select', options: [undefined, 0, 1, 2, 3, 4, 5, 6] },
    columnGap: { control: 'select', options: [undefined, 0, 1, 2, 3, 4, 5, 6] },
  },
};
export default meta;
type Story = StoryObj<typeof Grid>;

const cell: CSSProperties = {
  padding: 'var(--tui-pad-3)',
  border: '1px solid var(--tui-rule)',
  borderRadius: 'var(--tui-radius-tight)',
  background: 'var(--tui-field)',
  color: 'var(--tui-ink)',
  fontSize: 'var(--tui-font-size-body)',
};

const cells = (count: number) =>
  Array.from({ length: count }, (_, i) => (
    <div key={i} style={cell}>
      Cell {i + 1}
    </div>
  ));

/** Resize the canvas: columns are added and removed as the container changes, with no media queries. */
export const Default: Story = {
  render: (args) => <Grid {...args}>{cells(6)}</Grid>,
};

export const FixedColumns: Story = {
  args: { columns: 3 },
  render: Default.render,
};

/** At most three columns, however wide the container gets; one column below 180px. */
export const ResponsiveWithMax: Story = {
  args: { columns: { minWidth: 180, max: 3 } },
  render: (args) => <Grid {...args}>{cells(7)}</Grid>,
};

export const SeparateGaps: Story = {
  args: { columns: 3, rowGap: 6, columnGap: 2 },
  render: Default.render,
};

export const Spans: Story = {
  render: () => (
    <Grid columns={4}>
      <Grid.Item span="full" style={cell}>
        span="full"
      </Grid.Item>
      <Grid.Item span={2} style={cell}>
        span=2
      </Grid.Item>
      <Grid.Item style={cell}>1</Grid.Item>
      <Grid.Item style={cell}>1</Grid.Item>
      <Grid.Item style={cell}>1</Grid.Item>
      <Grid.Item span={3} style={cell}>
        span=3
      </Grid.Item>
    </Grid>
  ),
};

/** `span="full"` is safe in a responsive grid at any column count, including one. */
export const FullWidthInResponsive: Story = {
  render: () => (
    <Grid columns={{ minWidth: 160 }}>
      <Grid.Item span="full" style={cell}>
        Full-width heading
      </Grid.Item>
      {cells(5)}
    </Grid>
  ),
};

/** A 320px container: the responsive grid collapses to one column and nothing overflows. */
export const NarrowContainer: Story = {
  render: () => (
    <div style={{ width: 320, maxWidth: '100%', border: '1px dashed var(--tui-rule-strong)' }}>
      <Grid columns={{ minWidth: 400, max: 3 }}>{cells(3)}</Grid>
    </div>
  ),
};
