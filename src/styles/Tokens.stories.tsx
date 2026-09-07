import type { Meta, StoryObj } from '@storybook/react';

/*
 * v2 토큰 쇼케이스. v1(Geist, glass 등)을 문서화하던 이전 버전을 대체한다.
 *
 * 여기서 쓰는 값은 모두 실제 토큰을 var()로 참조한다 — 하드코딩한 색이나
 * 치수를 문서에만 박아 넣으면 토큰이 바뀌었을 때 문서만 거짓말을 하게 된다.
 * 예외는 spacing.css·tokens.css 주석에 적힌 픽셀 표기뿐이며, 이는 설명용
 * 텍스트일 뿐 스타일 값으로는 쓰지 않는다.
 *
 * 금지 목록(계획 §Global Constraints)을 그대로 지킨다:
 * 자간을 벌린 대문자 레이블, 가운뎃점(·)으로 이은 메타 문자열,
 * 데이터 레이블용 모노스페이스는 쓰지 않는다. 등폭 숫자는 .tui-num으로
 * 숫자에만 적용한다.
 */

const meta: Meta = {
  title: 'Foundation/Tokens',
};

export default meta;
type Story = StoryObj;

const pageStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--tui-gap-6)',
  padding: 'var(--tui-gap-5)',
  fontFamily: 'var(--tui-font-sans)',
  color: 'var(--tui-ink)',
  background: 'var(--tui-paper)',
};

const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 4px',
  fontSize: 'var(--tui-font-size-h3)',
  lineHeight: 'var(--tui-line-height-heading)',
  letterSpacing: 'var(--tui-letter-heading)',
  fontWeight: 'var(--tui-weight-semibold)',
};

const sectionNoteStyle: React.CSSProperties = {
  margin: '0 0 16px',
  maxWidth: 640,
  fontSize: 'var(--tui-font-size-small)',
  lineHeight: 'var(--tui-line-height-body)',
  color: 'var(--tui-ink-2)',
};

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 style={sectionTitleStyle}>{title}</h2>
      {note && <p style={sectionNoteStyle}>{note}</p>}
      {children}
    </section>
  );
}

const swatchLabelStyle: React.CSSProperties = {
  fontSize: 'var(--tui-font-size-small)',
  color: 'var(--tui-ink)',
};

const swatchValueStyle: React.CSSProperties = {
  fontSize: 'var(--tui-font-size-caption)',
  color: 'var(--tui-ink-2)',
};

function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tui-gap-2)' }}>
      <div
        style={{
          height: 48,
          borderRadius: 'var(--tui-radius-control)',
          background: value,
          border: '1px solid var(--tui-rule)',
        }}
      />
      <span style={swatchLabelStyle}>{name}</span>
      <span style={swatchValueStyle}>{value}</span>
    </div>
  );
}

// ───────── 팔레트 뉴트럴 14단계 ─────────
export const NeutralRamp: Story = {
  render: () => {
    const steps = [0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 850, 900, 950, 1000];
    return (
      <div style={pageStyle}>
        <Section
          title="뉴트럴 팔레트"
          note="hue 0, sat 0의 무채색 14단계. 이 층은 색조를 섞지 않으며, 컴포넌트는 이 층을 직접 참조하지 않는다 — themes/*.css가 명암별로 의미를 부여한 뒤에만 쓰인다."
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: 'var(--tui-gap-4)',
            }}
          >
            {steps.map((step) => (
              <Swatch
                key={step}
                name={`--tui-p-neutral-${step}`}
                value={`var(--tui-p-neutral-${step})`}
              />
            ))}
          </div>
        </Section>
      </div>
    );
  },
};

