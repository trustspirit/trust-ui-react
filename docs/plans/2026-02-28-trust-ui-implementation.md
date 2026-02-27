# @trust-ui/react Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build and publish `@trust-ui/react`, a modern React UI component library with 20 components, dark/light theming, and npm distribution.

**Architecture:** Single package flat export. CSS Modules for scoped styles, CSS custom properties for theming via `data-theme` attribute. Vite library mode for ESM+CJS build output.

**Tech Stack:** React 18, TypeScript, CSS Modules, Vite, pnpm, Storybook

---

## Phase 1: Project Scaffolding

### Task 1: Initialize project and install dependencies

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.build.json`
- Create: `vite.config.ts`
- Create: `.gitignore`
- Create: `.npmignore`

**Step 1: Initialize pnpm project**

```bash
cd /Users/shinyoung/Workspace/trust-ui
pnpm init
```

**Step 2: Install dependencies**

```bash
pnpm add -D react react-dom @types/react @types/react-dom typescript vite @vitejs/plugin-react vite-plugin-dts vite-plugin-css-injected-by-js
```

**Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationDir": "./dist",
    "outDir": "./dist",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "**/*.stories.tsx"]
}
```

**Step 4: Create vite.config.ts**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      include: ['src'],
      exclude: ['**/*.stories.tsx'],
    }),
  ],
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'TrustUI',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'es' : 'cjs'}.js`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'styles.css';
          return assetInfo.name!;
        },
      },
    },
    cssCodeSplit: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
```

**Step 5: Create .gitignore and .npmignore**

`.gitignore`:
```
node_modules/
dist/
.DS_Store
*.local
```

`.npmignore`:
```
src/
.storybook/
**/*.stories.tsx
docs/
.gitignore
tsconfig.json
vite.config.ts
```

**Step 6: Update package.json with exports**

Key fields to add:
```json
{
  "name": "@trust-ui/react",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.cjs.js",
  "module": "./dist/index.es.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.es.js",
      "require": "./dist/index.cjs.js",
      "types": "./dist/index.d.ts"
    },
    "./styles.css": "./dist/styles.css"
  },
  "files": ["dist"],
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  },
  "scripts": {
    "dev": "storybook dev -p 6006",
    "build": "vite build",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

**Step 7: Commit**

```bash
git add -A
git commit -m "chore: initialize project with vite, typescript, and pnpm"
```

---

### Task 2: Setup Storybook

**Files:**
- Create: `.storybook/main.ts`
- Create: `.storybook/preview.ts`
- Create: `.storybook/preview-head.html`

**Step 1: Install Storybook**

```bash
pnpm add -D @storybook/react-vite @storybook/addon-essentials @storybook/blocks @storybook/react storybook
```

**Step 2: Create .storybook/main.ts**

```ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
};

export default config;
```

**Step 3: Create .storybook/preview.ts**

```ts
import type { Preview } from '@storybook/react';
import '../src/styles/tokens.css';
import '../src/styles/theme-light.css';
import '../src/styles/theme-dark.css';
import '../src/styles/reset.css';

const preview: Preview = {
  parameters: {
    backgrounds: { disable: true },
  },
  globalTypes: {
    theme: {
      description: 'Global theme',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || 'light';
      document.documentElement.setAttribute('data-theme', theme);
      return Story();
    },
  ],
};

export default preview;
```

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: setup storybook with theme switching"
```

---

## Phase 2: Design Tokens & Theme

