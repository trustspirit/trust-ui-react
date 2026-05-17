import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Foundation/Tokens',
};

export default meta;
type Story = StoryObj;

// ───────── Color swatches ─────────
const SwatchRow = ({ name, value }: { name: string; value: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}>
    <div
      style={{
        width: 56,
        height: 32,
        borderRadius: 'var(--tui-radius-md)',
        background: value,
        border: '1px solid var(--tui-border)',
        flexShrink: 0,
      }}
    />
    <code style={{ fontFamily: 'var(--tui-font-mono)', fontSize: 12 }}>
      {name}
    </code>
    <span style={{ color: 'var(--tui-text-muted)', fontSize: 12, marginLeft: 'auto' }}>
      {value}
    </span>
  </div>
);

export const Colors: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 32,
        padding: 24,
        fontFamily: 'var(--tui-font-sans)',
        color: 'var(--tui-text)',
      }}
    >
      <section>
        <h3>Surface</h3>
        <SwatchRow name="--tui-bg" value="var(--tui-bg)" />
        <SwatchRow name="--tui-bg-subtle" value="var(--tui-bg-subtle)" />
        <SwatchRow name="--tui-bg-muted" value="var(--tui-bg-muted)" />
        <SwatchRow name="--tui-bg-hover" value="var(--tui-bg-hover)" />
        <SwatchRow name="--tui-bg-active" value="var(--tui-bg-active)" />

        <h3 style={{ marginTop: 24 }}>Text</h3>
        <SwatchRow name="--tui-text" value="var(--tui-text)" />
        <SwatchRow name="--tui-text-secondary" value="var(--tui-text-secondary)" />
        <SwatchRow name="--tui-text-muted" value="var(--tui-text-muted)" />

        <h3 style={{ marginTop: 24 }}>Border</h3>
        <SwatchRow name="--tui-border" value="var(--tui-border)" />
        <SwatchRow name="--tui-border-hover" value="var(--tui-border-hover)" />
        <SwatchRow name="--tui-border-strong" value="var(--tui-border-strong)" />
        <SwatchRow name="--tui-border-focus" value="var(--tui-border-focus)" />
      </section>

      <section>
        <h3>Primary (Indigo)</h3>
        <SwatchRow name="--tui-primary" value="var(--tui-primary)" />
        <SwatchRow name="--tui-primary-hover" value="var(--tui-primary-hover)" />
        <SwatchRow name="--tui-primary-active" value="var(--tui-primary-active)" />
        <SwatchRow name="--tui-primary-subtle" value="var(--tui-primary-subtle)" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}>
          <div
            style={{
              width: 56,
              height: 32,
              borderRadius: 'var(--tui-radius-md)',
              background: 'var(--tui-primary-gradient)',
              border: '1px solid var(--tui-border)',
            }}
          />
          <code style={{ fontFamily: 'var(--tui-font-mono)', fontSize: 12 }}>
            --tui-primary-gradient
          </code>
        </div>

        <h3 style={{ marginTop: 24 }}>Status</h3>
        <SwatchRow name="--tui-success" value="var(--tui-success)" />
        <SwatchRow name="--tui-danger" value="var(--tui-danger)" />
        <SwatchRow name="--tui-warning" value="var(--tui-warning)" />
        <SwatchRow name="--tui-info" value="var(--tui-info)" />
      </section>
    </div>
  ),
};

// ───────── Typography ─────────
export const Typography: Story = {
  render: () => (
    <div
      style={{
        padding: 24,
        fontFamily: 'var(--tui-font-sans)',
        color: 'var(--tui-text)',
        background: 'var(--tui-bg)',
      }}
    >
      <h3>Geist Sans — variable weight 400 / 500 / 600 / 700</h3>
      {[400, 500, 600, 700].map((w) => (
        <div
          key={w}
          style={{ fontWeight: w, fontSize: 18, padding: '4px 0' }}
        >
          The quick brown fox jumps over the lazy dog ({w})
        </div>
      ))}

      <h3 style={{ marginTop: 32 }}>Type scale</h3>
      {[
        ['xs', '--tui-font-size-xs'],
        ['sm', '--tui-font-size-sm'],
        ['md', '--tui-font-size-md'],
        ['lg', '--tui-font-size-lg'],
        ['xl', '--tui-font-size-xl'],
        ['2xl', '--tui-font-size-2xl'],
      ].map(([label, token]) => (
        <div
          key={token}
          style={{ fontSize: `var(${token})`, padding: '4px 0' }}
        >
          {label} — Aa Bb Cc ({token})
        </div>
      ))}

      <h3 style={{ marginTop: 32 }}>Geist Mono</h3>
      <pre style={{ fontFamily: 'var(--tui-font-mono)', fontSize: 14 }}>
        {`const greeting = "Hello, trust-ui v2";
function add(a: number, b: number) {
  return a + b;
}`}
      </pre>
    </div>
  ),
};

