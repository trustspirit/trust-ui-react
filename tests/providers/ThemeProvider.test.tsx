// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '../../src/providers/ThemeProvider';
import { useTheme } from '../../src/hooks/useTheme';

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
