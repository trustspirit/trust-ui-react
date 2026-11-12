import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { acquireScrollLock, releaseScrollLock } from '../../utils/scrollLock';
import { acquireBackgroundInert, releaseBackgroundInert } from '../../utils/backgroundInert';
import styles from './Drawer.module.css';

/** 퇴장 애니메이션 길이(ms). CSS 의 --tui-duration-base(200ms) 와 맞춘다. */
const EXIT_DURATION = 200;

// 열려 있는 드로어를 연 순서대로 쌓는다. Escape 는 맨 위 드로어만 닫는다.
const openDrawers: symbol[] = [];

/** 드로어 안에서 연 네이티브 모달 dialog 가 떠 있는가. 있다면 Escape 는 그쪽 몫이다. */
function hasModalDialogOnTop(): boolean {
  try {
    return document.querySelector('dialog:modal') !== null;
  } catch {
    return false; // :modal 을 모르는 환경
  }
}

export interface DrawerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Whether the drawer is open. Controlled. */
  open: boolean;
  /** Called when the drawer should close (close button, backdrop, Escape). */
  onClose: () => void;
  /** Edge the drawer is attached to. Logical: 'end' is the right edge in LTR and the left edge in RTL. Default 'end'. */
  side?: 'start' | 'end';
  /** Panel width; a number is treated as px. Never wider than the viewport, and full width below 640px. Default 400. */
  width?: number | string;
  /** Title. Renders a header with the title and a close button, and names the drawer. */
  title?: ReactNode;
  /** Accessible name when there is no `title`. */
  'aria-label'?: string;
  /** Close when the backdrop is clicked. Default true. */
  closeOnBackdrop?: boolean;
  /** Close when Escape is pressed. Default true. */
  closeOnEscape?: boolean;
  /** Accessible label of the close button. Default 'Close'. */
  closeLabel?: string;
  /** Drawer content. Scrolls when it does not fit. */
  children?: ReactNode;
  /** Footer pinned to the bottom of the panel (actions). Honours the bottom safe area. */
  footer?: ReactNode;
}

/**
 * Full-height modal side panel. Portaled to `document.body`.
 *
 * `role="dialog" aria-modal="true"` 는 실제 동작으로 뒷받침된다: 포커스 트랩(useFocusTrap),
 * 스크롤 잠금, 배경 inert. 셋 다 BottomSheet 와 같은 참조 카운트 유틸을 쓰므로 드로어 위에
 * 시트나 다른 드로어가 겹쳐 열려도 서로의 잠금을 풀지 않는다.
 */
export const Drawer = forwardRef<HTMLDivElement, DrawerProps>(function Drawer(
  {
    open,
    onClose,
    side = 'end',
    width = 400,
    title,
    closeOnBackdrop = true,
    closeOnEscape = true,
    closeLabel = 'Close',
    children,
    footer,
    className,
    style,
    ...rest
  },
  ref,
) {
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [exiting, setExiting] = useState(false);
  const titleId = useId();

  // 퇴장 애니메이션 동안 DOM 에 남긴다(BottomSheet 와 같은 방식).
  useEffect(() => {
    if (open) {
      setExiting(false);
      setMounted(true);
    } else if (mounted) {
      setExiting(true);
      const timer = setTimeout(() => {
        setMounted(false);
        setExiting(false);
      }, EXIT_DURATION);
      return () => clearTimeout(timer);
    }
  }, [open, mounted]);

  useEffect(() => {
    if (!mounted) return;
    acquireScrollLock();
    return () => releaseScrollLock();
  }, [mounted]);

  // Escape. document 가 아니라 body 에서 듣는다: BottomSheet 는 document 에서 듣고 드로어의
  // 존재를 모른다. 시트 위에 드로어가 열렸을 때 여기서 먼저 처리하고 preventDefault 해 두면,
  // 뒤이어 실행되는 시트의 리스너가 defaultPrevented 를 보고 물러난다. 안쪽 위젯의 React
  // 핸들러는 루트 컨테이너·포털 컨테이너에서 이보다 먼저 실행되므로 그쪽이 우선한다.
  useEffect(() => {
    if (!mounted) return;
    const token = Symbol('drawer');
    openDrawers.push(token);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !closeOnEscape) return;
      // 안쪽 위젯(열린 Select, Popover 등)이 이미 이 Escape 를 썼다.
      if (e.defaultPrevented) return;
      if (openDrawers[openDrawers.length - 1] !== token) return;
      if (hasModalDialogOnTop()) return;
      // 반대 경우 — 드로어 위에 시트가 열려 있으면 포커스는 그 시트에 갇혀 있다.
      // 포커스가 이 드로어 밖(다른 모달 안)에 있으면 그 Escape 는 이 드로어의 것이 아니다.
      const active = document.activeElement;
      const otherModal = active?.closest('[role="dialog"][aria-modal="true"]');
      if (otherModal && otherModal !== drawerRef.current) return;
      e.preventDefault();
      onClose();
    };
    document.body.addEventListener('keydown', onKey);
    return () => {
      document.body.removeEventListener('keydown', onKey);
      const index = openDrawers.indexOf(token);
      if (index >= 0) openDrawers.splice(index, 1);
    };
  }, [mounted, onClose, closeOnEscape]);

  // 배경 비활성화 — useFocusTrap 보다 반드시 먼저 선언한다. 같은 커밋에서 클린업은 선언
  // 순서대로 실행되는데, 포커스 복구가 inert 해제보다 먼저 일어나면 아직 inert 인 트리거에
  // focus() 가 조용히 실패한다(BottomSheet.tsx 의 같은 주석 참고).
  useEffect(() => {
    if (!mounted || typeof document === 'undefined') return;
    acquireBackgroundInert([backdropRef.current, drawerRef.current]);
    return () => releaseBackgroundInert();
  }, [mounted]);

  // `open` 이 아니라 `mounted` 기준: 포털이 실제로 렌더된 뒤에야 ref 가 채워지고,
  // 퇴장 중에도 화면에 남아 있는 동안은 포커스가 안에 머무는 편이 낫다.
  useFocusTrap(drawerRef, mounted);

  if (!mounted || typeof document === 'undefined') return null;

  const hasTitle = title !== undefined && title !== null && title !== false;

  const drawerClassName = [
    styles.drawer,
    side === 'start' ? styles.start : styles.end,
    exiting && styles.exiting,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const drawerStyle = {
    ...style,
    '--tui-drawer-width': typeof width === 'number' ? `${width}px` : width,
  } as CSSProperties;

  return createPortal(
    <>
      <div
        ref={backdropRef}
        className={[styles.backdrop, exiting && styles.backdropExiting].filter(Boolean).join(' ')}
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
        data-tui-drawer-backdrop=""
      />
      <div
        ref={(node) => {
          drawerRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={hasTitle ? titleId : undefined}
        {...rest}
        className={drawerClassName}
        style={drawerStyle}
        // {...rest} 뒤에 둔다 — 포커스 가능한 내용이 없을 때 useFocusTrap 이 컨테이너
        // 자신에 포커스를 줄 수 있어야 한다. -1 이라 Tab 순서에는 들어가지 않는다.
        tabIndex={-1}
      >
        {hasTitle && (
          <div className={styles.header}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            <button type="button" className={styles.closeButton} aria-label={closeLabel} onClick={onClose}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M3 3l10 10M13 3L3 13" />
              </svg>
            </button>
          </div>
        )}
        <div className={[styles.body, !footer && styles.bodyLast].filter(Boolean).join(' ')}>
          {children}
        </div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </>,
    document.body,
  );
});

Drawer.displayName = 'Drawer';
