import { useEffect, useState } from 'react';

/**
 * Detects if the user is on a touch-primary device via media query.
 * Returns true on phones/tablets (coarse pointer), false on desktops with mouse.
 *
 * SSR-safe: returns false on server, updates on mount.
 */
export function useTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(pointer: coarse)');
    setIsTouch(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    if ('addEventListener' in mq) {
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
    // Safari < 14 fallback (deprecated API)
    const legacyMq = mq as unknown as {
      addListener: (fn: (e: MediaQueryListEvent) => void) => void;
      removeListener: (fn: (e: MediaQueryListEvent) => void) => void;
    };
    legacyMq.addListener(handler);
    return () => legacyMq.removeListener(handler);
  }, []);

  return isTouch;
}
