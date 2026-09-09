import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useDrag } from '../../hooks/touch/useDrag';
import { useSnapPoints } from '../../hooks/touch/useSnapPoints';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { acquireScrollLock, releaseScrollLock } from '../../utils/scrollLock';
import styles from './BottomSheet.module.css';

// inert 는 대부분의 최신 브라우저(크롬 102+, 사파리 15.5+, 파이어폭스 112+)에
// 있지만, 이 값은 모듈 로드 시 한 번만 확인해 매 마운트마다 다시 묻지 않는다.
// 없으면 aria-hidden 으로 물러난다 — 이땐 스크린리더에게만 배경을 숨길 뿐
// 키보드 포커스는 막지 못하므로, 키보드 격리는 전적으로 useFocusTrap 이 진다.
const SUPPORTS_INERT =
  typeof HTMLElement !== 'undefined' && 'inert' in HTMLElement.prototype;

/**
 * document.body 의 직계 자식 중 이 시트가 아닌 것들을 비활성화한다.
 * 이미 inert(또는 aria-hidden) 였던 요소는 각자 원래 속성 유무·값을 스냅샷해
 * 두었다가 그대로 되돌린다 — 다른 오버레이가 걸어둔 상태를 지우지 않는다.
 */
function inertifySiblings(exclude: (Element | null)[]): () => void {
  if (typeof document === 'undefined') return () => {};

  const attr = SUPPORTS_INERT ? 'inert' : 'aria-hidden';
  const siblings = Array.from(document.body.children).filter(
    (el) => !exclude.includes(el),
  );
  const snapshots = siblings.map((el) => ({
    el,
    hadAttr: el.hasAttribute(attr),
    prevValue: el.getAttribute(attr),
  }));

  siblings.forEach((el) => {
    el.setAttribute(attr, SUPPORTS_INERT ? '' : 'true');
  });

  return () => {
    snapshots.forEach(({ el, hadAttr, prevValue }) => {
      if (hadAttr) {
        el.setAttribute(attr, prevValue!);
      } else {
        el.removeAttribute(attr);
      }
    });
  };
}

export interface BottomSheetProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onClose'> {
  /** Whether the sheet is open. Controlled. */
  open: boolean;
  /** Called when the sheet should close (backdrop tap, swipe-down, ESC, or out-of-range drag). */
  onClose: () => void;
  /**
   * Snap points as fractions of viewport height. Sheet height = max(snapPoints) × 100vh.
   * Default `[0.5]` (single fixed height).
   */
  snapPoints?: number[];
  /** Index into snapPoints when the sheet opens. Default 0. */
  initialSnap?: number;
  /** Show drag handle. Default true. */
  showHandle?: boolean;
  /** Allow swipe-down to dismiss. Default true. */
  dismissible?: boolean;
  /** Sheet content. */
  children?: ReactNode;
}

/**
 * Mobile-first bottom sheet with drag-to-snap, swipe-to-dismiss, opaque sheet surface.
 * Renders via Portal at document.body. Honors --tui-z-bottom-sheet token.
 *
 * `role="dialog" aria-modal="true"` is backed by real behavior: while open, focus is
 * trapped inside the sheet (initial focus, Tab/Shift+Tab wrapping, restore-on-close via
 * `useFocusTrap`) and the rest of `document.body` is made `inert` (or `aria-hidden` as a
 * fallback where `inert` is unsupported — keyboard isolation then relies on the focus
 * trap alone). Elements that were already inert/aria-hidden for an unrelated reason are
 * left exactly as they were when the sheet closes.
 *
 * Mount the sheet element only when `open` is true — entry animation runs on mount.
 * On close, the parent should set `open={false}` and the exit animation plays before
 * the element unmounts.
 */