### Task 3: Create design tokens and theme CSS

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/theme-light.css`
- Create: `src/styles/theme-dark.css`
- Create: `src/styles/reset.css`

**Step 1: Create tokens.css**

```css
:root {
  /* Font */
  --tui-font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --tui-font-size-xs: 0.75rem;
  --tui-font-size-sm: 0.875rem;
  --tui-font-size-md: 1rem;
  --tui-font-size-lg: 1.125rem;
  --tui-font-size-xl: 1.25rem;
  --tui-font-weight-normal: 400;
  --tui-font-weight-medium: 500;
  --tui-font-weight-semibold: 600;
  --tui-font-weight-bold: 700;
  --tui-line-height: 1.5;

  /* Spacing */
  --tui-spacing-xs: 4px;
  --tui-spacing-sm: 8px;
  --tui-spacing-md: 16px;
  --tui-spacing-lg: 24px;
  --tui-spacing-xl: 32px;
  --tui-spacing-2xl: 48px;

  /* Radius */
  --tui-radius-sm: 4px;
  --tui-radius-md: 6px;
  --tui-radius-lg: 8px;
  --tui-radius-xl: 12px;
  --tui-radius-full: 9999px;

  /* Shadows */
  --tui-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --tui-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --tui-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --tui-shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

  /* Transition */
  --tui-transition-fast: 100ms ease;
  --tui-transition: 150ms ease;
  --tui-transition-slow: 300ms ease;

  /* Z-index */
  --tui-z-dropdown: 1000;
  --tui-z-sticky: 1020;
  --tui-z-modal: 1030;
  --tui-z-popover: 1040;
  --tui-z-tooltip: 1050;
  --tui-z-toast: 1060;
}
```

**Step 2: Create theme-light.css**

```css
[data-theme='light'] {
  --tui-bg: #ffffff;
  --tui-bg-subtle: #f8fafc;
  --tui-bg-muted: #f1f5f9;
  --tui-bg-hover: #e2e8f0;

  --tui-text: #0f172a;
  --tui-text-secondary: #475569;
  --tui-text-muted: #94a3b8;
  --tui-text-inverse: #ffffff;

  --tui-border: #e2e8f0;
  --tui-border-hover: #cbd5e1;
  --tui-border-focus: #3b82f6;

  --tui-primary: #2563eb;
  --tui-primary-hover: #1d4ed8;
  --tui-primary-active: #1e40af;
  --tui-primary-subtle: #eff6ff;
  --tui-primary-text: #ffffff;

  --tui-secondary: #475569;
  --tui-secondary-hover: #334155;
  --tui-secondary-active: #1e293b;
  --tui-secondary-subtle: #f1f5f9;
  --tui-secondary-text: #ffffff;

  --tui-success: #16a34a;
  --tui-success-hover: #15803d;
  --tui-success-subtle: #f0fdf4;
  --tui-success-text: #ffffff;

  --tui-danger: #dc2626;
  --tui-danger-hover: #b91c1c;
  --tui-danger-subtle: #fef2f2;
  --tui-danger-text: #ffffff;

  --tui-warning: #d97706;
  --tui-warning-hover: #b45309;
  --tui-warning-subtle: #fffbeb;
  --tui-warning-text: #ffffff;

  --tui-info: #0284c7;
  --tui-info-hover: #0369a1;
  --tui-info-subtle: #f0f9ff;
  --tui-info-text: #ffffff;

  --tui-focus-ring: 0 0 0 2px #ffffff, 0 0 0 4px #3b82f6;

  --tui-overlay: rgba(0, 0, 0, 0.5);
}
```

**Step 3: Create theme-dark.css**

```css
[data-theme='dark'] {
  --tui-bg: #0f172a;
  --tui-bg-subtle: #1e293b;
  --tui-bg-muted: #334155;
  --tui-bg-hover: #475569;

  --tui-text: #f1f5f9;
  --tui-text-secondary: #cbd5e1;
  --tui-text-muted: #64748b;
  --tui-text-inverse: #0f172a;

  --tui-border: #334155;
  --tui-border-hover: #475569;
  --tui-border-focus: #60a5fa;

  --tui-primary: #3b82f6;
  --tui-primary-hover: #60a5fa;
  --tui-primary-active: #93bbfd;
  --tui-primary-subtle: #1e293b;
  --tui-primary-text: #ffffff;

  --tui-secondary: #94a3b8;
  --tui-secondary-hover: #cbd5e1;
  --tui-secondary-active: #e2e8f0;
  --tui-secondary-subtle: #1e293b;
  --tui-secondary-text: #0f172a;

  --tui-success: #22c55e;
  --tui-success-hover: #4ade80;
  --tui-success-subtle: #052e16;
  --tui-success-text: #0f172a;

  --tui-danger: #ef4444;
  --tui-danger-hover: #f87171;
  --tui-danger-subtle: #450a0a;
  --tui-danger-text: #ffffff;

  --tui-warning: #f59e0b;
  --tui-warning-hover: #fbbf24;
  --tui-warning-subtle: #451a03;
  --tui-warning-text: #0f172a;

  --tui-info: #38bdf8;
  --tui-info-hover: #7dd3fc;
  --tui-info-subtle: #0c4a6e;
  --tui-info-text: #0f172a;

  --tui-focus-ring: 0 0 0 2px #0f172a, 0 0 0 4px #60a5fa;

  --tui-overlay: rgba(0, 0, 0, 0.7);
}
```

**Step 4: Create reset.css**

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: var(--tui-font-family);
  line-height: var(--tui-line-height);
  color: var(--tui-text);
  background-color: var(--tui-bg);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add design tokens and light/dark theme CSS"
```

