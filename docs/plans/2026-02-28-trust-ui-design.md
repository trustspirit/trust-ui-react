# @trust-ui/react - UI Component Library Design

## Overview

A modern, formal React UI component library published as `@trust-ui/react` on npm. Built with semantic HTML elements, CSS Modules, and CSS custom properties for theming. Supports dark/light mode, multiple variants, and className overrides.

## Tech Stack

- **Framework**: React 18+ with TypeScript
- **Styling**: CSS Modules + CSS Custom Properties
- **Build**: Vite (library mode)
- **Package Manager**: pnpm
- **Documentation**: Storybook
- **Theme**: `data-theme` attribute + CSS variables

## Architecture

Single package, flat export. All components exported from `@trust-ui/react`.

```tsx
import { Button, TextField, ThemeProvider } from '@trust-ui/react';
import '@trust-ui/react/styles';
```

## Project Structure

```
trust-ui/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .storybook/
├── src/
│   ├── index.ts
│   ├── styles/
│   │   ├── tokens.css          # Design tokens (spacing, radius, font)
│   │   ├── theme-light.css     # Light theme colors
│   │   ├── theme-dark.css      # Dark theme colors
│   │   └── reset.css           # Minimal reset
│   ├── components/
│   │   ├── Button/
│   │   ├── Select/
│   │   ├── Checkbox/
│   │   ├── Radio/
│   │   ├── Switch/
│   │   ├── TextField/
│   │   ├── Toast/
│   │   ├── Avatar/
│   │   ├── Badge/
│   │   ├── Chip/
│   │   ├── Table/
│   │   ├── Tooltip/
│   │   ├── Dialog/
│   │   ├── Progress/
│   │   ├── Menu/
│   │   ├── Pagination/
│   │   ├── Tabs/
│   │   ├── Slider/
│   │   ├── DatePicker/
│   │   └── DateRangePicker/
│   ├── hooks/
│   │   ├── useTheme.ts
│   │   └── useToast.ts
│   └── providers/
│       ├── ThemeProvider.tsx
│       └── ToastProvider.tsx
└── dist/
```

## Components (20)

| Component | Semantic Element | Variants |
|-----------|-----------------|----------|
| Button | `<button>` | primary, secondary, outline, ghost, danger |
| Select | custom dropdown + ARIA | primary, secondary |
| Checkbox | `<input type="checkbox">` | primary, secondary |
| Radio | `<input type="radio">` | primary, secondary |
| Switch | `<button role="switch">` | primary, secondary |
| TextField | `<input>` / `<textarea>` | outlined, filled |
| Toast | `<div role="alert">` | success, danger, warning, info |
| Avatar | `<img>` + fallback | circle, square |
| Badge | `<span>` | primary, secondary, success, danger, warning |
| Chip | `<span>` | filled, outlined |
| Table | `<table>` | default, striped, bordered |
| Tooltip | `<div role="tooltip">` | light, dark |
| Dialog | `<dialog>` | default, fullscreen |
| Progress | `<progress>` | primary, secondary |
| Menu | `<menu>` + `<ul>` | default |
| Pagination | `<nav>` | default, simple |
| Tabs | `<div role="tablist">` | default, pill |
| Slider | `<input type="range">` | primary, secondary |
| DatePicker | `<input>` + calendar popup | outlined, filled |
| DateRangePicker | `<input>` + calendar popup | outlined, filled |

## Common Props

All components accept:
- `className?: string` — CSS class override
- `style?: React.CSSProperties` — inline style override
- `variant` — visual variant (component-specific)
- `size?: 'sm' | 'md' | 'lg'` — size variant

## Design Tokens

CSS Custom Properties with `--tui-` prefix:
- Colors: `--tui-primary`, `--tui-secondary`, `--tui-text`, `--tui-bg`, etc.
- Spacing: `--tui-spacing-xs` through `--tui-spacing-xl`
- Radius: `--tui-radius-sm` through `--tui-radius-lg`
- Typography: `--tui-font-family`, `--tui-font-size-*`
- Transitions: `--tui-transition`

## Theme System

- Light/Dark via `[data-theme="light"]` / `[data-theme="dark"]`
- `ThemeProvider` component for React context integration
- `useTheme()` hook for programmatic theme access
- Respects `prefers-color-scheme` as default

## TextField Auto-Formatting

- `type="tel"` → `010-1234-5678` format
- `type="number"` + `format="currency"` → `1,234,567`
- `type="number"` + `format="decimal"` → decimal formatting
- Formatting via input event handling, raw value accessible via `onValueChange`

## DatePicker / DateRangePicker

- Pure implementation, no external date library dependency
- Calendar popup with month/year navigation
- Locale support (ko-KR default)
- DateRangePicker supports start/end date selection with visual range highlight
- Keyboard navigation support

## Build Output

- ESM (`dist/index.es.js`) + CJS (`dist/index.cjs.js`)
- TypeScript declarations (`dist/index.d.ts`)
- CSS bundle (`dist/styles.css`)
- peerDependencies: `react >= 18`, `react-dom >= 18`

## Package Exports

```json
{
  "name": "@trust-ui/react",
  "exports": {
    ".": {
      "import": "./dist/index.es.js",
      "require": "./dist/index.cjs.js",
      "types": "./dist/index.d.ts"
    },
    "./styles": "./dist/styles.css"
  }
}
```
