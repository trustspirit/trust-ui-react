import { useState, useEffect } from 'react';
import type { FileUploadFile } from './types';
import { formatFileSize } from './utils';
import { FileIcon, CheckCircleIcon, AlertCircleIcon, CloseIcon } from './icons';
import styles from './FileUpload.module.css';

const PREVIEWABLE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface FileUploadGridItemProps {
  file: FileUploadFile;
  onRemove?: (file: FileUploadFile) => void;
  disabled?: boolean;
  renderPreview?: (file: FileUploadFile) => React.ReactNode;
}

export function FileUploadGridItem({
  file,
  onRemove,
  disabled,
  renderPreview,
}: FileUploadGridItemProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const isPreviewable =
    file.file && PREVIEWABLE_TYPES.includes(file.type);
  const isError = file.status === 'error';
  const isSuccess = file.status === 'success';
  const isUploading = file.status === 'uploading';

  useEffect(() => {
    if (!isPreviewable || !file.file) return;

    const url = URL.createObjectURL(file.file);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file.file, isPreviewable]);

  const classNames = [
    styles.gridItem,
    isError ? styles.gridItemError : '',
  ]
    .filter(Boolean)
    .join(' ');

  const renderPreviewContent = () => {
    if (renderPreview) {
      return renderPreview(file);
    }

    if (previewUrl) {
      return (
        <img
          className={styles.gridItemPreviewImage}
          src={previewUrl}
          alt={file.name}
        />
      );
    }

    return (
      <span className={styles.gridItemPreviewIcon}>
        <FileIcon size={32} />
      </span>
    );
  };

  return (
    <div className={classNames}>
      <div className={styles.gridItemPreview}>
        {renderPreviewContent()}
      </div>

      <div className={styles.gridItemFooter}>
        <div className={styles.gridItemFooterRow}>
          <span className={styles.gridItemName} title={file.name}>
            {file.name}
          </span>

          {onRemove && (
            <button
              type="button"
              className={styles.removeButton}
              onClick={() => onRemove(file)}
              disabled={disabled}
              aria-label={`Remove ${file.name}`}
            >
              <CloseIcon />
            </button>
          )}
        </div>

        <div className={styles.gridItemFooterRow}>
          <span className={styles.gridItemSize}>
            {formatFileSize(file.size)}
          </span>

          <span className={styles.gridItemStatus}>
            {isSuccess && (
              <span className={styles.statusSuccess}>
                <CheckCircleIcon />
              </span>
            )}
            {isError && (
              <span className={styles.statusError}>
                <AlertCircleIcon />
              </span>
            )}
          </span>
        </div>

        {isUploading && (
          <progress
            className={styles.gridItemProgress}
            value={file.progress ?? 0}
            max={100}
            aria-label={`Uploading ${file.name}: ${file.progress ?? 0}%`}
          />
        )}
      </div>
    </div>
  );
}