---

### Task 4: Create ThemeProvider and useTheme

**Files:**
- Create: `src/providers/ThemeProvider.tsx`
- Create: `src/hooks/useTheme.ts`
- Create: `src/index.ts`

**Step 1: Create ThemeProvider**

```tsx
import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  defaultTheme?: Theme;
  children: ReactNode;
}

export function ThemeProvider({ defaultTheme, children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (defaultTheme) return defaultTheme;
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    document.documentElement.setAttribute('data-theme', t);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

**Step 2: Create useTheme**

```ts
import { useContext } from 'react';
import { ThemeContext, type ThemeContextValue } from '../providers/ThemeProvider';

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

**Step 3: Create src/index.ts (initial)**

```ts
// Styles
import './styles/tokens.css';
import './styles/theme-light.css';
import './styles/theme-dark.css';
import './styles/reset.css';

// Providers
export { ThemeProvider } from './providers/ThemeProvider';
export type { Theme, ThemeContextValue } from './providers/ThemeProvider';

// Hooks
export { useTheme } from './hooks/useTheme';
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add ThemeProvider and useTheme hook"
```

---

## Phase 3: Basic Components

### Task 5: Button component

**Files:**
- Create: `src/components/Button/Button.tsx`
- Create: `src/components/Button/Button.module.css`
- Create: `src/components/Button/index.ts`
- Create: `src/components/Button/Button.stories.tsx`
- Modify: `src/index.ts` — add Button export

**Implementation:** `<button>` element with variants (primary, secondary, outline, ghost, danger), sizes (sm, md, lg), loading state with spinner, disabled state. `className` prop merges with module class. Icon support via `startIcon`/`endIcon` props.

**Commit:** `feat: add Button component`

---

### Task 6: Badge component

**Files:**
- Create: `src/components/Badge/Badge.tsx`
- Create: `src/components/Badge/Badge.module.css`
- Create: `src/components/Badge/index.ts`
- Create: `src/components/Badge/Badge.stories.tsx`
- Modify: `src/index.ts`

**Implementation:** `<span>` element. Variants: primary, secondary, success, danger, warning, info. Sizes: sm, md. Dot mode (no text, just colored dot).

**Commit:** `feat: add Badge component`

---

### Task 7: Avatar component

**Files:**
- Create: `src/components/Avatar/Avatar.tsx`
- Create: `src/components/Avatar/Avatar.module.css`
- Create: `src/components/Avatar/index.ts`
- Create: `src/components/Avatar/Avatar.stories.tsx`
- Modify: `src/index.ts`

**Implementation:** `<img>` with fallback to initials or icon. Shapes: circle, square. Sizes: sm, md, lg. Error handling for broken images.

**Commit:** `feat: add Avatar component`

---

### Task 8: Chip component

