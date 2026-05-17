import type { Meta, StoryObj } from '@storybook/react';
import { KeyboardAvoidingView } from './KeyboardAvoidingView';
import { TextField } from '../../TextField';

const meta: Meta<typeof KeyboardAvoidingView> = {
  title: 'Layout/KeyboardAvoidingView',
  component: KeyboardAvoidingView,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof KeyboardAvoidingView>;

export const Default: Story = {
  render: () => (
    <KeyboardAvoidingView offset={16} style={{ minHeight: 400, padding: 24 }}>
      <p style={{ color: 'var(--tui-text-secondary)', fontSize: 14 }}>
        Focus the input below on a mobile device — when the on-screen keyboard appears,
        the container shifts up automatically.
      </p>
      <TextField label="Message" placeholder="Type something..." fullWidth />
    </KeyboardAvoidingView>
  ),
};
