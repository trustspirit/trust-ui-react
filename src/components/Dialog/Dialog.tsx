import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react';
import styles from './Dialog.module.css';

/* ── Dialog ── */

export interface DialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when the dialog should close */
  onClose: () => void;
  /** Size preset (default: 'md') */
  size?: 'sm' | 'md' | 'lg' | 'fullscreen';
  /** Close when backdrop is clicked (default: true) */
  closeOnBackdrop?: boolean;
  /** Close when Escape key is pressed (default: true) */
  closeOnEscape?: boolean;
  /** Additional CSS class name */
  className?: string;
  /** Additional inline styles */
  style?: CSSProperties;
  /** Dialog content */
  children: ReactNode;
}

const DialogRoot = forwardRef<HTMLDialogElement, DialogProps>(
  (
    {
      open,
      onClose,
      size = 'md',
      closeOnBackdrop = true,
      closeOnEscape = true,
      className,
      style,
      children,
    },
    ref,
  ) => {
    const internalRef = useRef<HTMLDialogElement>(null);
    const dialogRef = (ref as React.RefObject<HTMLDialogElement>) ?? internalRef;

    useEffect(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;

      if (open) {
        if (!dialog.open) {
          dialog.showModal();
        }
      } else {
        if (dialog.open) {
          dialog.close();
        }
      }
    }, [open, dialogRef]);

    const handleCancel = useCallback(
      (e: React.SyntheticEvent<HTMLDialogElement>) => {
        if (!closeOnEscape) {
          e.preventDefault();
        } else {
          onClose();
        }
      },
      [closeOnEscape, onClose],
    );

    const handleBackdropClick = useCallback(
      (e: MouseEvent<HTMLDialogElement>) => {
        if (!closeOnBackdrop) return;
        if (e.target === e.currentTarget) {
          onClose();
        }
      },
      [closeOnBackdrop, onClose],
    );

    const classNames = [
      styles.dialog,
      styles[size],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <dialog
        ref={dialogRef}
        className={classNames}
        style={style}
        onCancel={handleCancel}
        onClick={handleBackdropClick}
      >
        <div className={styles.inner}>{children}</div>
      </dialog>
    );
  },
);

DialogRoot.displayName = 'Dialog';

/* ── Dialog.Title ── */

interface DialogTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Show close button (default: true) */
  showClose?: boolean;
  /** Close handler - called when close button is clicked */
  onClose?: () => void;
  /** Additional CSS class name */
  className?: string;
  /** Children */
  children: ReactNode;
}

function DialogTitle({
  showClose = true,
  onClose,
  className,
  children,
  ...rest
}: DialogTitleProps) {
  const classNames = [styles.title, className].filter(Boolean).join(' ');

  return (
    <div className={styles.titleBar}>
      <h2 className={classNames} {...rest}>
        {children}
      </h2>
      {showClose && (
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close dialog"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      )}
    </div>
  );
}

DialogTitle.displayName = 'Dialog.Title';

/* ── Dialog.Content ── */

interface DialogContentProps extends HTMLAttributes<HTMLDivElement> {
  /** Additional CSS class name */
  className?: string;
  /** Children */
  children: ReactNode;
}

function DialogContent({ className, children, ...rest }: DialogContentProps) {
  const classNames = [styles.content, className].filter(Boolean).join(' ');

  return (
    <div className={classNames} {...rest}>
      {children}
    </div>
  );
}

DialogContent.displayName = 'Dialog.Content';

/* ── Dialog.Actions ── */

interface DialogActionsProps extends HTMLAttributes<HTMLDivElement> {
  /** Additional CSS class name */
  className?: string;
  /** Children */
  children: ReactNode;
}

function DialogActions({ className, children, ...rest }: DialogActionsProps) {
  const classNames = [styles.actions, className].filter(Boolean).join(' ');

  return (
    <div className={classNames} {...rest}>
      {children}
    </div>
  );
}

DialogActions.displayName = 'Dialog.Actions';

/* ── Export as compound component ── */

export const Dialog = Object.assign(DialogRoot, {
  Title: DialogTitle,
  Content: DialogContent,
  Actions: DialogActions,
});
