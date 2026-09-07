import type { Meta, StoryObj } from '@storybook/react';

/*
 * v2가 Geist 대신 Pretendard를 쓰는 유일한 이유는 Geist에 한글 글리프가 없기
 * 때문이다 — 한글이 시스템 폰트로 폴백되면 자간·기준선이 달라져 한글/라틴/숫자가
 * 섞인 줄의 리듬이 깨진다. 이 스토리는 그 혼용 상황을 실제로 재현해, 스크린샷
 * 베이스라인에 한글이 전혀 없던 문제(리뷰 지적)를 메운다.
 *
 * 컴포넌트에 의존하지 않는다 — 26개 마이그레이션이 진행되는 동안에도
 * 이 스토리 자체가 깨지지 않아야 하기 때문이다.
 */

const meta: Meta = {
  title: 'Foundation/Typography',
};

export default meta;
type Story = StoryObj;

// 열거기(byComponent)는 이름이 'variants'인 스토리를 최우선으로 고른다.
export const Variants: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--tui-gap-5)',
        padding: 'var(--tui-gap-5)',
        fontFamily: 'var(--tui-font-sans)',
        color: 'var(--tui-ink)',
        background: 'var(--tui-paper)',
      }}
    >
      {/* 한글 헤딩 */}
      <h2
        style={{
          margin: 0,
          fontSize: 'var(--tui-font-size-h2)',
          lineHeight: 'var(--tui-line-height-heading)',
          letterSpacing: 'var(--tui-letter-heading)',
          fontWeight: 'var(--tui-weight-semibold)',
        }}
      >
        한글과 라틴, 숫자가 한 줄에서 만난다
      </h2>

      {/* 한글 + 라틴 단어 + 숫자가 같은 줄에 섞인 본문 */}
      <p
        style={{
          margin: 0,
          maxWidth: 640,
          fontSize: 'var(--tui-font-size-body)',
          lineHeight: 'var(--tui-line-height-body)',
          letterSpacing: 'var(--tui-letter-body)',
          fontWeight: 'var(--tui-weight-regular)',
        }}
      >
        trust-ui v2는 Geist 대신 Pretendard를 쓴다. Geist에는 한글 글리프가 없어서
        한글이 시스템 폰트로 폴백되면, Latin words와 숫자 2026이 함께 놓인 줄에서
        기준선과 자간이 어긋난다. 이 문단은 한글과 Latin, 숫자가 나란히 놓였을 때
        줄 리듬이 유지되는지 확인한다.
      </p>

      {/* tabular-nums 적용 — 자릿수 정렬 확인용 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tui-gap-2)' }}>
        <span style={{ fontSize: 'var(--tui-font-size-caption)', color: 'var(--tui-ink-2)' }}>
          tabular-nums 적용 — 자릿수가 세로로 맞아야 한다
        </span>
        <div
          className="tui-num"
          style={{
            display: 'flex',
            gap: 'var(--tui-gap-4)',
            fontSize: 'var(--tui-font-size-lead)',
            fontWeight: 'var(--tui-weight-medium)',
          }}
        >
          <span>12,480,300 원</span>
          <span>+1,204,900 (+0.95%)</span>
        </div>
      </div>

      {/* tabular-nums 미적용 — 비교용 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tui-gap-2)' }}>
        <span style={{ fontSize: 'var(--tui-font-size-caption)', color: 'var(--tui-ink-2)' }}>
          tabular-nums 미적용 — 비교용, 자릿수가 어긋날 수 있다
        </span>
        <div
          style={{
            display: 'flex',
            gap: 'var(--tui-gap-4)',
            fontSize: 'var(--tui-font-size-lead)',
            fontWeight: 'var(--tui-weight-medium)',
          }}
        >
          <span>12,480,300 원</span>
          <span>+1,204,900 (+0.95%)</span>
        </div>
      </div>

      {/* 한글 라벨 + 라틴/숫자 값이 한 줄에 나란히 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 'var(--tui-gap-3)',
          paddingTop: 'var(--tui-gap-3)',
          borderTop: '1px solid var(--tui-rule)',
        }}
      >
        <span style={{ fontSize: 'var(--tui-font-size-body)', color: 'var(--tui-ink-2)' }}>
          잔고
        </span>
        <span
          className="tui-num"
          style={{
            fontSize: 'var(--tui-font-size-h3)',
            fontWeight: 'var(--tui-weight-strong)',
          }}
        >
          8,204,910 KRW
        </span>
      </div>
    </div>
  ),
};
