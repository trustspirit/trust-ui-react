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
import { BottomSheet } from '../BottomSheet';

/* ── Dialog ── */

export interface DialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when the dialog should close */
  onClose: () => void;
  /** Size preset (default: 'md') */
  size?: 'sm' | 'md' | 'lg' | 'fullscreen';
  /**
   * Mobile-specific rendering. 'modal' (default) = centered overlay dialog.
   * 'sheet' = renders as BottomSheet on all viewports (use for action-driven content).
   * 'fullscreen' = full-viewport dialog with safe-area padding.
   */
  mobileVariant?: 'modal' | 'sheet' | 'fullscreen';
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
      mobileVariant = 'modal',
      closeOnBackdrop = true,
      closeOnEscape = true,
      className,
      style,
      children,
    },
    ref,
  ) => {
    // Render as BottomSheet when mobileVariant='sheet'
    if (mobileVariant === 'sheet') {
      return (
        <BottomSheet open={open} onClose={onClose} snapPoints={[0.85]} showHandle={false}>
          {children}
        </BottomSheet>
      );
    }

    return (
      <DialogInner
        ref={ref}
        open={open}
        onClose={onClose}
        size={size}
        mobileVariant={mobileVariant}
        closeOnBackdrop={closeOnBackdrop}
        closeOnEscape={closeOnEscape}
        className={className}
        style={style}
      >
        {children}
      </DialogInner>
    );
  },
);

DialogRoot.displayName = 'Dialog';

/* ── DialogInner (non-sheet rendering) ── */

const DialogInner = forwardRef<HTMLDialogElement, Omit<DialogProps, 'mobileVariant'> & { mobileVariant: 'modal' | 'fullscreen' }>(
  (
    {
      open,
      onClose,
      size = 'md',
      mobileVariant = 'modal',
      closeOnBackdrop = true,
      closeOnEscape = true,
      className,
      style,
      children,
    },
    ref,
  ) => {
    const internalRef = useRef<HTMLDialogElement>(null);

    const mergedRef = useCallback(
      (node: HTMLDialogElement | null) => {
        (internalRef as React.MutableRefObject<HTMLDialogElement | null>).current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLDialogElement | null>).current = node;
        }
      },
      [ref],
    );

    useEffect(() => {
      const dialog = internalRef.current;
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
    }, [open]);

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
      mobileVariant === 'fullscreen' ? styles.mobileFullscreen : styles[size],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <dialog
        ref={mergedRef}
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

DialogInner.displayName = 'DialogInner';

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
