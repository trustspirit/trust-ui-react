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
    title: 'Indigo Premium palette + Geist',
    body: 'A coherent visual system ships out of the box — warm ivory neutrals, sophisticated gradient primary, Geist Variable sans + mono bundled.',
  },
  {
    title: '3-tier surface model',
    body: 'Base, Raised, and Elevated Glass surfaces stack predictably. Glass uses backdrop-filter with a graceful opaque fallback for older Android WebView.',
  },
  {
    title: 'Cinematic motion, reduced-motion aware',
    body: 'Five named motion patterns (state, micro-lift, surface, layout, continuous). All transitions respect prefers-reduced-motion automatically.',
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
          <span className="tui-hero__eyebrow">v2 · Indigo Premium</span>
          <h1 className="tui-hero__title">
            A mobile-optimized React UI library.
          </h1>
          <p className="tui-hero__subtitle">
            22 themeable components with native-feeling touch behavior, glass surfaces, and CSS-variable theming — no runtime, no lock-in.
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