// ───────── Motion ─────────
export const Motion: Story = {
  render: () => {
    const easings = [
      ['ease-out', 'var(--tui-ease-out)'],
      ['ease-in-out', 'var(--tui-ease-in-out)'],
      ['ease-spring', 'var(--tui-ease-spring)'],
      ['ease-linear', 'var(--tui-ease-linear)'],
    ];
    return (
      <div
        style={{
          padding: 24,
          fontFamily: 'var(--tui-font-sans)',
          color: 'var(--tui-text)',
          background: 'var(--tui-bg)',
        }}
      >
        <h3>Easing demo — hover 시 0 → 100 이동 (320ms)</h3>
        <p style={{ color: 'var(--tui-text-muted)', fontSize: 14 }}>
          Hover the row to play the transition. Each row uses a different cubic-bezier curve.
        </p>
        {easings.map(([name, value]) => (
          <div
            key={name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '12px 0',
              borderBottom: '1px solid var(--tui-border)',
            }}
          >
            <code
              style={{
                fontFamily: 'var(--tui-font-mono)',
                fontSize: 12,
                width: 120,
                color: 'var(--tui-text-secondary)',
              }}
            >
              {name}
            </code>
            <div
              style={{
                position: 'relative',
                flex: 1,
                height: 24,
                background: 'var(--tui-bg-muted)',
                borderRadius: 'var(--tui-radius-md)',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                const ball = e.currentTarget.querySelector('span') as HTMLSpanElement;
                ball.style.transform = 'translateX(calc(100% - 24px))';
              }}
              onMouseLeave={(e) => {
                const ball = e.currentTarget.querySelector('span') as HTMLSpanElement;
                ball.style.transform = 'translateX(0)';
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  left: 2,
                  width: 20,
                  height: 20,
                  borderRadius: 999,
                  background: 'var(--tui-primary)',
                  transition: `transform 320ms ${value}`,
                }}
              />
            </div>
          </div>
        ))}

        <h3 style={{ marginTop: 32 }}>Duration tokens</h3>
        <pre style={{ fontFamily: 'var(--tui-font-mono)', fontSize: 13 }}>
          {`--tui-duration-instant: 80ms
--tui-duration-fast:    150ms
--tui-duration-base:    220ms
--tui-duration-medium:  320ms
--tui-duration-slow:    480ms`}
        </pre>
      </div>
    );
  },
};

// ───────── Elevation ─────────
export const Elevation: Story = {
  render: () => (
    <div
      style={{
        padding: 32,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 24,
        fontFamily: 'var(--tui-font-sans)',
        background: 'var(--tui-bg)',
        color: 'var(--tui-text)',
      }}
    >
      {['xs', 'sm', 'md', 'lg', 'xl'].map((size) => (
        <div
          key={size}
          style={{
            background: 'var(--tui-bg-subtle)',
            border: '1px solid var(--tui-border)',
            borderRadius: 'var(--tui-radius-lg)',
            padding: 24,
            boxShadow: `var(--tui-shadow-${size})`,
            textAlign: 'center',
            fontFamily: 'var(--tui-font-mono)',
            fontSize: 12,
          }}
        >
          shadow-{size}
        </div>
      ))}
    </div>
  ),
};

// ───────── Glass ─────────
export const Glass: Story = {
  render: () => (
    <div
      style={{
        height: 480,
        position: 'relative',
        background:
          'linear-gradient(135deg, #635bff 0%, #ff5c2c 50%, #facc15 100%)',
        padding: 48,
        fontFamily: 'var(--tui-font-sans)',
      }}
    >
      <div
        className="tui-glass"
        style={{
          padding: 24,
          maxWidth: 400,
          color: 'var(--tui-text)',
        }}
      >
        <h3 style={{ margin: '0 0 8px' }}>Glass surface (Tier 3)</h3>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--tui-text-secondary)' }}>
          This card uses the <code style={{ fontFamily: 'var(--tui-font-mono)' }}>.tui-glass</code>{' '}
          utility. With <code style={{ fontFamily: 'var(--tui-font-mono)' }}>backdrop-filter</code>{' '}
          support, the colorful background blurs through. In unsupported environments it falls back
          to a solid surface.
        </p>
      </div>
    </div>
  ),
};
