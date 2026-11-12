import {
  createContext,
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

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

const DARK_QUERY = '(prefers-color-scheme: dark)';

function readSystemTheme(): Theme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

function subscribeToSystemTheme(onChange: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener?.('change', onChange);
  return () => query.removeEventListener?.('change', onChange);
}

export function ThemeProvider({
  defaultTheme,
  defaultDensity = 'comfortable',
  defaultMarket = 'kr',
  children,
}: ThemeProviderProps) {
  // 사용자가 직접 고른 값. 고르기 전에는 null 이고 defaultTheme → 시스템 설정 순으로 따른다.
  const [chosenTheme, setChosenTheme] = useState<Theme | null>(null);
  // 시스템 설정은 외부 저장소로 읽는다. 서버는 알 수 없으므로 'light' 로 그리고,
  // 브라우저는 하이드레이션 뒤 실제 값으로 다시 그린다. useState 초기값에서 직접
  // 읽으면 서버와 브라우저의 첫 렌더가 달라 하이드레이션 불일치가 난다.
  const systemTheme = useSyncExternalStore(subscribeToSystemTheme, readSystemTheme, () => 'light' as Theme);
  const theme = chosenTheme ?? defaultTheme ?? systemTheme;
  const [density, setDensity] = useState<Density>(defaultDensity);
  const [market, setMarket] = useState<Market>(defaultMarket);

  useAxis('data-theme', theme);
  useAxis('data-density', density);
  useAxis('data-market', market);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const setTheme = useCallback((t: Theme) => setChosenTheme(t), []);
  const toggleTheme = useCallback(
    () => setChosenTheme(theme === 'light' ? 'dark' : 'light'),
    [theme],
  );

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, toggleTheme, density, setDensity, market, setMarket }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