// ───────── 시맨틱 토큰 매핑 ─────────
export const SemanticMapping: Story = {
  render: () => (
    <div style={pageStyle}>
      <Section
        title="시맨틱 매핑"
        note="같은 토큰 이름이 라이트/다크에서 서로 다른 뉴트럴 단계로 매핑된다. 위 툴바의 Theme을 전환해 비교한다."
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: 'var(--tui-gap-4)',
          }}
        >
          <Swatch name="--tui-paper" value="var(--tui-paper)" />
          <Swatch name="--tui-sheet" value="var(--tui-sheet)" />
          <Swatch name="--tui-field" value="var(--tui-field)" />
          <Swatch name="--tui-ink" value="var(--tui-ink)" />
          <Swatch name="--tui-ink-2" value="var(--tui-ink-2)" />
          <Swatch name="--tui-ink-3" value="var(--tui-ink-3)" />
          <Swatch name="--tui-on-ink" value="var(--tui-on-ink)" />
          <Swatch name="--tui-rule" value="var(--tui-rule)" />
          <Swatch name="--tui-rule-strong" value="var(--tui-rule-strong)" />
          <Swatch name="--tui-accent" value="var(--tui-accent)" />
          <Swatch name="--tui-on-accent" value="var(--tui-on-accent)" />
          <Swatch name="--tui-accent-hover" value="var(--tui-accent-hover)" />
          <Swatch name="--tui-danger" value="var(--tui-danger)" />
          <Swatch name="--tui-danger-hover" value="var(--tui-danger-hover)" />
          <Swatch name="--tui-on-danger" value="var(--tui-on-danger)" />
          <Swatch name="--tui-success" value="var(--tui-success)" />
          <Swatch name="--tui-warning" value="var(--tui-warning)" />
        </div>
      </Section>
    </div>
  ),
};

// ───────── 라운드 4종 ─────────
export const Radii: Story = {
  render: () => {
    const radii = [
      { name: '--tui-radius-tight', label: '4px' },
      { name: '--tui-radius-control', label: '6px' },
      { name: '--tui-radius-sheet', label: '10px' },
      { name: '--tui-radius-full', label: 'pill' },
    ];
    return (
      <div style={pageStyle}>
        <Section title="라운드" note="네 단계뿐이다. 배지·입력 같은 작은 컨트롤은 tight/control, 카드·다이얼로그 같은 면은 sheet, 알약 형태는 full을 쓴다.">
          <div style={{ display: 'flex', gap: 'var(--tui-gap-5)', flexWrap: 'wrap' }}>
            {radii.map(({ name, label }) => (
              <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tui-gap-2)' }}>
                <div
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: `var(${name})`,
                    background: 'var(--tui-field)',
                    border: '1px solid var(--tui-rule)',
                  }}
                />
                <span style={swatchLabelStyle}>{name}</span>
                <span style={swatchValueStyle}>{label}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    );
  },
};

