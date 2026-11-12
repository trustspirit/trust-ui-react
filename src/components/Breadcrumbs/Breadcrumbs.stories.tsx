import type { Meta, StoryObj } from '@storybook/react';
import { Breadcrumbs } from './Breadcrumbs';

const meta: Meta = {
  title: 'Navigation/Breadcrumbs',
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
    <Breadcrumbs>
      <Breadcrumbs.Item href="#home">Home</Breadcrumbs.Item>
      <Breadcrumbs.Item href="#accounts">Accounts</Breadcrumbs.Item>
      <Breadcrumbs.Item>Savings</Breadcrumbs.Item>
    </Breadcrumbs>
  ),
};

export const CustomSeparator: Story = {
  render: () => (
    <Breadcrumbs separator="›">
      <Breadcrumbs.Item href="#home">Home</Breadcrumbs.Item>
      <Breadcrumbs.Item href="#accounts">Accounts</Breadcrumbs.Item>
      <Breadcrumbs.Item>Savings</Breadcrumbs.Item>
    </Breadcrumbs>
  ),
};

export const Collapsed: Story = {
  render: () => (
    <Breadcrumbs maxItems={3}>
      <Breadcrumbs.Item href="#home">Home</Breadcrumbs.Item>
      <Breadcrumbs.Item href="#accounts">Accounts</Breadcrumbs.Item>
      <Breadcrumbs.Item href="#savings">Savings</Breadcrumbs.Item>
      <Breadcrumbs.Item href="#transactions">Transactions</Breadcrumbs.Item>
      <Breadcrumbs.Item href="#november">November</Breadcrumbs.Item>
      <Breadcrumbs.Item>Transfer to brokerage</Breadcrumbs.Item>
    </Breadcrumbs>
  ),
};

export const WithButtons: Story = {
  render: () => (
    <Breadcrumbs>
      <Breadcrumbs.Item onClick={() => console.log('Home')}>Home</Breadcrumbs.Item>
      <Breadcrumbs.Item onClick={() => console.log('Accounts')}>Accounts</Breadcrumbs.Item>
      <Breadcrumbs.Item>Savings</Breadcrumbs.Item>
    </Breadcrumbs>
  ),
};

/** 320px 폭: 가로로 넘치지 않고 줄을 바꾼다. */
export const Narrow: Story = {
  render: () => (
    <div style={{ width: 272, border: '1px dashed var(--tui-rule)' }}>
      <Breadcrumbs>
        <Breadcrumbs.Item href="#home">Home</Breadcrumbs.Item>
        <Breadcrumbs.Item href="#accounts">Accounts and cards</Breadcrumbs.Item>
        <Breadcrumbs.Item href="#savings">High-yield savings</Breadcrumbs.Item>
        <Breadcrumbs.Item>Transaction history for November</Breadcrumbs.Item>
      </Breadcrumbs>
    </div>
  ),
};
