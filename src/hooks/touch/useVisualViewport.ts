import { useEffect, useState } from 'react';

export interface VisualViewportState {
  /** Height of the visual viewport in CSS pixels. 0 on server. */
  height: number;
  /** Y offset of the visual viewport (top of viewport from window top). */
  offsetTop: number;
  /** True when on-screen keyboard is likely open (heuristic: window.innerHeight - vv.height > 80px). */
  keyboardOpen: boolean;
}

/**
 * Subscribes to window.visualViewport for keyboard-aware layouts.
 * SSR-safe: returns zeros on server.
 *
 * Browser support: iOS Safari 13+, Chrome 61+, Firefox 91+.
 * In unsupported environments returns initial state (keyboardOpen: false).
 */
export function useVisualViewport(): VisualViewportState {
  const [state, setState] = useState<VisualViewportState>({
    height: 0,
    offsetTop: 0,
    keyboardOpen: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;

    const update = () => {
      const heightDiff = window.innerHeight - vv.height;
      setState({
        height: vv.height,
        offsetTop: vv.offsetTop,
        keyboardOpen: heightDiff > 80,
      });
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return state;
}