export const BottomSheet = forwardRef<HTMLDivElement, BottomSheetProps>(
  function BottomSheet(
    {
      open,
      onClose,
      snapPoints = [0.5],
      initialSnap = 0,
      showHandle = true,
      dismissible = true,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    const sheetRef = useRef<HTMLDivElement | null>(null);
    const backdropRef = useRef<HTMLDivElement | null>(null);
    const handleRef = useRef<HTMLDivElement | null>(null);
    const [exiting, setExiting] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [currentSnapIdx, setCurrentSnapIdx] = useState(initialSnap);
    const [isDragging, setIsDragging] = useState(false);
    // dragDelta is held in a ref + applied directly to the DOM to avoid
    // re-rendering BottomSheet (and all children) on every pointermove.
    const dragDeltaRef = useRef(0);
    const viewportHeightRef = useRef(typeof window !== 'undefined' ? window.innerHeight : 0);

    // Mount / unmount with exit animation
    useEffect(() => {
      if (open) {
        setExiting(false);
        setMounted(true);
        setCurrentSnapIdx(initialSnap);
        dragDeltaRef.current = 0;
      } else if (mounted) {
        setExiting(true);
        const t = setTimeout(() => {
          setMounted(false);
          setExiting(false);
        }, 280);
        return () => clearTimeout(t);
      }
    }, [open, initialSnap, mounted]);

    // Clamp currentSnapIdx whenever snapPoints shrinks
    useEffect(() => {
      setCurrentSnapIdx((prev) => Math.min(prev, snapPoints.length - 1));
    }, [snapPoints]);

    // Track viewport height (only while mounted — saves a permanent listener)
    useEffect(() => {
      if (!mounted || typeof window === 'undefined') return;
      const update = () => {
        viewportHeightRef.current = window.innerHeight;
      };
      update();
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }, [mounted]);

    // Body scroll lock — uses ref-counted shared utility so nested sheets/dialogs cooperate
    useEffect(() => {
      if (!mounted) return;
      acquireScrollLock();
      return () => releaseScrollLock();
    }, [mounted]);

    // ESC dismiss
    useEffect(() => {
      if (!mounted) return;
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }, [mounted, onClose]);

    // 배경 비활성화 — 시트가 DOM 에 떠 있는 동안(퇴장 애니메이션 포함)
    // document.body 의 이 시트 아닌 형제 요소들을 inert(또는 대체 수단)로
    // 만든다.
    //
    // 아래 useFocusTrap 보다 반드시 먼저 선언한다 — 같은 `mounted` 의존성이
    // false 로 바뀌는 같은 커밋에서 두 effect 의 클린업이 모두 실행되는데,
    // React 는 클린업을 effect 를 "선언한" 순서 그대로(위→아래) 실행한다.
    // 만약 포커스 트랩 클린업(직전 포커스로 focus() 호출)이 먼저 실행되면,
    // 그 시점엔 트리거 버튼이 아직 이 effect 가 건 inert 조상 아래에 있어
    // focus() 가 조용히 실패한다(inert 요소는 포커스 대상이 아니므로) —
    // 그러면 포커스가 복구되지 않고 body 로 떨어진다. 이 순서를 바꾸면 그
    // 버그가 재현된다.
    useEffect(() => {
      if (!mounted || typeof document === 'undefined') return;
      return inertifySiblings([backdropRef.current, sheetRef.current]);
    }, [mounted]);

    // 포커스 트랩 — aria-modal="true" 를 실제로 참으로 만드는 부분.
    // `mounted` 를 기준으로 삼는다: `open` 은 닫히기 시작하는 순간 바로
    // false 가 되지만 시트는 퇴장 애니메이션 동안(280ms) 여전히 DOM 에 남아
    // 있다(`mounted` 가 그 기간 내내 true). `open` 을 그대로 쓰면 열릴 때도
    // 문제가 생긴다 — sheetRef 는 `mounted` 가 true 로 바뀌어 포털이 실제로
    // 렌더된 다음 렌더에서만 채워지는데, 그 시점에 `open` 값 자체는 이미
    // 바뀌지 않은 채라 훅의 effect 가 다시 실행되지 않는다. `mounted` 는
    // 정확히 그 렌더에서 false→true 로 바뀌므로 이 타이밍 문제가 없다.
    useFocusTrap(sheetRef, mounted);

    // Drag is meaningful only if there's somewhere to drag to:
    // dismissible (drag-down to close) or multiple snap points (drag between them).
    const dragEnabled = dismissible || snapPoints.length > 1;

    // Snap math
    const { findTarget } = useSnapPoints({ points: snapPoints, flingThreshold: 0.5 });

    // Static (non-drag) translate computation — used for snap rest position
    const maxSnap = Math.max(...snapPoints);
    const sheetHeightVh = maxSnap * 100;
    const currentSnap = snapPoints[currentSnapIdx] ?? snapPoints[0];
    const hiddenFraction = maxSnap - currentSnap;
    const baseTranslateY = hiddenFraction * (viewportHeightRef.current || 0);

    const applySheetTransform = useCallback((deltaPx: number) => {
      if (sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${baseTranslateY + deltaPx}px)`;
      }
    }, [baseTranslateY]);

    const onDragStart = useCallback(() => {
      setIsDragging(true);
    }, []);

    const onDragMove = useCallback(
      (offset: { x: number; y: number }) => {
        const max = Math.max(...snapPoints);
        const cur = snapPoints[currentSnapIdx];
        const vh = viewportHeightRef.current || 1;
        const minOffsetUpward = -((max - cur) * vh);
        const delta = Math.max(offset.y, minOffsetUpward);
        dragDeltaRef.current = delta;
        applySheetTransform(delta);
      },
      [snapPoints, currentSnapIdx, applySheetTransform],
    );

    const onDragEnd = useCallback(
      (_offset: { x: number; y: number }, velocity: { x: number; y: number }) => {
        setIsDragging(false);
        const vh = viewportHeightRef.current || 1;
        const currentFraction = snapPoints[currentSnapIdx] - dragDeltaRef.current / vh;
        // Velocity sign: downward drag is positive y; for snap math we want
        // "upward" (toward bigger snap) as positive, so negate.
        const result = findTarget(currentFraction, -velocity.y * 1000);

        const smallestSnap = Math.min(...snapPoints);
        const dismissThreshold = smallestSnap * 0.6;
        if (dismissible && result.target < dismissThreshold) {
          onClose();
          dragDeltaRef.current = 0;
          return;
        }
        const newIdx = snapPoints.indexOf(result.target);
        if (newIdx >= 0) setCurrentSnapIdx(newIdx);
        dragDeltaRef.current = 0;
        // Reset inline transform so the rendered baseTranslateY (with new snap) takes over via CSS transition
        if (sheetRef.current) {
          sheetRef.current.style.transform = '';
        }
      },
      [snapPoints, currentSnapIdx, findTarget, dismissible, onClose],
    );

    useDrag(handleRef, {
      axis: 'y',
      onDragStart,
      onDrag: onDragMove,
      onDragEnd,
    });

    if (!mounted || typeof document === 'undefined') return null;

    const sheetClassName = [
      styles.sheet,
      !isDragging && styles.sheetAnimating,
      exiting && styles.sheetExit,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return createPortal(
      <>
        <div
          ref={backdropRef}
          className={[styles.backdrop, exiting && styles.backdropExit].filter(Boolean).join(' ')}
          onClick={onClose}
          aria-hidden="true"
        />
        <div
          ref={(node) => {
            sheetRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }}
          className={sheetClassName}
          style={{
            height: `${sheetHeightVh}vh`,
            transform: `translateY(${baseTranslateY}px)`,
          }}
          role="dialog"
          aria-modal="true"
          // 내용에 포커스 가능 요소가 하나도 없을 때도 useFocusTrap 이 이
          // 컨테이너 자신에 포커스를 줄 수 있도록 항상 포커스 가능하게 만든다.
          // -1 이라 Tab 순서에는 들어가지 않는다.
          tabIndex={-1}
          {...rest}
        >
          {dragEnabled && (
            <div ref={handleRef} className={styles.handle}>
              {showHandle && <div className={styles.handleBar} />}
            </div>
          )}
          <div className={styles.content}>{children}</div>
        </div>
      </>,
      document.body,
    );
  },
);
