import { useState } from 'react';
import { Expander } from './Expander';

export default {
  title: 'Components/Expander',
  component: Expander,
};

export const Default = () => (
  <div style={{ maxWidth: 600 }}>
    <Expander defaultValue="item-1">
      <Expander.Item value="item-1">
        <Expander.Trigger>What is Trust UI?</Expander.Trigger>
        <Expander.Content>
          Trust UI is a React component library built with TypeScript and CSS Modules.
          It provides a set of reusable, accessible components with design tokens for
          consistent theming.
        </Expander.Content>
      </Expander.Item>
      <Expander.Item value="item-2">
        <Expander.Trigger>How do I install it?</Expander.Trigger>
        <Expander.Content>
          You can install Trust UI using npm or pnpm: <code>pnpm add @trust-ui/react</code>.
          Then import the components you need and wrap your app with ThemeProvider.
        </Expander.Content>
      </Expander.Item>
      <Expander.Item value="item-3">
        <Expander.Trigger>Can I customize the theme?</Expander.Trigger>
        <Expander.Content>
          Yes! Trust UI uses CSS custom properties (--tui-*) for all colors, spacing,
          and typography. You can override these variables to create your own theme.
        </Expander.Content>
      </Expander.Item>
    </Expander>
  </div>
);

export const Multiple = () => (
  <div style={{ maxWidth: 600 }}>
    <Expander type="multiple" defaultValue={['item-1', 'item-3']}>
      <Expander.Item value="item-1">
        <Expander.Trigger>Section 1</Expander.Trigger>
        <Expander.Content>
          Content for section 1. Multiple sections can be open at the same time.
        </Expander.Content>
      </Expander.Item>
      <Expander.Item value="item-2">
        <Expander.Trigger>Section 2</Expander.Trigger>
        <Expander.Content>
          Content for section 2. Click the trigger to expand or collapse.
        </Expander.Content>
      </Expander.Item>
      <Expander.Item value="item-3">
        <Expander.Trigger>Section 3</Expander.Trigger>
        <Expander.Content>
          Content for section 3. This section starts open by default.
        </Expander.Content>
      </Expander.Item>
    </Expander>
  </div>
);

export const Bordered = () => (
  <div style={{ maxWidth: 600 }}>
    <Expander variant="bordered">
      <Expander.Item value="item-1">
        <Expander.Trigger>Getting Started</Expander.Trigger>
        <Expander.Content>
          Follow the quick start guide to set up your project with Trust UI.
        </Expander.Content>
      </Expander.Item>
      <Expander.Item value="item-2">
        <Expander.Trigger>Components</Expander.Trigger>
        <Expander.Content>
          Browse through our extensive list of ready-to-use components.
        </Expander.Content>
      </Expander.Item>
      <Expander.Item value="item-3">
        <Expander.Trigger>Theming</Expander.Trigger>
        <Expander.Content>
          Learn how to customize colors, typography, and spacing.
        </Expander.Content>
      </Expander.Item>
    </Expander>
  </div>
);

export const Separated = () => (
  <div style={{ maxWidth: 600 }}>
    <Expander variant="separated">
      <Expander.Item value="item-1">
        <Expander.Trigger>What payment methods do you accept?</Expander.Trigger>
        <Expander.Content>
          We accept all major credit cards, PayPal, and bank transfers.
        </Expander.Content>
      </Expander.Item>
      <Expander.Item value="item-2">
        <Expander.Trigger>How long does shipping take?</Expander.Trigger>
        <Expander.Content>
          Standard shipping takes 3-5 business days. Express shipping is available
          for 1-2 business day delivery.
        </Expander.Content>
      </Expander.Item>
      <Expander.Item value="item-3">
        <Expander.Trigger>What is your return policy?</Expander.Trigger>
        <Expander.Content>
          We offer a 30-day money-back guarantee on all products. Items must be
          returned in their original condition.
        </Expander.Content>
      </Expander.Item>
    </Expander>
  </div>
);

export const Controlled = () => {
  const [open, setOpen] = useState<string | string[]>('item-2');
  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ marginBottom: 16, fontSize: 12, color: '#666' }}>
        Currently open: {JSON.stringify(open)}
      </div>
      <Expander value={open} onChange={setOpen}>
        <Expander.Item value="item-1">
          <Expander.Trigger>First item</Expander.Trigger>
          <Expander.Content>Content of the first item.</Expander.Content>
        </Expander.Item>
        <Expander.Item value="item-2">
          <Expander.Trigger>Second item</Expander.Trigger>
          <Expander.Content>Content of the second item.</Expander.Content>
        </Expander.Item>
        <Expander.Item value="item-3">
          <Expander.Trigger>Third item</Expander.Trigger>
          <Expander.Content>Content of the third item.</Expander.Content>
        </Expander.Item>
      </Expander>
    </div>
  );
};

export const Disabled = () => (
  <div style={{ maxWidth: 600 }}>
    <Expander variant="bordered">
      <Expander.Item value="item-1">
        <Expander.Trigger>Enabled item</Expander.Trigger>
        <Expander.Content>This item can be expanded and collapsed.</Expander.Content>
      </Expander.Item>
      <Expander.Item value="item-2" disabled>
        <Expander.Trigger>Disabled item</Expander.Trigger>
        <Expander.Content>This content is not accessible.</Expander.Content>
      </Expander.Item>
      <Expander.Item value="item-3">
        <Expander.Trigger>Another enabled item</Expander.Trigger>
        <Expander.Content>This item works normally.</Expander.Content>
      </Expander.Item>
    </Expander>
  </div>
);

export const SingleItem = () => (
  <div style={{ maxWidth: 600 }}>
    <Expander variant="bordered">
      <Expander.Item value="details">
        <Expander.Trigger>Show details</Expander.Trigger>
        <Expander.Content>
          <p style={{ margin: 0 }}>
            Here are some additional details that were hidden by default.
            Click the trigger again to collapse this content.
          </p>
        </Expander.Content>
      </Expander.Item>
    </Expander>
  </div>
);
