import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react';
import styles from './Dialog.module.css';
import { BottomSheet } from '../BottomSheet';
import { acquireScrollLock, releaseScrollLock } from '../../utils/scrollLock';

/* ── Context ── */

interface DialogContextValue {
  /** id that Dialog.Title puts on its heading, so the dialog can be named by it. */
  titleId: string;
  /** The dialog's own close handler, used by the title's close button by default. */
  onClose: () => void;
  /** Dialog.Title reports that it is mounted. Returns an unregister function. */
  registerTitle: () => () => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

/** Shared by both renderings (native dialog and sheet): title wiring. */
function useDialogTitle(onClose: () => void) {
  const titleId = `${useId()}-title`;
  const [titleCount, setTitleCount] = useState(0);
  const registerTitle = useCallback(() => {
    setTitleCount((n) => n + 1);
    return () => setTitleCount((n) => n - 1);
  }, []);
  const context = useMemo(
    () => ({ titleId, onClose, registerTitle }),
    [titleId, onClose, registerTitle],
  );
  return { context, labelledBy: titleCount > 0 ? titleId : undefined };
}

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
  /** Accessible name. Not needed when a `Dialog.Title` is rendered. */
  'aria-label'?: string;
  /** Id of the element naming the dialog. Overrides the `Dialog.Title` wiring. */
  'aria-labelledby'?: string;
  /** Dialog content */
  children: ReactNode;
}

type DialogInnerProps = Omit<DialogProps, 'mobileVariant'> & {
  mobileVariant: 'modal' | 'fullscreen';
};

/* ── Sheet rendering (mobileVariant='sheet') ── */

function DialogSheet({
  open,
  onClose,
  closeOnBackdrop = true,
  closeOnEscape = true,
  className,
  style,
  children,
  ...aria
}: Omit<DialogProps, 'mobileVariant' | 'size'>) {
  const { context, labelledBy } = useDialogTitle(onClose);
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      snapPoints={[0.85]}
      showHandle={false}
      closeOnBackdrop={closeOnBackdrop}
      closeOnEscape={closeOnEscape}
      className={className}
      style={style}
      aria-label={aria['aria-label']}
      aria-labelledby={aria['aria-labelledby'] ?? (aria['aria-label'] ? undefined : labelledBy)}
    >
      <DialogContext.Provider value={context}>{children}</DialogContext.Provider>
    </BottomSheet>
  );
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
      ...aria
    },
    ref,
  ) => {
    // Render as BottomSheet when mobileVariant='sheet'
    if (mobileVariant === 'sheet') {
      return (
        <DialogSheet
          open={open}
          onClose={onClose}
          closeOnBackdrop={closeOnBackdrop}
          closeOnEscape={closeOnEscape}
          className={className}
          style={style}
          {...aria}
        >
          {children}
        </DialogSheet>
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
        {...aria}
      >
        {children}
      </DialogInner>
    );
  },
);

DialogRoot.displayName = 'Dialog';

/* ── DialogInner (non-sheet rendering) ── */

const DialogInner = forwardRef<HTMLDialogElement, DialogInnerProps>(
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
      ...aria
    },
    ref,
  ) => {
    const internalRef = useRef<HTMLDialogElement>(null);
    const { context, labelledBy } = useDialogTitle(onClose);
    // open prop 이 false 로 바뀌어 우리가 직접 close() 를 부르는 중인지.
    const closingFromProp = useRef(false);
    // 백드롭 클릭 판정용: 누르기 시작한 곳도 백드롭이어야 한다.
    const pressStartedOnBackdrop = useRef(false);

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
          closingFromProp.current = true;
          dialog.close();
          closingFromProp.current = false;
        }
      }
    }, [open]);

    // 열려 있는 동안 뒤 페이지가 스크롤되지 않게 한다. 시트와 같은 참조 계수 잠금을 쓴다.
    useEffect(() => {
      if (!open) return;
      acquireScrollLock();
      return () => releaseScrollLock();
    }, [open]);

    // 브라우저가 스스로 닫은 경우(<form method="dialog"> 제출 등) 부모 상태가
    // open=true 로 남아 다시 열 수 없게 된다. 닫혔다고 알린다.
    const handleNativeClose = useCallback(() => {
      if (closingFromProp.current) return;
      onClose();
    }, [onClose]);

    // Escape: 브라우저의 기본 닫힘은 항상 막고 상태를 거쳐서만 닫는다.
    // 그래야 부모가 onClose 를 무시하는 경우에도 open prop 과 화면이 어긋나지 않는다.
    const handleCancel = useCallback(
      (e: React.SyntheticEvent<HTMLDialogElement>) => {
        e.preventDefault();
        if (closeOnEscape) onClose();
      },
      [closeOnEscape, onClose],
    );

    const handleMouseDown = useCallback((e: MouseEvent<HTMLDialogElement>) => {
      pressStartedOnBackdrop.current = e.target === e.currentTarget;
    }, []);

    const handleBackdropClick = useCallback(
      (e: MouseEvent<HTMLDialogElement>) => {
        const startedOnBackdrop = pressStartedOnBackdrop.current;
        pressStartedOnBackdrop.current = false;
        if (!closeOnBackdrop) return;
        // 안에서 시작한 텍스트 드래그를 백드롭에서 놓은 것은 닫으려는 뜻이 아니다.
        if (e.target === e.currentTarget && startedOnBackdrop) {
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
        aria-label={aria['aria-label']}
        aria-labelledby={aria['aria-labelledby'] ?? (aria['aria-label'] ? undefined : labelledBy)}
        onCancel={handleCancel}
        onClose={handleNativeClose}
        onMouseDown={handleMouseDown}
        onClick={handleBackdropClick}
      >
        <DialogContext.Provider value={context}>
          <div className={styles.inner}>{children}</div>
        </DialogContext.Provider>
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
  id,
  ...rest
}: DialogTitleProps) {
  const classNames = [styles.title, className].filter(Boolean).join(' ');
  const dialog = useContext(DialogContext);
  const registerTitle = dialog?.registerTitle;

  // 제목이 있다는 것을 다이얼로그에 알려 aria-labelledby 로 이름을 붙이게 한다.
  // 호출자가 id 를 직접 줬다면 그 연결은 호출자 몫이다.
  useEffect(() => {
    if (id || !registerTitle) return;
    return registerTitle();
  }, [id, registerTitle]);

  return (
    <div className={styles.titleBar}>
      <h2 className={classNames} id={id ?? dialog?.titleId} {...rest}>
        {children}
      </h2>
      {showClose && (
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose ?? dialog?.onClose}
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
