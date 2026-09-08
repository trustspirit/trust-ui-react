import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';

const FEATURES = [
  {
    title: 'Mobile-optimized, not just responsive',
    body: 'Every primitive picks the right mobile pattern: BottomSheet, ActionSheet, fullscreen Dialog, safe-area handling, and a 4-mode Tooltip that respects touch.',
  },
  {
    title: 'CSS variables, no runtime',
    body: 'All theming flows through CSS custom properties. Zero JS at runtime, multi-brand-ready, and overridable per scope without a context provider.',
  },
  {
    title: 'An achromatic core',
    body: "v2's default palette is neutrals only — every accent, button, and focus ring is ink by default. Colour appears only where it carries meaning: danger, success, warning, or a brand accent you opt into.",
  },
  {
    title: 'Two surfaces, not three',
    body: '`--tui-paper` for the page and `--tui-field` for recessed areas. Overlays (sheets, menus, popovers) use `--tui-sheet`, an opaque surface — v2 has no glass or backdrop-filter.',
  },
  {
    title: 'Three durations, one easing',
    body: 'Motion answers user actions — it never decorates. No hover lift, no transform on hover; every transition respects prefers-reduced-motion automatically.',
  },
  {
    title: 'Accessible by default',
    body: 'ARIA wiring, keyboard navigation, focus management, and 44px tap targets built in. Storybook a11y addon runs against every story.',
  },
];

export default function Home(): JSX.Element {
  const docsUrl = useBaseUrl('/docs/getting-started/installation');
  const githubUrl = 'https://github.com/trustspirit/trust-ui-react';

  return (
    <Layout
      title="trust-ui — a mobile-optimized React UI library"
      description="A lightweight, themeable React UI component library with full mobile-first UX, sophisticated motion, and CSS-variable-based theming."
    >
      <main>
        <section className="tui-hero">
          <span className="tui-hero__eyebrow">v2</span>
          <h1 className="tui-hero__title">
            A mobile-optimized React UI library.
          </h1>
          <p className="tui-hero__subtitle">
            30 themeable components with native-feeling touch behavior, an achromatic core, and CSS-variable theming — no runtime, no lock-in.
          </p>
          <div className="tui-hero__cta-row">
            <Link className="tui-hero__cta tui-hero__cta--primary" to={docsUrl}>
              Get started
            </Link>
            <Link className="tui-hero__cta tui-hero__cta--secondary" to={githubUrl}>
              GitHub
            </Link>
          </div>
        </section>

        <section className="tui-features">
          <div className="tui-features__grid">
            {FEATURES.map((f) => (
              <article key={f.title} className="tui-feature">
                <h3 className="tui-feature__title">{f.title}</h3>
                <p className="tui-feature__body">{f.body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </Layout>
  );
}
