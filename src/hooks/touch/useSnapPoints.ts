import { useCallback } from 'react';

export interface UseSnapPointsOptions {
  /** Sorted ascending or unsorted — hook will sort internally. Values are caller's chosen unit (px, %, etc.). */
  points: number[];
  /** Optional minimum velocity to "fling" to the next/prev point instead of snapping to nearest. Unit: same as values per ms. */
  flingThreshold?: number;
}

export interface SnapResult {
  /** The point to snap to. */
  target: number;
  /** Whether a fling decision was made (velocity exceeded flingThreshold). */
  fling: boolean;
}

/**
 * Given a current value and a list of snap points, returns the snap target.
 * Optionally factors in velocity (a "fling") to jump one slot in the direction
 * of the fling instead of snapping to nearest.
 *
 * This hook is stateless — it just returns a function. Caller drives state.
 */
export function useSnapPoints({ points, flingThreshold = 0.5 }: UseSnapPointsOptions) {
  const findTarget = useCallback(
    (current: number, velocity = 0): SnapResult => {
      if (points.length === 0) return { target: current, fling: false };
      const sorted = [...points].sort((a, b) => a - b);

      // Nearest point baseline
      let nearest = sorted[0];
      let minDistance = Math.abs(current - nearest);
      for (const p of sorted) {
        const d = Math.abs(current - p);
        if (d < minDistance) {
          minDistance = d;
          nearest = p;
        }
      }

      // Fling override: if velocity exceeds threshold, jump one slot in that direction
      if (Math.abs(velocity) >= flingThreshold) {
        const idx = sorted.indexOf(nearest);
        if (velocity > 0 && idx < sorted.length - 1) {
          return { target: sorted[idx + 1], fling: true };
        }
        if (velocity < 0 && idx > 0) {
          return { target: sorted[idx - 1], fling: true };
        }
      }

      return { target: nearest, fling: false };
    },
    [points, flingThreshold],
  );

  return { findTarget };
}
