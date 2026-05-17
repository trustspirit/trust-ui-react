import { createContext, useCallback, useContext, type ReactNode } from 'react';

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const DEFAULT_PATTERNS: Record<HapticType, number | number[]> = {
  light: 8,
  medium: 14,
  heavy: 20,
  success: [10, 30, 10],
  warning: [20, 40, 20],
  error: [30, 60, 30, 60, 30],
};

export interface HapticContextValue {
  trigger: (type: HapticType) => void;
}

const HapticContext = createContext<HapticContextValue | null>(null);

/**
 * Provider for haptic feedback. By default uses navigator.vibrate (Android-only
 * — iOS Safari does not support Vibration API). Wrap your app with this
 * provider to override the behavior — for example, when running inside a
 * native WebView container that exposes a JS bridge to the OS haptic engine.
 *
 * Example native-bridge override:
 *
 *   <HapticProvider trigger={(type) => window.NativeBridge?.haptic(type)}>
 *     <App />
 *   </HapticProvider>
 */
export const HapticProvider = ({
  children,
  trigger,
}: {
  children: ReactNode;
  trigger?: (type: HapticType) => void;
}) => {
  const value: HapticContextValue = {
    trigger:
      trigger ??
      ((type) => {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          const pattern = DEFAULT_PATTERNS[type];
          // navigator.vibrate may throw if disabled by user setting
          try {
            navigator.vibrate(pattern);
          } catch {
            /* silent fail */
          }
        }
      }),
  };
  return <HapticContext.Provider value={value}>{children}</HapticContext.Provider>;
};

/**
 * Returns a haptic trigger function. Best-effort — works on Android Chrome
 * (Vibration API), no-op on iOS Safari unless a HapticProvider with a custom
 * trigger is mounted higher in the tree.
 */
export function useHaptic(): (type: HapticType) => void {
  const ctx = useContext(HapticContext);
  return useCallback(
    (type: HapticType = 'light') => {
      if (ctx) {
        ctx.trigger(type);
        return;
      }
      // No provider — fall back to Vibration API directly
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        const pattern = DEFAULT_PATTERNS[type];
        try {
          navigator.vibrate(pattern);
        } catch {
          /* silent fail */
        }
      }
    },
    [ctx],
  );
}
