# trust-ui-react

A lightweight, themeable React UI component library built with TypeScript and CSS Modules.

`trust-ui-react` provides 30 production-ready components with built-in dark/light mode support, CSS Custom Properties for easy theming, and full TypeScript type definitions. Every component is designed with accessibility in mind and follows consistent API patterns.

**[Documentation & Live Examples](https://trustspirit.github.io/trust-ui-react/)**

---

## Features

- **30 ready-to-use components** -- buttons, forms, file upload, data display, dialogs, date pickers, mobile primitives, and more
- **Dark / Light mode** -- toggle themes via `data-theme` attribute with `ThemeProvider`
- **CSS Custom Properties** -- all visual tokens (`--tui-*`) are overridable for full brand customization
- **TypeScript first** -- every component exports its prop types for a great DX
- **CSS Modules** -- scoped styles with zero global side effects
- **Controlled & uncontrolled** -- all form components support both patterns
- **Compound components** -- Dialog, Tabs, Menu, and Expander use the compound component pattern for maximum flexibility
- **Auto-formatting inputs** -- TextField supports automatic telephone, currency, and decimal formatting
- **Lightweight** -- no runtime CSS-in-JS, no heavy dependencies
- **Dual format** -- ships as ESM and CJS via Vite library mode build

---

## Installation

```bash
npm install trust-ui-react
# or
pnpm add trust-ui-react
# or
yarn add trust-ui-react
```

### Peer dependencies

React 18 or later is required:

```bash
npm install react react-dom
```

### Required: load Pretendard yourself

v2's single typeface is Pretendard, declared via the `--tui-font-sans` stack -- but the library does **not** bundle the font files (an earlier build inlined the whole family and pushed the stylesheet to 3.9 MB). Load it yourself, or every component falls back to the platform's system font:

```html
<!-- e.g. via CDN, in your document head -->
<link
  rel="stylesheet"
  as="style"
  href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css"
/>
```

A self-hosted `@font-face` or a package like `@fontsource/pretendard` works too.

### Optional imports

- **`trust-ui-react/market.css`** -- only needed by apps with financial screens. Defines `--tui-rise`/`--tui-fall` for price deltas; without it those tokens are undefined rather than silently defaulting to a market convention.
- **`trust-ui-react/compat.css`** -- only needed when upgrading from v1. Aliases v1 `--tui-*` custom property names to their v2 values so an app that still reads v1 tokens directly doesn't go blank. Import it after `styles.css`.

```tsx
import 'trust-ui-react/market.css';   // optional, financial screens
import 'trust-ui-react/compat.css';   // optional, v1 upgrade path
```

---

## Quick Start

Import the stylesheet **once** at the root of your application, wrap your app with `ThemeProvider` (and optionally `ToastProvider`), then start using components.

```tsx
import { ThemeProvider, ToastProvider, Button } from 'trust-ui-react';
import 'trust-ui-react/styles.css';

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <ToastProvider position="top-right">
        <main>
          <h1>Hello Trust UI</h1>
          <Button variant="primary" size="md">
            Get Started
          </Button>
        </main>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
```

---

## Components

### Basic

| Component    | Description                                                        |
| ------------ | ------------------------------------------------------------------ |
| `Button`     | Clickable button with variants, sizes, loading spinner, and icons  |
| `Badge`      | Small status indicator label or colored dot                        |
| `Avatar`     | User image with initials fallback and circle/square shape          |
| `Chip`       | Compact tag element with color variants (primary, secondary, success, danger, warning, info) and optional delete button |
| `Progress`   | Determinate or indeterminate progress bar with percentage label    |
| `Tooltip`    | Floating tooltip that appears on hover/focus around a trigger      |

### Form

| Component    | Description                                                        |
| ------------ | ------------------------------------------------------------------ |
| `TextField`  | Text/password/tel/number input with auto-formatting, labels, and character counter |
| `Checkbox`   | Checkbox with indeterminate state support and label                 |
| `Radio`      | Single radio input, used inside `RadioGroup`                       |
| `RadioGroup` | Groups `Radio` components with controlled/uncontrolled value       |
| `Switch`     | Toggle switch with label and size options                          |
| `Select`     | Dropdown select with searchable and multi-select modes             |
| `Slider`     | Range input with value label, min/max/step support                 |
| `SegmentedControl` | iOS-style pill control for 2-4 mutually exclusive options      |
| `FileUpload` | Drag-and-drop file upload with list/grid display, image preview, and validation |

### Feedback

| Component    | Description                                                        |
| ------------ | ------------------------------------------------------------------ |
| `Toast`      | Notification alert with variants (success, danger, warning, info)  |
| `Dialog`     | Modal dialog with compound sub-components (Title, Content, Actions)|
| `Menu`       | Dropdown menu with compound Trigger, Content, Item, and Divider    |
| `BottomSheet`| Swipeable panel that slides up from the bottom, with snap points and drag-to-dismiss |
| `ActionSheet`| BottomSheet preset for a list of actions, with an optional destructive style and Cancel button |

### Data

| Component    | Description                                                        |
| ------------ | ------------------------------------------------------------------ |
| `Table`      | Data table with sortable columns, custom cell renderers, and row click |
| `Pagination` | Page navigation with ellipsis, sibling count control, and simple variant |

### Date

| Component         | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `DatePicker`      | Single date picker with calendar popup and year grid           |
| `DateRangePicker` | Date range selection with dual calendar, presets, and hover preview |
| `Calendar`        | Standalone calendar grid (also used internally by pickers)     |

### Layout

| Component    | Description                                                        |
| ------------ | ------------------------------------------------------------------ |
| `Tabs`       | Tabbed interface with compound List, Trigger, and Content          |
| `Expander`   | Accordion / collapsible sections with single or multiple open mode |
| `SafeAreaView` | Applies `env(safe-area-inset-*)` padding to its edges, for content near the iOS notch or home indicator |
| `StickyFooter` | Bottom-pinned footer that clears the home indicator and thumb zone |
| `KeyboardAvoidingView` | Adds bottom padding equal to the on-screen keyboard height via the Visual Viewport API |

---

## Theming

### ThemeProvider

Wrap your application with `ThemeProvider` to enable dark/light mode. It sets the `data-theme` attribute on `<html>` and auto-detects the user's system preference when no `defaultTheme` is provided.

```tsx
import { ThemeProvider } from 'trust-ui-react';

<ThemeProvider defaultTheme="light">
  {/* your app */}
</ThemeProvider>
```

### useTheme hook

Access and control the current theme from any component:

```tsx
import { useTheme } from 'trust-ui-react';

function ThemeToggle() {
  const { theme, setTheme, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
    </button>
  );
}
```

### How dark/light mode works

The library ships a single bundled stylesheet, `dist/styles.css` (imported as `trust-ui-react/styles.css`), that defines color tokens under both `[data-theme='light']` and `[data-theme='dark']` selectors. `ThemeProvider` sets `data-theme` on `document.documentElement`, and all component styles reference `--tui-*` variables so they automatically adapt.

### Customizing CSS variables

Override any `--tui-*` token at the root or on a specific selector to match your brand:

v2's default palette is achromatic -- `--tui-accent` falls back to `--tui-ink` (near-black in light mode, near-white in dark mode) until an app opts into a brand color:

```css
/* Override globally */
:root {
  --tui-accent: #7c3aed;
  --tui-accent-hover: #6d28d9;
  --tui-on-accent: #ffffff;
  --tui-radius-control: 8px;
}

/* Override only for dark mode */
[data-theme='dark'] {
  --tui-accent: #a78bfa;
  --tui-accent-hover: #c4b5fd;
}
```

Available token categories include:

| Prefix               | Purpose                                          |
| -------------------- | ------------------------------------------------- |
| `--tui-paper` / `--tui-field` / `--tui-sheet` | Page, recessed, and overlay surfaces |
| `--tui-ink` / `--tui-ink-2` / `--tui-ink-3`   | Text hierarchy, darkest to lightest  |
| `--tui-on-ink` / `--tui-on-accent`            | Text color on an ink or accent fill  |
| `--tui-rule` / `--tui-rule-strong`            | Border colors                        |
| `--tui-accent` / `--tui-accent-hover`         | Brand accent (defaults to ink)       |
| `--tui-success` / `--tui-danger` / `--tui-warning` | State colors                    |
| `--tui-rise` / `--tui-fall`          | Market colors (only after importing `market.css`) |
| `--tui-font-*`       | Font family, sizes, weights, line-height, letter-spacing |
| `--tui-gap-*`        | Outer spacing scale (fixed, 1 through 6)         |
| `--tui-pad-*`        | Inner padding (density-linked)                   |
| `--tui-radius-*`     | Border radius scale (`tight`, `control`, `sheet`, `full`) |
| `--tui-shadow-overlay` | The one box-shadow token, used for overlay surfaces |
| `--tui-duration-*` / `--tui-ease-out` | Motion durations and the single easing curve |
| `--tui-z-*`          | Z-index layers                                   |

---

## Component Examples

### Button

```tsx
import { Button } from 'trust-ui-react';

// Variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Danger</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// Shapes
<Button shape="square">Square</Button>
<Button shape="rounded">Rounded</Button>
<Button shape="pill">Pill</Button>

// Loading state
<Button loading>Submitting...</Button>

// With icons
<Button startIcon={<PlusIcon />}>Create</Button>
<Button endIcon={<ArrowIcon />}>Next</Button>

// Full width
<Button fullWidth>Submit</Button>
```

### TextField

```tsx
import { TextField } from 'trust-ui-react';

// Basic usage
<TextField label="Email" type="email" placeholder="you@example.com" />

// Shapes
<TextField label="Square" shape="square" />
<TextField label="Rounded" shape="rounded" />
<TextField label="Pill" shape="pill" />

// Validation
<TextField
  label="Username"
  error
  errorMessage="Username is already taken"
  helperText="Choose a unique username"
/>

// Phone number auto-formatting
<TextField
  type="tel"
  label="Phone"
  onValueChange={(raw) => console.log('Digits only:', raw)}
/>

// Currency auto-formatting
<TextField
  label="Amount"
  format="currency"
  prefix="$"
  onValueChange={(raw) => console.log('Raw number:', raw)}
/>

// Password with visibility toggle
<TextField type="password" label="Password" />

// Multiline / textarea
<TextField multiline rows={4} label="Bio" maxLength={200} />

// Character counter
<TextField label="Nickname" maxLength={20} />
```

### Select

```tsx
import { Select } from 'trust-ui-react';

const options = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'angular', label: 'Angular', disabled: true },
];

// Basic select
<Select options={options} placeholder="Choose a framework" />

// Searchable
<Select options={options} searchable placeholder="Type to search..." />

// Multi-select
<Select options={options} multiple placeholder="Select frameworks" />

// Controlled
function ControlledSelect() {
  const [value, setValue] = useState('react');
  return (
    <Select
      options={options}
      value={value}
      onChange={(v) => setValue(v as string)}
    />
  );
}
```

### Dialog

Uses the compound component pattern with `Dialog.Title`, `Dialog.Content`, and `Dialog.Actions`.

```tsx
import { useState } from 'react';
import { Dialog, Button } from 'trust-ui-react';

function ConfirmDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>

      <Dialog open={open} onClose={() => setOpen(false)} size="sm">
        <Dialog.Title onClose={() => setOpen(false)}>
          Confirm Deletion
        </Dialog.Title>
        <Dialog.Content>
          Are you sure you want to delete this item? This action cannot be undone.
        </Dialog.Content>
        <Dialog.Actions>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => setOpen(false)}>
            Delete
          </Button>
        </Dialog.Actions>
      </Dialog>
    </>
  );
}
```

The `size` prop accepts `'sm'`, `'md'`, `'lg'`, or `'fullscreen'`. Pass `closeOnBackdrop={false}` or `closeOnEscape={false}` to prevent accidental dismissal.

### Toast

Use `ToastProvider` at the app root and the `useToast` hook anywhere in your tree.

```tsx
import { ToastProvider, useToast, Button } from 'trust-ui-react';

// Wrap your app
<ToastProvider position="top-right">
  <App />
</ToastProvider>

// Trigger toasts from any component
function NotifyButton() {
  const { toast, dismiss, dismissAll } = useToast();

  const handleClick = () => {
    toast({
      variant: 'success',
      message: 'Changes saved',
      description: 'Your profile has been updated.',
      duration: 4000,
    });
  };

  return <Button onClick={handleClick}>Save</Button>;
}
```

Available variants: `'success'`, `'danger'`, `'warning'`, `'info'`.
Position options: `'top-right'`, `'top-left'`, `'top-center'`, `'bottom-right'`, `'bottom-left'`, `'bottom-center'`.

### Tabs

Compound component with `Tabs.List`, `Tabs.Trigger`, and `Tabs.Content`.

```tsx
import { Tabs } from 'trust-ui-react';

<Tabs defaultValue="overview" variant="underline">
  <Tabs.List>
    <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
    <Tabs.Trigger value="features">Features</Tabs.Trigger>
    <Tabs.Trigger value="pricing" disabled>Pricing</Tabs.Trigger>
  </Tabs.List>

  <Tabs.Content value="overview">
    <p>Overview content goes here.</p>
  </Tabs.Content>
  <Tabs.Content value="features">
    <p>Features content goes here.</p>
  </Tabs.Content>
  <Tabs.Content value="pricing">
    <p>Pricing content goes here.</p>
  </Tabs.Content>
</Tabs>
```

Variant options: `'underline'` (default) or `'pill'`.

### Table

```tsx
import { Table, type Column } from 'trust-ui-react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

const columns: Column<User>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'email', header: 'Email', sortable: true },
  {
    key: 'role',
    header: 'Role',
    align: 'center',
    render: (value) => <span style={{ textTransform: 'capitalize' }}>{value}</span>,
  },
];

const data: User[] = [
  { id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin' },
  { id: 2, name: 'Bob', email: 'bob@example.com', role: 'editor' },
  { id: 3, name: 'Charlie', email: 'charlie@example.com', role: 'viewer' },
];

<Table
  columns={columns}
  data={data}
  rowKey="id"
  stickyHeader
  onRowClick={(row) => console.log('Clicked:', row.name)}
/>
```

Sorting is built-in -- just set `sortable: true` on any column. Below `mobileVariant="summary"` (the default), narrow viewports collapse each row into a two-line summary; `mobileSlot` on a `Column` controls which slot (`'primary'`, `'secondary'`, `'value'`, `'delta'`, or `'hidden'`) it fills there, and is inferred when omitted. See the [Table docs](https://trustspirit.github.io/trust-ui-react/docs/components/table) for the full inference rules. There is no `variant` prop -- v2 has no striped or bordered row styling.

### DatePicker / DateRangePicker

```tsx
import { useState } from 'react';
import { DatePicker, DateRangePicker, type DateRange } from 'trust-ui-react';

// Single date
function SingleDate() {
  const [date, setDate] = useState<Date | null>(null);

  return (
    <DatePicker
      label="Start date"
      value={date}
      onChange={setDate}
      locale="en-US"
      dateFormat="yyyy.MM.dd"
      minDate={new Date(2024, 0, 1)}
      maxDate={new Date(2026, 11, 31)}
    />
  );
}

// Date range with presets
function RangeDate() {
  const [range, setRange] = useState<DateRange>({ start: null, end: null });

  const presets = [
    {
      label: 'Last 7 days',
      range: {
        start: new Date(Date.now() - 7 * 86400000),
        end: new Date(),
      },
    },
    {
      label: 'Last 30 days',
      range: {
        start: new Date(Date.now() - 30 * 86400000),
        end: new Date(),
      },
    },
  ];

  return (
    <DateRangePicker
      label="Period"
      value={range}
      onChange={setRange}
      locale="en-US"
      presets={presets}
    />
  );
}
```

### Expander

Compound component with `Expander.Item`, `Expander.Trigger`, and `Expander.Content`.

```tsx
import { Expander } from 'trust-ui-react';

// Accordion (single open)
<Expander type="single" defaultValue="faq-1" variant="bordered">
  <Expander.Item value="faq-1">
    <Expander.Trigger>What is Trust UI?</Expander.Trigger>
    <Expander.Content>
      Trust UI is a lightweight React component library with built-in theming.
    </Expander.Content>
  </Expander.Item>

  <Expander.Item value="faq-2">
    <Expander.Trigger>Is it accessible?</Expander.Trigger>
    <Expander.Content>
      Yes, all components follow WAI-ARIA patterns and support keyboard navigation.
    </Expander.Content>
  </Expander.Item>

  <Expander.Item value="faq-3" disabled>
    <Expander.Trigger>Coming soon</Expander.Trigger>
    <Expander.Content>
      This section is not yet available.
    </Expander.Content>
  </Expander.Item>
</Expander>

// Multiple open mode
<Expander type="multiple" variant="separated">
  {/* ... items ... */}
</Expander>
```

Type options: `'single'` (accordion, default) or `'multiple'`.
Variant options: `'default'`, `'bordered'`, `'separated'`.

### FileUpload

```tsx
import { useState } from 'react';
import { FileUpload, type FileUploadFile } from 'trust-ui-react';

function UploadExample() {
  const [files, setFiles] = useState<FileUploadFile[]>([]);

  const handleFilesChange = (newFiles: File[]) => {
    const uploadFiles: FileUploadFile[] = newFiles.map((f, i) => ({
      id: `${Date.now()}-${i}`,
      name: f.name,
      size: f.size,
      type: f.type,
      status: 'pending' as const,
      file: f,
    }));
    setFiles((prev) => [...prev, ...uploadFiles]);
  };

  return (
    <FileUpload
      multiple
      accept="image/*,.pdf"
      maxFiles={5}
      maxFileSize={10 * 1024 * 1024}
      fileList={files}
      onFilesChange={handleFilesChange}
      onRemove={(f) => setFiles((prev) => prev.filter((p) => p.id !== f.id))}
      onValidationError={(errors) => console.log(errors)}
    />
  );
}

// Grid mode with image thumbnails
<FileUpload multiple listType="grid" accept="image/*" />

// Inline variant
<FileUpload variant="inline" />
```

Variant options: `'area'` (default, large dropzone) or `'inline'` (compact single row).
List type options: `'list'` (default) or `'grid'` (cards with image preview).

---

## Customization

### className override

Every component accepts a `className` prop that is appended to its internal class names, allowing you to add or override styles.

```tsx
<Button className="my-custom-button" variant="primary">
  Custom
</Button>
```

```css
.my-custom-button {
  border-radius: 9999px;
  text-transform: uppercase;
}
```

### CSS variable scoped override

Scope token overrides to a container to theme a specific section without affecting the rest of the app.

```tsx
<div className="promo-section">
  <Button variant="primary">Special Offer</Button>
</div>
```

```css
.promo-section {
  --tui-accent: #7c3aed;
  --tui-accent-hover: #6d28d9;
  --tui-on-accent: #ffffff;
  --tui-radius-control: 12px;
}
```

### style prop

All components accept an inline `style` prop for one-off adjustments:

```tsx
<Badge color="success" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>
  NEW
</Badge>
```

---

## API Reference

All components follow a consistent API pattern:

- **`variant`** -- visual style variant (e.g., `'primary'`, `'outline'`, `'ghost'`)
- **`size`** -- component size (`'sm'`, `'md'`, `'lg'`)
- **`shape`** -- border radius shape (`'square'`, `'rounded'`, `'pill'`) on Button and TextField
- **`disabled`** -- disables the component
- **`className`** -- additional CSS class names
- **`style`** -- inline React CSS properties
- **`ref`** -- forwarded ref (where applicable)

Form components additionally support:

- **`value` / `defaultValue`** -- controlled and uncontrolled patterns
- **`onChange`** -- change callback
- **`error` / `errorMessage`** -- validation state and message
- **`fullWidth`** -- stretches the component to fill its container

For full prop documentation, type definitions, and interactive examples:

- **[Documentation Site](https://trustspirit.github.io/trust-ui-react/)** -- live component previews, Props tables, design tokens, and getting started guides
- **Storybook** -- run locally for development:

```bash
pnpm dev
# or
pnpm storybook
```

---

## Browser Support

| Browser           | Supported versions |
| ----------------- | ------------------ |
| Chrome            | Last 2 versions    |
| Firefox           | Last 2 versions    |
| Safari            | Last 2 versions    |
| Edge (Chromium)   | Last 2 versions    |

The library uses modern CSS features such as custom properties and the native `<dialog>` element. Internet Explorer is not supported.

---

## License

MIT
