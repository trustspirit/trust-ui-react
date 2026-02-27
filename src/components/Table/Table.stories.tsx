import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Table } from './Table';
import { Badge } from '../Badge';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  age: number;
}

const sampleData: User[] = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin', status: 'active', age: 32 },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'Editor', status: 'active', age: 28 },
  { id: 3, name: 'Carol White', email: 'carol@example.com', role: 'Viewer', status: 'inactive', age: 45 },
  { id: 4, name: 'David Brown', email: 'david@example.com', role: 'Editor', status: 'active', age: 36 },
  { id: 5, name: 'Eve Davis', email: 'eve@example.com', role: 'Admin', status: 'inactive', age: 29 },
];

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' },
  { key: 'role', header: 'Role' },
  { key: 'status', header: 'Status' },
];

const meta: Meta = {
  title: 'Data/Table',
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
    <Table<User>
      columns={columns}
      data={sampleData}
      rowKey="id"
    />
  ),
};

export const Striped: Story = {
  render: () => (
    <Table<User>
      columns={columns}
      data={sampleData}
      variant="striped"
      rowKey="id"
    />
  ),
};

export const Bordered: Story = {
  render: () => (
    <Table<User>
      columns={columns}
      data={sampleData}
      variant="bordered"
      rowKey="id"
    />
  ),
};

export const Sortable: Story = {
  render: () => (
    <Table<User>
      columns={[
        { key: 'name', header: 'Name', sortable: true },
        { key: 'email', header: 'Email', sortable: true },
        { key: 'role', header: 'Role', sortable: true },
        { key: 'age', header: 'Age', sortable: true, align: 'right' },
      ]}
      data={sampleData}
      rowKey="id"
    />
  ),
};

const manyRows: User[] = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: ['Admin', 'Editor', 'Viewer'][i % 3],
  status: i % 3 === 0 ? 'inactive' : 'active',
  age: 20 + (i % 40),
}));

export const StickyHeader: Story = {
  render: () => (
    <div style={{ height: 300, overflow: 'auto' }}>
      <Table<User>
        columns={[
          { key: 'name', header: 'Name', sortable: true },
          { key: 'email', header: 'Email' },
          { key: 'role', header: 'Role' },
          { key: 'age', header: 'Age', align: 'right' },
        ]}
        data={manyRows}
        stickyHeader
        rowKey="id"
      />
    </div>
  ),
};

export const EmptyState: Story = {
  render: () => (
    <Table<User>
      columns={columns}
      data={[]}
      emptyText="No users found. Try adjusting your filters."
    />
  ),
};

export const CustomRender: Story = {
  render: () => (
    <Table<User>
      columns={[
        { key: 'name', header: 'Name' },
        { key: 'email', header: 'Email' },
        { key: 'role', header: 'Role' },
        {
          key: 'status',
          header: 'Status',
          render: (value: string) => (
            <Badge variant={value === 'active' ? 'success' : 'secondary'}>
              {value}
            </Badge>
          ),
        },
      ]}
      data={sampleData}
      rowKey="id"
    />
  ),
};

export const RowClick: Story = {
  render: () => {
    function RowClickExample() {
      const [selected, setSelected] = useState<string | null>(null);
      return (
        <div>
          <p style={{ marginBottom: 12, color: 'var(--tui-text-secondary)' }}>
            Clicked: {selected ?? 'none'}
          </p>
          <Table<User>
            columns={columns}
            data={sampleData}
            onRowClick={(row) => setSelected(row.name)}
            rowKey="id"
          />
        </div>
      );
    }
    return <RowClickExample />;
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div>
        <h4 style={{ margin: '0 0 8px' }}>Small</h4>
        <Table<User> columns={columns} data={sampleData.slice(0, 3)} size="sm" rowKey="id" />
      </div>
      <div>
        <h4 style={{ margin: '0 0 8px' }}>Medium (default)</h4>
        <Table<User> columns={columns} data={sampleData.slice(0, 3)} size="md" rowKey="id" />
      </div>
      <div>
        <h4 style={{ margin: '0 0 8px' }}>Large</h4>
        <Table<User> columns={columns} data={sampleData.slice(0, 3)} size="lg" rowKey="id" />
      </div>
    </div>
  ),
};
