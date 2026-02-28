export interface FileUploadFile {
  id: string;
  name: string;
  size: number;
  type: string;
  progress?: number;
  status?: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  file?: File;
}

export type ValidationErrorType = 'file-too-large' | 'file-invalid-type' | 'too-many-files';

export interface ValidationError {
  file: File;
  type: ValidationErrorType;
  message: string;
}

export interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxFileSize?: number;
  fileList?: FileUploadFile[];
  disabled?: boolean;
  onFilesChange?: (files: File[]) => void;
  onRemove?: (file: FileUploadFile) => void;
  onValidationError?: (errors: ValidationError[]) => void;
  variant?: 'area' | 'inline';
  listType?: 'list' | 'grid';
  size?: 'sm' | 'md' | 'lg';
  placeholder?: string;
  browseText?: string;
  renderPreview?: (file: FileUploadFile) => React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
