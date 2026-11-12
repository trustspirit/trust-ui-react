import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Stepper } from './Stepper';

const meta: Meta = {
  title: 'Navigation/Stepper',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ padding: 24 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Stepper activeStep={1}>
      <Stepper.Step label="Cart" />
      <Stepper.Step label="Shipping" />
      <Stepper.Step label="Payment" />
      <Stepper.Step label="Review" />
    </Stepper>
  ),
};

export const WithDescriptions: Story = {
  render: () => (
    <Stepper activeStep={2}>
      <Stepper.Step label="Identity" description="Name and date of birth" />
      <Stepper.Step label="Documents" description="Photo ID" />
      <Stepper.Step label="Bank account" description="For deposits and withdrawals" />
      <Stepper.Step label="Risk profile" description="Six questions" optional />
    </Stepper>
  ),
};

export const Vertical: Story = {
  render: () => (
    <Stepper activeStep={1} orientation="vertical">
      <Stepper.Step label="Identity" description="Name and date of birth" />
      <Stepper.Step label="Documents" description="Photo ID" />
      <Stepper.Step label="Bank account" description="For deposits and withdrawals" />
    </Stepper>
  ),
};

export const WithError: Story = {
  render: () => (
    <Stepper activeStep={2}>
      <Stepper.Step label="Cart" />
      <Stepper.Step label="Shipping" description="Address could not be verified" error />
      <Stepper.Step label="Payment" />
      <Stepper.Step label="Review" />
    </Stepper>
  ),
};

export const Clickable: Story = {
  render: function ClickableStory() {
    const [active, setActive] = useState(1);
    return (
      <Stepper activeStep={active} onStepClick={setActive}>
        <Stepper.Step label="Cart" />
        <Stepper.Step label="Shipping" />
        <Stepper.Step label="Payment" />
        <Stepper.Step label="Review" disabled />
      </Stepper>
    );
  },
};

export const AllComplete: Story = {
  render: () => (
    <Stepper activeStep={3}>
      <Stepper.Step label="Cart" />
      <Stepper.Step label="Shipping" />
      <Stepper.Step label="Payment" />
    </Stepper>
  ),
};

/** 폭이 모자라면(단계당 112px 미만) 요약 한 줄과 구간 트랙으로 접힌다. */
export const Compact: Story = {
  render: function CompactStory() {
    const [active, setActive] = useState(1);
    return (
      <div style={{ width: 288 }}>
        <Stepper activeStep={active} onStepClick={setActive}>
          <Stepper.Step label="Cart" />
          <Stepper.Step label="Shipping" />
          <Stepper.Step label="Payment" />
          <Stepper.Step label="Review" />
          <Stepper.Step label="Done" />
        </Stepper>
      </div>
    );
  },
};