// ───────── 여백 두 갈래 ─────────
export const Spacing: Story = {
  render: () => {
    const pad = [
      { name: '--tui-pad-1', compact: '4px', comfortable: '6px' },
      { name: '--tui-pad-2', compact: '8px', comfortable: '10px' },
      { name: '--tui-pad-3', compact: '12px', comfortable: '14px' },
      { name: '--tui-pad-4', compact: '16px', comfortable: '20px' },
    ];
    const gap = [
      { name: '--tui-gap-1', value: '4px' },
      { name: '--tui-gap-2', value: '8px' },
      { name: '--tui-gap-3', value: '12px' },
      { name: '--tui-gap-4', value: '16px' },
      { name: '--tui-gap-5', value: '24px' },
      { name: '--tui-gap-6', value: '32px' },
    ];
    const cellStyle: React.CSSProperties = {
      padding: 'var(--tui-gap-2) var(--tui-gap-3)',
      textAlign: 'left',
      fontSize: 'var(--tui-font-size-small)',
      borderBottom: '1px solid var(--tui-rule)',
    };
    return (
      <div style={pageStyle}>
        <Section
          title="여백 — 두 갈래"
          note="안쪽 여백(--tui-pad-*)은 밀도 축에 연동된다. compact에서 컨트롤이 낮아지는 만큼 안쪽 여백도 함께 줄어야 글자가 가장자리에 붙지 않는다. 요소 사이 간격(--tui-gap-*)은 밀도와 무관하게 고정된다 — 그러지 않으면 페이지 레이아웃 전체가 밀도 전환마다 재배치된다. 위 툴바의 Density를 전환해 pad 박스만 바뀌는지 확인한다."
        >
          <div style={{ display: 'flex', gap: 'var(--tui-gap-6)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div>
              <p style={{ ...swatchLabelStyle, margin: '0 0 8px' }}>안쪽 (밀도 연동)</p>
              <div style={{ display: 'flex', gap: 'var(--tui-gap-3)', flexWrap: 'wrap' }}>
                {pad.map(({ name, compact, comfortable }) => (
                  <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tui-gap-2)' }}>
                    <div
                      style={{
                        padding: `var(${name})`,
                        background: 'var(--tui-field)',
                        border: '1px solid var(--tui-rule)',
                        borderRadius: 'var(--tui-radius-control)',
                      }}
                    >
                      <div style={{ width: 24, height: 24, background: 'var(--tui-rule-strong)', borderRadius: 'var(--tui-radius-tight)' }} />
                    </div>
                    <span style={swatchLabelStyle}>{name}</span>
                    <span style={swatchValueStyle}>
                      compact {compact}, comfortable {comfortable}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <table style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...cellStyle, color: 'var(--tui-ink-2)', fontWeight: 'var(--tui-weight-medium)' }}>고정 (--tui-gap-*)</th>
                  <th style={{ ...cellStyle, color: 'var(--tui-ink-2)', fontWeight: 'var(--tui-weight-medium)' }}>값</th>
                </tr>
              </thead>
              <tbody>
                {gap.map(({ name, value }) => (
                  <tr key={name}>
                    <td style={cellStyle}>{name}</td>
                    <td style={cellStyle} className="tui-num">
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>
    );
  },
};

// ───────── 타이포 스케일 9단계 ─────────
export const TypeScale: Story = {
  render: () => {
    const steps = [
      ['--tui-font-size-micro', '11px'],
      ['--tui-font-size-caption', '12px'],
      ['--tui-font-size-small', '13px'],
      ['--tui-font-size-body', '14px'],
      ['--tui-font-size-lead', '16px'],
      ['--tui-font-size-h3', '19px'],
      ['--tui-font-size-h2', '24px'],
      ['--tui-font-size-h1', '32px'],
      ['--tui-font-size-figure', '40px'],
    ];
    return (
      <div style={pageStyle}>
        <Section title="타이포 스케일" note="9단계. 서체는 Pretendard Variable 하나뿐이다 — 굵기는 --tui-weight-* 네 단계(regular/medium/strong/semibold)로만 구분한다.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tui-gap-3)' }}>
            {steps.map(([token, px]) => (
              <div key={token} style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--tui-gap-4)' }}>
                <span style={{ ...swatchValueStyle, width: 220, flexShrink: 0 }}>
                  {token} ({px})
                </span>
                <span style={{ fontSize: `var(${token})`, lineHeight: 'var(--tui-line-height-heading)' }}>
                  가나다 Aa 123
                </span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    );
  },
};

// ───────── 등폭 숫자 예시 ─────────
export const TabularFigures: Story = {
  render: () => (
    <div style={pageStyle}>
      <Section
        title="등폭 숫자"
        note="tabular-nums는 숫자 자릿수를 세로로 맞추는 기능이며 장식이 아니다. .tui-num 클래스로 숫자에만 적용한다 — 라벨이나 문장 전체에 씌우지 않는다."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tui-gap-4)' }}>
          {[
            { label: '적용 — 자릿수가 세로로 맞는다', className: 'tui-num' },
            { label: '미적용 — 비교용, 자릿수가 어긋날 수 있다', className: undefined },
          ].map(({ label, className }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tui-gap-2)' }}>
              <span style={swatchValueStyle}>{label}</span>
              <div
                className={className}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--tui-gap-1)',
                  fontSize: 'var(--tui-font-size-lead)',
                  fontWeight: 'var(--tui-weight-medium)',
                }}
              >
                <span>1,204,900</span>
                <span>82,480,300</span>
                <span>3,500</span>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  ),
};

// ───────── 시장색 (선택 레이어) ─────────
export const MarketColors: Story = {
  render: () => (
    <div style={pageStyle}>
      <Section
        title="시장색"
        note="상승/하락을 나타내는 시장색은 기본 번들에 없는 선택 레이어다. 금융 화면이 있는 앱만 market.css를 따로 임포트해야 쓸 수 있다: import 'trust-ui-react/market.css'. 글자에만 쓰며 배경·배지·테두리는 채우지 않는다. 위 툴바의 Market(kr/us)을 전환하면 상승/하락에 배정된 색이 뒤바뀐다 — 한국은 적색 상승, 미국은 녹색 상승이다."
      >
        <div style={{ display: 'flex', gap: 'var(--tui-gap-6)' }}>
          <div
            className="tui-num"
            style={{ fontSize: 'var(--tui-font-size-lead)', fontWeight: 'var(--tui-weight-medium)', color: 'var(--tui-rise)' }}
          >
            +1,204,900 (--tui-rise)
          </div>
          <div
            className="tui-num"
            style={{ fontSize: 'var(--tui-font-size-lead)', fontWeight: 'var(--tui-weight-medium)', color: 'var(--tui-fall)' }}
          >
            −820,400 (--tui-fall)
          </div>
        </div>
      </Section>
    </div>
  ),
};
