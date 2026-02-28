import { forwardRef, useRef, useState, useCallback } from 'react';
import type { FileUploadProps, ValidationError } from './types';
import { formatFileSize } from './utils';
import { FileUploadFileItem } from './FileUploadFileItem';
import { FileUploadGridItem } from './FileUploadGridItem';
import styles from './FileUpload.module.css';

function UploadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      width="24"
      height="24"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function isAcceptedFile(file: File, accept: string): boolean {
  const acceptedTypes = accept.split(',').map((t) => t.trim());

  for (const type of acceptedTypes) {
    // Extension check (e.g., ".pdf")
    if (type.startsWith('.')) {
      if (file.name.toLowerCase().endsWith(type.toLowerCase())) {
        return true;
      }
    }
    // Wildcard MIME type (e.g., "image/*")
    else if (type.endsWith('/*')) {
      const prefix = type.slice(0, type.indexOf('/'));
      if (file.type.startsWith(prefix + '/')) {
        return true;
      }
    }
    // Exact MIME type match
    else if (file.type === type) {
      return true;
    }
  }

  return false;
}

export const FileUpload = forwardRef<HTMLDivElement, FileUploadProps>(function FileUpload({
  accept,
  multiple = false,
  maxFiles,
  maxFileSize,
  fileList,
  disabled = false,
  onFilesChange,
  onRemove,
  onValidationError,
  variant = 'area',
  listType = 'list',
  size = 'md',
  placeholder,
  browseText = 'browse',
  renderPreview,
  className,
  style,
}: FileUploadProps, ref) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const [isDragOver, setIsDragOver] = useState(false);

  const sizeClass =
    size === 'sm'
      ? styles.dropzoneSm
      : size === 'lg'
        ? styles.dropzoneLg
        : styles.dropzoneMd;

  const validateFiles = useCallback(
    (files: File[]): { valid: File[]; errors: ValidationError[] } => {
      const valid: File[] = [];
      const errors: ValidationError[] = [];

      for (const file of files) {
        // Check accept
        if (accept && !isAcceptedFile(file, accept)) {
          errors.push({
            file,
            type: 'file-invalid-type',
            message: `File type "${file.type || file.name}" is not accepted`,
          });
          continue;
        }

        // Check max file size
        if (maxFileSize && file.size > maxFileSize) {
          errors.push({
            file,
            type: 'file-too-large',
            message: `File "${file.name}" exceeds the maximum size of ${formatFileSize(maxFileSize)}`,
          });
          continue;
        }

        valid.push(file);
      }

      // Check max files
      const currentCount = fileList?.length ?? 0;
      if (maxFiles && currentCount + valid.length > maxFiles) {
        const allowed = Math.max(0, maxFiles - currentCount);
        const finalValid = valid.slice(0, allowed);
        const excess = valid.slice(allowed);
        for (const file of excess) {
          errors.push({
            file,
            type: 'too-many-files',
            message: `Maximum of ${maxFiles} files allowed`,
          });
        }

        return { valid: finalValid, errors };
      }

      return { valid, errors };
    },
    [accept, maxFileSize, maxFiles, fileList],
  );

  const handleFiles = useCallback(
    (files: File[]) => {
      if (disabled) return;

      const { valid, errors } = validateFiles(files);

      if (errors.length > 0 && onValidationError) {
        onValidationError(errors);
      }

      if (valid.length > 0 && onFilesChange) {
        onFilesChange(valid);
      }
    },
    [disabled, validateFiles, onValidationError, onFilesChange],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      handleFiles(files);
      // Reset input value to allow re-selecting the same file
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [handleFiles],
  );

  const openFileDialog = useCallback(() => {
    if (disabled) return;
    inputRef.current?.click();
  }, [disabled]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openFileDialog();
      }
    },
    [openFileDialog],
  );

  const handleDragEnter = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      dragCounterRef.current += 1;
      if (dragCounterRef.current === 1) {
        setIsDragOver(true);
      }
    },
    [disabled],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      dragCounterRef.current -= 1;
      if (dragCounterRef.current === 0) {
        setIsDragOver(false);
      }
    },
    [disabled],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
    },
    [],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragOver(false);
      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    },
    [disabled, handleFiles],
  );

  const dropzoneClassNames = [
    styles.dropzone,
    variant === 'area' ? styles.area : styles.inline,
    sizeClass,
    isDragOver ? styles.dragOver : '',
    disabled ? styles.dropzoneDisabled : '',
  ]
    .filter(Boolean)
    .join(' ');

  const containerClassNames = [styles.container, className ?? '']
    .filter(Boolean)
    .join(' ');

  const defaultPlaceholder =
    variant === 'area'
      ? 'Drag and drop files here, or'
      : 'Drop files here or';

  const displayPlaceholder = placeholder ?? defaultPlaceholder;

  return (
    <div ref={ref} className={containerClassNames} style={style}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        disabled={disabled}
        style={{ display: 'none' }}
        tabIndex={-1}
      />

      <div
        className={dropzoneClassNames}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={openFileDialog}
        onKeyDown={handleKeyDown}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        aria-disabled={disabled}
        aria-label={placeholder || 'Upload files'}
      >
        {variant === 'area' && (
          <span className={styles.uploadIcon}>
            <UploadIcon />
          </span>
        )}

        <span className={styles.dropzoneText}>
          {displayPlaceholder}{' '}
          <span className={styles.browseText}>{browseText}</span>
        </span>
      </div>

      {fileList && fileList.length > 0 && (
        <div
          className={
            listType === 'grid' ? styles.fileListGrid : styles.fileListList
          }
          aria-live="polite"
        >
          {fileList.map((file) =>
            listType === 'grid' ? (
              <FileUploadGridItem
                key={file.id}
                file={file}
                onRemove={onRemove}
                disabled={disabled}
                renderPreview={renderPreview}
              />
            ) : (
              <FileUploadFileItem
                key={file.id}
                file={file}
                onRemove={onRemove}
                disabled={disabled}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
});

FileUpload.displayName = 'FileUpload';
