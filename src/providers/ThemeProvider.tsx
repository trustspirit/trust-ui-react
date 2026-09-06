import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';
export type Density = 'compact' | 'comfortable';
export type Market = 'kr' | 'us';

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  density: Density;
  setDensity: (density: Density) => void;
  market: Market;
  setMarket: (market: Market) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  defaultTheme?: Theme;
  defaultDensity?: Density;
  defaultMarket?: Market;
  children: ReactNode;
}

/** 문서 루트에 축 하나를 반영한다. SSR 에서는 아무것도 하지 않는다. */
function useAxis(attribute: string, value: string) {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute(attribute, value);
  }, [attribute, value]);
}

export function ThemeProvider({
  defaultTheme,
  defaultDensity = 'comfortable',
  defaultMarket = 'kr',
  children,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (defaultTheme) return defaultTheme;
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });
  const [density, setDensity] = useState<Density>(defaultDensity);
  const [market, setMarket] = useState<Market>(defaultMarket);

  useAxis('data-theme', theme);
  useAxis('data-density', density);
  useAxis('data-market', market);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggleTheme = useCallback(
    () => setThemeState((t) => (t === 'light' ? 'dark' : 'light')),
    [],
  );

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, toggleTheme, density, setDensity, market, setMarket }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
