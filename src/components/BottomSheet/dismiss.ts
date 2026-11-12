/**
 * Fling threshold, in viewport-heights per second. A release faster than this
 * counts as a deliberate flick rather than a slow drag.
 */
export const FLING_THRESHOLD = 0.5;

export interface DismissInput {
  /** Visible fraction of the viewport at release (0 = fully off-screen). */
  currentFraction: number;
  /** Smallest configured snap point. */
  smallestSnap: number;
  /** Release velocity in viewport-heights per second. Positive = upward (growing). */
  velocity: number;
}

/**
 * Decides whether releasing the sheet here should close it.
 *
 * Two ways to dismiss:
 * - dragged well below the smallest snap (less than 60% of it still visible), or
 * - flicked downward while already at or below the smallest snap.
 *
 * A downward flick from a taller snap only steps down one snap; it never closes.
 */
export function shouldDismiss({ currentFraction, smallestSnap, velocity }: DismissInput): boolean {
  if (currentFraction < smallestSnap * 0.6) return true;
  return velocity <= -FLING_THRESHOLD && currentFraction <= smallestSnap;
}