**Files:**
- Create: `src/components/Chip/Chip.tsx`
- Create: `src/components/Chip/Chip.module.css`
- Create: `src/components/Chip/index.ts`
- Create: `src/components/Chip/Chip.stories.tsx`
- Modify: `src/index.ts`

**Implementation:** `<span>` with optional delete button. Variants: filled, outlined. Colors: primary, secondary, success, danger. Clickable and deletable modes.

**Commit:** `feat: add Chip component`

---

### Task 9: Progress component

**Files:**
- Create: `src/components/Progress/Progress.tsx`
- Create: `src/components/Progress/Progress.module.css`
- Create: `src/components/Progress/index.ts`
- Create: `src/components/Progress/Progress.stories.tsx`
- Modify: `src/index.ts`

**Implementation:** `<progress>` semantic element with custom styled overlay. Variants: primary, secondary, success, danger. Sizes: sm, md, lg. Indeterminate mode.

**Commit:** `feat: add Progress component`

---

## Phase 4: Form Components

### Task 10: TextField component

**Files:**
- Create: `src/components/TextField/TextField.tsx`
- Create: `src/components/TextField/TextField.module.css`
- Create: `src/components/TextField/formatters.ts`
- Create: `src/components/TextField/index.ts`
- Create: `src/components/TextField/TextField.stories.tsx`
- Modify: `src/index.ts`

**Implementation:** `<input>` / `<textarea>` with `<label>`. Variants: outlined, filled. Types: text, tel, password, number, email, url, search. Auto-formatting:
- `type="tel"`: format as `010-1234-5678`
- `format="currency"`: format as `1,234,567`
- `format="decimal"`: decimal formatting
- Password visibility toggle
- `onValueChange(rawValue)` callback for unformatted value
- Helper text, error state, character count, prefix/suffix support

**Commit:** `feat: add TextField component with auto-formatting`

---

### Task 11: Checkbox component

**Files:**
- Create: `src/components/Checkbox/Checkbox.tsx`
- Create: `src/components/Checkbox/Checkbox.module.css`
- Create: `src/components/Checkbox/index.ts`
- Create: `src/components/Checkbox/Checkbox.stories.tsx`
- Modify: `src/index.ts`

**Implementation:** `<input type="checkbox">` with custom styled indicator via CSS. Label support. Indeterminate state. Variants: primary, secondary. Disabled state.

**Commit:** `feat: add Checkbox component`

---

### Task 12: Radio component

**Files:**
- Create: `src/components/Radio/Radio.tsx`
- Create: `src/components/Radio/Radio.module.css`
- Create: `src/components/Radio/RadioGroup.tsx`
- Create: `src/components/Radio/index.ts`
- Create: `src/components/Radio/Radio.stories.tsx`
- Modify: `src/index.ts`

**Implementation:** `<input type="radio">` with custom styled indicator. RadioGroup wrapper for managing grouped radios. Variants: primary, secondary. Horizontal/vertical layout.

**Commit:** `feat: add Radio and RadioGroup components`

---

### Task 13: Switch component

**Files:**
- Create: `src/components/Switch/Switch.tsx`
- Create: `src/components/Switch/Switch.module.css`
- Create: `src/components/Switch/index.ts`
- Create: `src/components/Switch/Switch.stories.tsx`
- Modify: `src/index.ts`

**Implementation:** `<button role="switch">` with `aria-checked`. Custom track + thumb CSS. Variants: primary, secondary. Sizes: sm, md, lg. Label support.

**Commit:** `feat: add Switch component`

---

### Task 14: Select component

**Files:**
- Create: `src/components/Select/Select.tsx`
- Create: `src/components/Select/Select.module.css`
- Create: `src/components/Select/index.ts`
- Create: `src/components/Select/Select.stories.tsx`
- Modify: `src/index.ts`

**Implementation:** Custom dropdown (not native `<select>`) with full ARIA: `role="combobox"`, `role="listbox"`, `role="option"`. Keyboard navigation (arrow keys, enter, escape). Searchable/filterable option. Multi-select mode. Placeholder, disabled state, error state. Portal rendering for dropdown to avoid overflow clipping.

