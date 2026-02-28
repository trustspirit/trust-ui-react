import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { FileUpload } from './FileUpload';
import type { FileUploadFile } from './types';

const meta: Meta<typeof FileUpload> = {
  title: 'Components/FileUpload',
  component: FileUpload,
  argTypes: {
    variant: { control: 'select', options: ['area', 'inline'] },
    listType: { control: 'select', options: ['list', 'grid'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    multiple: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<typeof FileUpload>;

export const Default: Story = {
  args: {
    placeholder: 'Drag files here or click to browse',
  },
};

export const Inline: Story = {
  args: {
    variant: 'inline',
  },
};

export const WithFileList: Story = {
  render: () => {
    const files: FileUploadFile[] = [
      { id: '1', name: 'photo.jpg', size: 1258000, type: 'image/jpeg', status: 'success' },
      { id: '2', name: 'document.pdf', size: 3400000, type: 'application/pdf', status: 'uploading', progress: 65 },
      { id: '3', name: 'data.csv', size: 512000, type: 'text/csv', status: 'error', error: 'Upload failed' },
      { id: '4', name: 'report.xlsx', size: 2048000, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', status: 'pending' },
    ];
    return (
      <FileUpload
        fileList={files}
        multiple
        onRemove={(f) => console.log('remove', f)}
      />
    );
  },
};

export const GridPreview: Story = {
  render: () => {
    const [files, setFiles] = useState<FileUploadFile[]>([]);
    const handleFilesChange = (newFiles: File[]) => {
      const uploadFiles: FileUploadFile[] = newFiles.map((f, i) => ({
        id: `${Date.now()}-${i}`,
        name: f.name,
        size: f.size,
        type: f.type,
        status: 'pending' as const,
        file: f,
      }));
      setFiles((prev) => [...prev, ...uploadFiles]);
    };
    return (
      <FileUpload
        multiple
        accept="image/*,.pdf"
        listType="grid"
        fileList={files}
        onFilesChange={handleFilesChange}
        onRemove={(f) => setFiles((prev) => prev.filter((p) => p.id !== f.id))}
      />
    );
  },
};

export const WithValidation: Story = {
  render: () => {
    const [files, setFiles] = useState<FileUploadFile[]>([]);
    return (
      <FileUpload
        multiple
        maxFiles={3}
        maxFileSize={5 * 1024 * 1024}
        accept="image/*,.pdf"
        fileList={files}
        onFilesChange={(newFiles) => {
          const uploadFiles = newFiles.map((f, i) => ({
            id: `${Date.now()}-${i}`,
            name: f.name,
            size: f.size,
            type: f.type,
            status: 'pending' as const,
            file: f,
          }));
          setFiles((prev) => [...prev, ...uploadFiles]);
        }}
        onRemove={(f) => setFiles((prev) => prev.filter((p) => p.id !== f.id))}
        onValidationError={(errors) => alert(errors.map((e) => e.message).join('\n'))}
      />
    );
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <FileUpload size="sm" placeholder="Small" />
      <FileUpload size="md" placeholder="Medium (default)" />
      <FileUpload size="lg" placeholder="Large" />
    </div>
  ),
};
