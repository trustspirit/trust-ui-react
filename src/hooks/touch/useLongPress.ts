import { useEffect, type RefObject } from 'react';

export interface UseLongPressOptions {
  /** Hold duration in ms before firing. Default 500. */
  delay?: number;
  /** Max pointer movement in pixels before canceling. Default 10. */
  threshold?: number;
}

/**
 * Fires `callback` after holding touch/pointer for `delay` ms.
 * Cancels if the pointer moves > threshold pixels or is released early.
 *
 * Common use cases: context menu, tooltip-on-longpress, drag handle activation.
 */
export function useLongPress(
  ref: RefObject<HTMLElement | null>,
  callback: () => void,
  options: UseLongPressOptions = {},
): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const delay = options.delay ?? 500;
    const threshold = options.threshold ?? 10;

    let timer: number | null = null;
    let startX = 0;
    let startY = 0;
    let activeId: number | null = null;

    const clear = () => {
      if (timer != null) {
        window.clearTimeout(timer);
        timer = null;
      }
      activeId = null;
    };

    const onPointerDown = (e: PointerEvent) => {
      // Only track primary pointer
      if (activeId != null) return;
      activeId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      timer = window.setTimeout(() => {
        callback();
        timer = null;
      }, delay);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (activeId !== e.pointerId) return;
      const dx = Math.abs(e.clientX - startX);
      const dy = Math.abs(e.clientY - startY);
      if (dx > threshold || dy > threshold) clear();
    };

    const onPointerUp = (e: PointerEvent) => {
      if (activeId !== e.pointerId) return;
      clear();
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
    el.addEventListener('pointerleave', onPointerUp);
    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
      el.removeEventListener('pointerleave', onPointerUp);
      clear();
    };
  }, [ref, callback, options.delay, options.threshold]);
}