**Commit:** `feat: add Select component`

---

### Task 15: Slider component

**Files:**
- Create: `src/components/Slider/Slider.tsx`
- Create: `src/components/Slider/Slider.module.css`
- Create: `src/components/Slider/index.ts`
- Create: `src/components/Slider/Slider.stories.tsx`
- Modify: `src/index.ts`

**Implementation:** `<input type="range">` with custom styled track and thumb via CSS. Min, max, step props. Value label display. Variants: primary, secondary. Disabled state.

**Commit:** `feat: add Slider component`

---

## Phase 5: Overlay & Feedback Components

### Task 16: Toast component and ToastProvider

**Files:**
- Create: `src/components/Toast/Toast.tsx`
- Create: `src/components/Toast/Toast.module.css`
- Create: `src/components/Toast/index.ts`
- Create: `src/components/Toast/Toast.stories.tsx`
- Create: `src/providers/ToastProvider.tsx`
- Create: `src/hooks/useToast.ts`
- Modify: `src/index.ts`

**Implementation:** `<div role="alert">` with auto-dismiss timer. Variants: success, danger, warning, info. Position: top-right (default), top-left, bottom-right, bottom-left, top-center, bottom-center. ToastProvider renders a portal container. `useToast()` returns `{ toast, dismiss, dismissAll }`. Slide-in/out animation via CSS transitions.

**Commit:** `feat: add Toast component with ToastProvider`

---

### Task 17: Tooltip component

**Files:**
- Create: `src/components/Tooltip/Tooltip.tsx`
- Create: `src/components/Tooltip/Tooltip.module.css`
- Create: `src/components/Tooltip/index.ts`
- Create: `src/components/Tooltip/Tooltip.stories.tsx`
- Modify: `src/index.ts`

**Implementation:** CSS-only positioning with `position: absolute` relative to trigger. Placement: top, bottom, left, right. Show on hover/focus with delay. Arrow indicator. Variants: dark (default), light. Max width constraint.

**Commit:** `feat: add Tooltip component`

---

### Task 18: Dialog component

**Files:**
- Create: `src/components/Dialog/Dialog.tsx`
- Create: `src/components/Dialog/Dialog.module.css`
- Create: `src/components/Dialog/index.ts`
- Create: `src/components/Dialog/Dialog.stories.tsx`
- Modify: `src/index.ts`

**Implementation:** Native `<dialog>` element with `.showModal()` / `.close()`. Compound components: `Dialog.Title`, `Dialog.Content`, `Dialog.Actions`. Backdrop click to close. Escape key to close. Focus trap (native dialog behavior). Sizes: sm, md, lg, fullscreen. Transition animation.

**Commit:** `feat: add Dialog component`

---

### Task 19: Menu component

**Files:**
- Create: `src/components/Menu/Menu.tsx`
- Create: `src/components/Menu/Menu.module.css`
- Create: `src/components/Menu/index.ts`
- Create: `src/components/Menu/Menu.stories.tsx`
- Modify: `src/index.ts`

**Implementation:** Compound components: `Menu`, `Menu.Trigger`, `Menu.Content`, `Menu.Item`, `Menu.Divider`. ARIA: `role="menu"`, `role="menuitem"`. Keyboard navigation. Click outside to close. Portal rendering.

**Commit:** `feat: add Menu component`

---

## Phase 6: Data & Navigation Components

### Task 20: Table component

**Files:**
- Create: `src/components/Table/Table.tsx`
- Create: `src/components/Table/Table.module.css`
- Create: `src/components/Table/index.ts`
- Create: `src/components/Table/Table.stories.tsx`
- Modify: `src/index.ts`

**Implementation:** Semantic `<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>`. Column definition via `columns` prop. `data` prop for rows. Sortable columns (click header). Variants: default, striped, bordered. Sticky header option. Empty state. Row hover highlight.

**Commit:** `feat: add Table component`

---

### Task 21: Pagination component

