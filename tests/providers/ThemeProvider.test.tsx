// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '../../src/providers/ThemeProvider';
import { useTheme } from '../../src/hooks/useTheme';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { act } from '@testing-library/react';

function Probe() {
  const { theme, density, market, setDensity, setMarket, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="state">{`${theme}/${density}/${market}`}</span>
      <button onClick={toggleTheme}>theme</button>
      <button onClick={() => setDensity('compact')}>compact</button>
      <button onClick={() => setMarket('us')}>us</button>
    </div>
  );
}

const el = () => document.documentElement;

afterEach(cleanup);

describe('ThemeProvider', () => {
  it('기본값은 comfortable 밀도와 kr 시장이다', () => {
    render(<ThemeProvider defaultTheme="light"><Probe /></ThemeProvider>);
    expect(screen.getByTestId('state').textContent).toBe('light/comfortable/kr');
  });

  it('세 축을 모두 문서 루트 속성으로 반영한다', () => {
    render(<ThemeProvider defaultTheme="dark" defaultDensity="compact" defaultMarket="us"><Probe /></ThemeProvider>);
    expect(el().getAttribute('data-theme')).toBe('dark');
    expect(el().getAttribute('data-density')).toBe('compact');
    expect(el().getAttribute('data-market')).toBe('us');
  });

  it('밀도를 바꿔도 명암 축은 그대로다', async () => {
    render(<ThemeProvider defaultTheme="dark"><Probe /></ThemeProvider>);
    await userEvent.click(screen.getByText('compact'));
    expect(el().getAttribute('data-density')).toBe('compact');
    expect(el().getAttribute('data-theme')).toBe('dark');
  });

  it('시장을 바꿔도 나머지 축은 그대로다', async () => {
    render(<ThemeProvider defaultTheme="light" defaultDensity="compact"><Probe /></ThemeProvider>);
    await userEvent.click(screen.getByText('us'));
    expect(el().getAttribute('data-market')).toBe('us');
    expect(el().getAttribute('data-density')).toBe('compact');
    expect(el().getAttribute('data-theme')).toBe('light');
  });
});

describe('ThemeProvider — 시스템 설정과 서버 렌더', () => {
  /** prefers-color-scheme 을 흉내내고, 나중에 값을 바꿔 change 이벤트를 낼 수 있게 한다. */
  function stubColorScheme(initialDark: boolean) {
    let dark = initialDark;
    const listeners = new Set<() => void>();
    vi.stubGlobal('matchMedia', (query: string) => ({
      get matches() {
        return query.includes('dark') ? dark : false;
      },
      media: query,
      addEventListener: (_: string, fn: () => void) => listeners.add(fn),
      removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
    }));
    return (next: boolean) => {
      dark = next;
      listeners.forEach((fn) => fn());
    };
  }

  function ShowTheme() {
    const { theme, setTheme } = useTheme();
    return (
      <>
        <output>{theme}</output>
        <button onClick={() => setTheme('light')}>라이트로</button>
      </>
    );
  }

  afterEach(() => vi.unstubAllGlobals());

  it('서버에서는 시스템 설정을 알 수 없으므로 light 로 그린다', () => {
    stubColorScheme(true);
    const html = renderToString(
      <ThemeProvider>
        <ShowTheme />
      </ThemeProvider>,
    );
    expect(html).toContain('<output>light</output>');
  });

  it('서버가 그린 light 를 브라우저가 dark 로 이어받아도 하이드레이션 오류가 없다', async () => {
    stubColorScheme(true);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const tree = (
      <ThemeProvider>
        <ShowTheme />
      </ThemeProvider>
    );
    const container = document.createElement('div');
    document.body.appendChild(container);
    container.innerHTML = renderToString(tree);

    await act(async () => {
      hydrateRoot(container, tree);
    });

    expect(container.querySelector('output')!.textContent).toBe('dark');
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
    container.remove();
  });

  it('시스템 설정이 바뀌면 따라가고, 직접 고른 뒤에는 따라가지 않는다', async () => {
    const setSystemDark = stubColorScheme(false);
    render(
      <ThemeProvider>
        <ShowTheme />
      </ThemeProvider>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('light');

    act(() => setSystemDark(true));
    expect(screen.getByRole('status')).toHaveTextContent('dark');

    await userEvent.click(screen.getByRole('button', { name: '라이트로' }));
    act(() => setSystemDark(false));
    act(() => setSystemDark(true));
    expect(screen.getByRole('status')).toHaveTextContent('light');
  });

  it('defaultTheme 을 주면 시스템 설정보다 우선한다', () => {
    stubColorScheme(true);
    render(
      <ThemeProvider defaultTheme="light">
        <ShowTheme />
      </ThemeProvider>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('light');
  });
});
