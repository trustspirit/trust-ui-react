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
    const [mounted, setMounted] = useState(open);
    const [currentSnapIdx, setCurrentSnapIdx] = useState(initialSnap);
    const [dragDelta, setDragDelta] = useState(0); // current drag in px (positive = down)
    const [isDragging, setIsDragging] = useState(false);
    const viewportHeightRef = useRef(typeof window !== 'undefined' ? window.innerHeight : 0);

    // Mount / unmount with exit animation
    useEffect(() => {
      if (open) {
        setExiting(false);
        setMounted(true);
        setCurrentSnapIdx(initialSnap);
        setDragDelta(0);
      } else if (mounted) {
        setExiting(true);
        const t = window.setTimeout(() => {
          setMounted(false);
          setExiting(false);
        }, 280);
        return () => window.clearTimeout(t);
      }
    }, [open, initialSnap, mounted]);

    // Track viewport height
    useEffect(() => {
      if (typeof window === 'undefined') return;
      const update = () => {
        viewportHeightRef.current = window.innerHeight;
      };
      update();
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }, []);

    // Body scroll lock while open
    useEffect(() => {
      if (!mounted) return;
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
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

    // Snap math
    const { findTarget } = useSnapPoints({ points: snapPoints, flingThreshold: 0.5 });

    const onDragMove = useCallback((offset: { x: number; y: number }) => {
      setIsDragging(true);
      // Only allow downward drag past current snap (positive y) and upward drag toward next snap
      const max = Math.max(...snapPoints);
      const cur = snapPoints[currentSnapIdx];
      const vh = viewportHeightRef.current || 1;
      // Limit upward drag to not exceed max snap; allow downward drag unbounded for dismiss math.
      const minOffsetUpward = -((max - cur) * vh); // negative = drag up
      setDragDelta(Math.max(offset.y, minOffsetUpward));
    }, [snapPoints, currentSnapIdx]);

    const onDragEnd = useCallback(
      (_offset: { x: number; y: number }, velocity: { x: number; y: number }) => {
        setIsDragging(false);
        const vh = viewportHeightRef.current || 1;
        const currentFraction = snapPoints[currentSnapIdx] - dragDelta / vh;
        // Velocity sign: downward drag is positive y, but for snap math we want the "upward" direction as positive
        // (i.e., toward a higher snap). So negate.
        const result = findTarget(currentFraction, -velocity.y * 1000);

        // Dismiss check: if landed below smallest snap (or below dismissThreshold), close
        const smallestSnap = Math.min(...snapPoints);
        const dismissThreshold = smallestSnap * 0.6;
        if (dismissible && result.target < dismissThreshold) {
          onClose();
          setDragDelta(0);
          return;
        }
        // Snap to target
        const newIdx = snapPoints.indexOf(result.target);
        if (newIdx >= 0) setCurrentSnapIdx(newIdx);
        setDragDelta(0);
      },
      [snapPoints, currentSnapIdx, dragDelta, findTarget, dismissible, onClose],
    );

    useDrag(handleRef, {
      axis: 'y',
      onDrag: onDragMove,
      onDragEnd,
    });

    // Compute translateY based on snap + drag
    const vh = viewportHeightRef.current || (typeof window !== 'undefined' ? window.innerHeight : 0);
    const maxSnap = Math.max(...snapPoints);
    const sheetHeightVh = maxSnap * 100;
    const currentSnap = snapPoints[currentSnapIdx] ?? snapPoints[0];
    const hiddenFraction = maxSnap - currentSnap; // 0..maxSnap
    const baseTranslateY = hiddenFraction * vh; // px
    const translateY = baseTranslateY + dragDelta;

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
            transform: `translateY(${translateY}px)`,
          }}
          role="dialog"
          aria-modal="true"
          {...rest}
        >
          {showHandle && (
            <div ref={handleRef} className={styles.handle}>
              <div className={styles.handleBar} />
            </div>
          )}
          <div className={styles.content}>{children}</div>
        </div>
      </>,
      document.body,
    );
  },
);