**Files:**
- Create: `src/components/Pagination/Pagination.tsx`
- Create: `src/components/Pagination/Pagination.module.css`
- Create: `src/components/Pagination/index.ts`
- Create: `src/components/Pagination/Pagination.stories.tsx`
- Modify: `src/index.ts`

**Implementation:** `<nav aria-label="pagination">` with page buttons. Props: totalPages, currentPage, onChange, siblingCount. Ellipsis for large page counts. Previous/Next buttons. Variants: default, simple (prev/next only).

**Commit:** `feat: add Pagination component`

---

### Task 22: Tabs component

**Files:**
- Create: `src/components/Tabs/Tabs.tsx`
- Create: `src/components/Tabs/Tabs.module.css`
- Create: `src/components/Tabs/index.ts`
- Create: `src/components/Tabs/Tabs.stories.tsx`
- Modify: `src/index.ts`

**Implementation:** Compound components: `Tabs`, `Tabs.List`, `Tabs.Trigger`, `Tabs.Content`. ARIA: `role="tablist"`, `role="tab"`, `role="tabpanel"`. Keyboard navigation (arrow keys). Variants: default (underline), pill. Controlled and uncontrolled modes.

**Commit:** `feat: add Tabs component`

---

## Phase 7: Date Components

### Task 23: DatePicker component

**Files:**
- Create: `src/components/DatePicker/DatePicker.tsx`
- Create: `src/components/DatePicker/DatePicker.module.css`
- Create: `src/components/DatePicker/Calendar.tsx`
- Create: `src/components/DatePicker/Calendar.module.css`
- Create: `src/components/DatePicker/utils.ts`
- Create: `src/components/DatePicker/index.ts`
- Create: `src/components/DatePicker/DatePicker.stories.tsx`
- Modify: `src/index.ts`

**Implementation:** Text input + calendar popup. Calendar grid with month/year navigation. Date utilities (no external lib): `getDaysInMonth`, `getFirstDayOfMonth`, `formatDate`. Locale support (ko-KR default, `YYYY.MM.DD`). Min/max date constraints. Keyboard navigation in calendar. Click outside to close popup. Variants: outlined, filled.

**Commit:** `feat: add DatePicker component`

---

### Task 24: DateRangePicker component

**Files:**
- Create: `src/components/DateRangePicker/DateRangePicker.tsx`
- Create: `src/components/DateRangePicker/DateRangePicker.module.css`
- Create: `src/components/DateRangePicker/index.ts`
- Create: `src/components/DateRangePicker/DateRangePicker.stories.tsx`
- Modify: `src/index.ts`

**Implementation:** Two-month calendar view. Start/end date selection. Visual range highlight between dates. Hover preview of range. Reuses Calendar from DatePicker. Preset ranges option (e.g., "Last 7 days", "This month"). Variants: outlined, filled.

**Commit:** `feat: add DateRangePicker component`

---

## Phase 8: Final Export & Build

### Task 25: Finalize index.ts exports and verify build

**Files:**
- Modify: `src/index.ts` — ensure all 20 components + providers + hooks exported
- Modify: `package.json` — verify all fields

**Step 1: Update src/index.ts with all exports**

Ensure every component, provider, hook, and type is exported.

**Step 2: Run build**

```bash
pnpm build
```

**Step 3: Verify dist/ output**

Check that `dist/index.es.js`, `dist/index.cjs.js`, `dist/index.d.ts`, and `dist/styles.css` exist.

**Step 4: Test local install**

```bash
mkdir /tmp/test-trust-ui && cd /tmp/test-trust-ui && pnpm init
pnpm add /Users/shinyoung/Workspace/trust-ui
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: finalize all exports and verify build"
```

---

## Execution Notes

- Each task creates one component with its `.tsx`, `.module.css`, `.stories.tsx`, and `index.ts`
- Every component accepts `className` and `style` for overrides
- All CSS uses `--tui-*` custom properties for theming
- Compound components (Dialog, Menu, Tabs) use dot notation: `Component.SubComponent`
- Tasks 5-24 can be parallelized in groups (basic, form, overlay, data, date)
