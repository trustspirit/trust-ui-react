import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Pagination } from './Pagination';

const meta: Meta<typeof Pagination> = {
  title: 'Navigation/Pagination',
  component: Pagination,
  decorators: [
    (Story) => (
      <div style={{ padding: 24 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Pagination>;

function PaginationExample({
  totalPages = 10,
  ...props
}: Partial<React.ComponentProps<typeof Pagination>> & { totalPages?: number }) {
  const [page, setPage] = useState(1);
  return (
    <Pagination
      totalPages={totalPages}
      currentPage={page}
      onChange={setPage}
      {...props}
    />
  );
}

export const Default: Story = {
  render: () => <PaginationExample totalPages={10} />,
};

export const Simple: Story = {
  render: () => <PaginationExample totalPages={10} variant="simple" />,
};

export const ManyPages: Story = {
  render: () => <PaginationExample totalPages={100} />,
};

export const FewPages: Story = {
  render: () => <PaginationExample totalPages={3} />,
};

export const Disabled: Story = {
  render: () => <PaginationExample totalPages={10} disabled />,
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <p style={{ margin: '0 0 8px', color: 'var(--tui-text-secondary)' }}>Small</p>
        <PaginationExample totalPages={10} size="sm" />
      </div>
      <div>
        <p style={{ margin: '0 0 8px', color: 'var(--tui-text-secondary)' }}>Medium (default)</p>
        <PaginationExample totalPages={10} size="md" />
      </div>
      <div>
        <p style={{ margin: '0 0 8px', color: 'var(--tui-text-secondary)' }}>Large</p>
        <PaginationExample totalPages={10} size="lg" />
      </div>
    </div>
  ),
};
