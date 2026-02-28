import type { FileUploadFile } from './types';
import { formatFileSize } from './utils';
import { FileIcon, CheckCircleIcon, AlertCircleIcon, CloseIcon } from './icons';
import styles from './FileUpload.module.css';

interface FileUploadFileItemProps {
  file: FileUploadFile;
  onRemove?: (file: FileUploadFile) => void;
  disabled?: boolean;
}

export function FileUploadFileItem({
  file,
  onRemove,
  disabled,
}: FileUploadFileItemProps) {
  const isError = file.status === 'error';
  const isSuccess = file.status === 'success';
  const isUploading = file.status === 'uploading';

  const classNames = [
    styles.fileItem,
    isError ? styles.fileItemError : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames}>
      <span className={styles.fileItemIcon}>
        <FileIcon />
      </span>

      <span className={styles.fileItemName} title={file.name}>
        {file.name}
      </span>

      <span className={styles.fileItemSize}>
        {formatFileSize(file.size)}
      </span>

      <span className={styles.fileItemMeta}>
        {isUploading && (
          <progress
            className={styles.fileItemProgress}
            value={file.progress ?? 0}
            max={100}
            aria-label={`Uploading ${file.name}: ${file.progress ?? 0}%`}
          />
        )}

        {isSuccess && (
          <span className={styles.statusSuccess}>
            <CheckCircleIcon />
          </span>
        )}

        {isError && (
          <span className={styles.statusError}>
            <AlertCircleIcon />
            {file.error && <span>{file.error}</span>}
          </span>
        )}
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
  );
}
