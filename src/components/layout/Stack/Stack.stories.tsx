import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Stack, HStack, VStack } from './Stack';

const meta: Meta<typeof Stack> = {
  title: 'Layout/Stack',
  component: Stack,
  tags: ['autodocs'],
  argTypes: {
    direction: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
    gap: { control: 'select', options: [0, 1, 2, 3, 4, 5, 6] },
    align: { control: 'select', options: [undefined, 'start', 'center', 'end', 'stretch', 'baseline'] },
    justify: { control: 'select', options: [undefined, 'start', 'center', 'end', 'between'] },
    wrap: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<typeof Stack>;

const box: CSSProperties = {
  padding: 'var(--tui-pad-2) var(--tui-pad-3)',
  border: '1px solid var(--tui-rule)',
  borderRadius: 'var(--tui-radius-tight)',
  background: 'var(--tui-field)',
  color: 'var(--tui-ink)',
  fontSize: 'var(--tui-font-size-body)',
};

const caption: CSSProperties = {
  color: 'var(--tui-ink-3)',
  fontSize: 'var(--tui-font-size-caption)',
};

const Box = ({ children, style }: { children: React.ReactNode; style?: CSSProperties }) => (
  <div style={{ ...box, ...style }}>{children}</div>
);

export const Default: Story = {
  render: (args) => (
    <Stack {...args}>
      <Box>One</Box>
      <Box>Two</Box>
      <Box>Three</Box>
    </Stack>
  ),
};

export const Horizontal: Story = {
  args: { direction: 'horizontal' },
  render: Default.render,
};

export const Gaps: Story = {
  render: () => (
    <VStack gap={5}>
      {([0, 1, 2, 3, 4, 5, 6] as const).map((gap) => (
        <VStack key={gap} gap={1}>
          <span style={caption}>gap={gap}</span>
          <HStack gap={gap}>
            <Box>One</Box>
            <Box>Two</Box>
            <Box>Three</Box>
          </HStack>
        </VStack>
      ))}
    </VStack>
  ),
};

export const Align: Story = {
  render: () => (
    <VStack gap={5}>
      {(['start', 'center', 'end', 'stretch', 'baseline'] as const).map((align) => (
        <VStack key={align} gap={1}>
          <span style={caption}>align="{align}"</span>
          <HStack align={align} style={{ minHeight: 72, borderBlockEnd: '1px solid var(--tui-rule)' }}>
            <Box>Short</Box>
            <Box style={{ fontSize: 'var(--tui-font-size-h3)' }}>Larger type</Box>
            <Box>Short</Box>
          </HStack>
        </VStack>
      ))}
    </VStack>
  ),
};

export const Justify: Story = {
  render: () => (
    <VStack gap={5}>
      {(['start', 'center', 'end', 'between'] as const).map((justify) => (
        <VStack key={justify} gap={1}>
          <span style={caption}>justify="{justify}"</span>
          <HStack justify={justify}>
            <Box>One</Box>
            <Box>Two</Box>
            <Box>Three</Box>
          </HStack>
        </VStack>
      ))}
    </VStack>
  ),
};

export const Wrap: Story = {
  render: () => (
    <HStack wrap gap={2} style={{ maxWidth: 320 }}>
      {['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju', 'Ulsan', 'Sejong'].map((city) => (
        <Box key={city}>{city}</Box>
      ))}
    </HStack>
  ),
};

export const AsList: Story = {
  render: () => (
    <Stack as="ul" gap={2} aria-label="Checklist">
      <li style={box}>Verify identity</li>
      <li style={box}>Add a payment method</li>
      <li style={box}>Confirm the order</li>
    </Stack>
  ),
};

export const Nested: Story = {
  render: () => (
    <VStack gap={4} style={{ maxWidth: 360 }}>
      <HStack justify="between" align="baseline">
        <strong style={{ color: 'var(--tui-ink)' }}>Order summary</strong>
        <span style={caption}>3 items</span>
      </HStack>
      <VStack gap={2}>
        <HStack justify="between">
          <span style={{ color: 'var(--tui-ink-2)' }}>Subtotal</span>
          <span style={{ color: 'var(--tui-ink)' }}>48,000</span>
        </HStack>
        <HStack justify="between">
          <span style={{ color: 'var(--tui-ink-2)' }}>Shipping</span>
          <span style={{ color: 'var(--tui-ink)' }}>3,000</span>
        </HStack>
      </VStack>
    </VStack>
  ),
};
