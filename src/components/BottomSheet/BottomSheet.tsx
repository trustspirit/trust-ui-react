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
import { acquireScrollLock, releaseScrollLock } from '../../utils/scrollLock';
import styles from './BottomSheet.module.css';

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
 * Mobile-first bottom sheet with drag-to-snap, swipe-to-dismiss, glass surface.
 * Renders via Portal at document.body. Honors --tui-z-bottom-sheet token.
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
      'tui-glass',
      !isDragging && styles.sheetAnimating,
      exiting && styles.sheetExit,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return createPortal(
      <>
        <div
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
