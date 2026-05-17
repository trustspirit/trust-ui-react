import { useEffect, type RefObject } from 'react';

export interface UseSwipeOptions {
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  /** Minimum total displacement in pixels to count as a swipe. Default 50. */
  threshold?: number;
  /** Minimum speed in px/ms to count as a swipe. Default 0.3. */
  velocity?: number;
}

/**
 * Attaches touchstart/touchend listeners to detect 4-directional swipes.
 * Threshold + velocity must both be met to fire.
 *
 * SSR-safe — useEffect guards against missing element.
 */
export function useSwipe(
  ref: RefObject<HTMLElement | null>,
  options: UseSwipeOptions,
): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const threshold = options.threshold ?? 50;
    const minVelocity = options.velocity ?? 0.3;

    let startX = 0;
    let startY = 0;
    let startTime = 0;

    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      startX = t.clientX;
      startY = t.clientY;
      startTime = performance.now();
    };

    const onEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const dt = Math.max(performance.now() - startTime, 1);
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (absDx > absDy) {
        // Horizontal
        const v = absDx / dt;
        if (absDx > threshold && v > minVelocity) {
          if (dx > 0) options.onSwipeRight?.();
          else options.onSwipeLeft?.();
        }
      } else {
        // Vertical
        const v = absDy / dt;
        if (absDy > threshold && v > minVelocity) {
          if (dy > 0) options.onSwipeDown?.();
          else options.onSwipeUp?.();
        }
      }
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchend', onEnd);
    };
  }, [
    ref,
    options.onSwipeUp,
    options.onSwipeDown,
    options.onSwipeLeft,
    options.onSwipeRight,
    options.threshold,
    options.velocity,
  ]);
}
