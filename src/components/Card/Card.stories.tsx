import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';
import { Badge } from '../Badge';
import { Button } from '../Button';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['outlined', 'filled', 'plain'] },
    padding: { control: 'select', options: ['none', 'sm', 'md', 'lg'] },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

const frame = { maxWidth: 360 } as const;
const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 16,
  maxWidth: 760,
} as const;

/** 네트워크 없이 그려지는 자리표시 그림 — field 면 위의 가는 선 몇 줄. */
const Placeholder = () => (
  <svg
    viewBox="0 0 320 180"
    preserveAspectRatio="xMidYMid slice"
    role="img"
    aria-label="Chart preview"
    style={{ display: 'block', width: '100%', height: '100%', background: 'var(--tui-field)', color: 'var(--tui-ink-3)' }}
  >
    <path d="M0 140 L60 110 L120 124 L180 70 L240 90 L320 40" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M0 160 H320" stroke="currentColor" strokeWidth="1" />
  </svg>
);

export const Default: Story = {
  render: (args) => (
    <div style={frame}>
      <Card {...args}>
        <Card.Header title="Savings account" titleAs="h3" description="Updated a minute ago" />
        <Card.Content>The balance grew by 2.4% since the start of the month.</Card.Content>
        <Card.Footer>
          <Button size="sm" variant="outline">
            Details
          </Button>
          <Button size="sm" variant="ghost">
            Hide
          </Button>
        </Card.Footer>
      </Card>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div style={grid}>
      {(['outlined', 'filled', 'plain'] as const).map((variant) => (
        <Card key={variant} variant={variant}>
          <Card.Header title={variant} description="Surface variant" />
          <Card.Content>Ink on paper, separated by a hairline or a quiet field.</Card.Content>
        </Card>
      ))}
    </div>
  ),
};

export const Padding: Story = {
  render: () => (
    <div style={grid}>
      {(['none', 'sm', 'md', 'lg'] as const).map((padding) => (
        <Card key={padding} padding={padding}>
          <Card.Header title={`padding="${padding}"`} />
          <Card.Content>Header, content and footer share this inset.</Card.Content>
        </Card>
      ))}
    </div>
  ),
};

export const WithMedia: Story = {
  render: () => (
    <div style={frame}>
      <Card as="article">
        <Card.Media aspectRatio="16 / 9">
          <Placeholder />
        </Card.Media>
        <Card.Header
          title="Quarterly report"
          titleAs="h3"
          description="12 pages"
          action={<Badge variant="outline" color="secondary">New</Badge>}
        />
        <Card.Content>Media runs edge to edge whatever the card padding is.</Card.Content>
      </Card>
    </div>
  ),
};

export const LinkCard: Story = {
  render: () => (
    <div style={frame}>
      <Card href="#report">
        <Card.Header title="Quarterly report" titleAs="h3" description="The whole card is one link" />
        <Card.Content>No other controls may sit inside a link card.</Card.Content>
      </Card>
    </div>
  ),
};

export const ButtonCard: Story = {
  render: () => (
    <div style={grid}>
      <Card onClick={() => undefined}>
        <Card.Header title="Add account" description="The whole card is one button" />
      </Card>
      <Card onClick={() => undefined} variant="filled">
        <Card.Header title="Filled" description="Pressed state darkens one step" />
      </Card>
      <Card onClick={() => undefined} disabled>
        <Card.Header title="Disabled" description="Cannot be activated" />
      </Card>
    </div>
  ),
};

export const Stretched: Story = {
  render: () => (
    <div style={frame}>
      <Card interactive="stretched" as="article">
        <Card.Header
          title="Quarterly report"
          titleAs="h3"
          href="#report"
          description="The title is the link; its hit area covers the card"
        />
        <Card.Content>The buttons below stay independently clickable.</Card.Content>
        <Card.Footer>
          <Button size="sm" variant="outline">
            Share
          </Button>
          <Button size="sm" variant="ghost">
            Archive
          </Button>
        </Card.Footer>
      </Card>
    </div>
  ),
};

export const SelectableMultiple: Story = {
  render: () => (
    <div style={grid}>
      <Card selectable name="addons" value="backup" defaultSelected>
        <Card.Header title="Daily backup" description="Keeps 30 days of history" />
      </Card>
      <Card selectable name="addons" value="support">
        <Card.Header title="Priority support" description="Answers within an hour" />
      </Card>
      <Card selectable name="addons" value="audit" disabled>
        <Card.Header title="Audit log" description="Not available on this plan" />
      </Card>
    </div>
  ),
};

function PlanPicker() {
  const [plan, setPlan] = useState('standard');
  const plans = [
    { value: 'basic', title: 'Basic', description: 'One account' },
    { value: 'standard', title: 'Standard', description: 'Five accounts' },
    { value: 'business', title: 'Business', description: 'Unlimited accounts' },
  ];
  return (
    <div role="radiogroup" aria-label="Plan" style={grid}>
      {plans.map((p) => (
        <Card
          key={p.value}
          selectable
          selectionMode="single"
          name="plan"
          value={p.value}
          selected={plan === p.value}
          onSelectedChange={(selected) => selected && setPlan(p.value)}
        >
          <Card.Header title={p.title} description={p.description} />
        </Card>
      ))}
    </div>
  );
}

export const SelectableSingle: Story = {
  render: () => <PlanPicker />,
};
