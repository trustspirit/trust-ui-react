import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Table } from './Table';
import type { Column } from './types';

interface Holding {
  name: string;
  code: string;
  qty: number;
  avg: number;
  price: number;
  pnl: number;
  rate: number;
}

const won = (n: number) => n.toLocaleString('ko-KR');
const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '-' : ''}${won(Math.abs(n))}`;
const percent = (n: number) =>
  `${n > 0 ? '+' : n < 0 ? '-' : ''}${Math.abs(n).toFixed(2)}%`;

const holdings: Holding[] = [
  { name: '삼성전자', code: '005930', qty: 320, avg: 71200, price: 82400, pnl: 3584000, rate: 15.73 },
  { name: 'SK하이닉스', code: '000660', qty: 45, avg: 178500, price: 164000, pnl: -652500, rate: -8.12 },
  { name: 'NAVER', code: '035420', qty: 60, avg: 205000, price: 205000, pnl: 0, rate: 0 },
  { name: '카카오', code: '035720', qty: 210, avg: 48300, price: 51900, pnl: 756000, rate: 7.45 },
  { name: '현대차', code: '005380', qty: 80, avg: 192000, price: 238500, pnl: 3720000, rate: 24.22 },
];

const holdingColumns: Column<Holding>[] = [
  { key: 'name', header: '종목', sortable: true },
  { key: 'qty', header: '보유', numeric: true, sortable: true, render: (v: number) => `${won(v)}주` },
  { key: 'avg', header: '평단가', numeric: true, sortable: true, render: (v: number) => won(v) },
  { key: 'price', header: '현재가', numeric: true, sortable: true, render: (v: number) => won(v) },
  { key: 'pnl', header: '평가손익', numeric: true, tone: 'auto', sortable: true, render: (v: number) => signed(v) },
  { key: 'rate', header: '수익률', numeric: true, tone: 'auto', sortable: true, render: (v: number) => percent(v) },
];

// Numeric 용 — 시장색 없이 정렬·등폭 숫자만 보여준다. tone 을 빼서 Market 과 픽셀이 갈리게 한다.
const plainHoldingColumns: Column<Holding>[] = [
  { key: 'name', header: '종목', sortable: true },
  { key: 'qty', header: '보유', numeric: true, sortable: true, render: (v: number) => `${won(v)}주` },
  { key: 'avg', header: '평단가', numeric: true, sortable: true, render: (v: number) => won(v) },
  { key: 'price', header: '현재가', numeric: true, sortable: true, render: (v: number) => won(v) },
  { key: 'pnl', header: '평가손익', numeric: true, sortable: true, render: (v: number) => signed(v) },
  { key: 'rate', header: '수익률', numeric: true, sortable: true, render: (v: number) => percent(v) },
];

interface Member {
  name: string;
  dept: string;
  title: string;
  joined: string;
}

const members: Member[] = [
  { name: '김서연', dept: '재무', title: '팀장', joined: '2019-03-04' },
  { name: '이도현', dept: '개발', title: '선임', joined: '2021-08-16' },
  { name: '박지우', dept: '디자인', title: '책임', joined: '2020-01-06' },
];

// Default 용 — 정렬 불가. Sortable 스토리와 픽셀이 달라야 하므로 sortable 플래그를 전부 뺐다.
const plainMemberColumns: Column<Member>[] = [
  { key: 'name', header: '이름' },
  { key: 'dept', header: '부서' },
  { key: 'title', header: '직위' },
  { key: 'joined', header: '입사일', align: 'right' },
];

const memberColumns: Column<Member>[] = [
  { key: 'name', header: '이름', sortable: true },
  { key: 'dept', header: '부서' },
  { key: 'title', header: '직위' },
  { key: 'joined', header: '입사일', align: 'right', sortable: true },
];

const meta: Meta<typeof Table> = {
  title: 'Components/Table',
  component: Table,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof Table>;

/** 금융이 아닌 일반 표. 수치 열이 없어도 그대로 성립한다. */
export const Default: Story = {
  render: () => <Table columns={plainMemberColumns} data={members} />,
};

export const Sortable: Story = {
  render: () => <Table columns={memberColumns} data={members} />,
};

/** 우측 정렬과 등폭 숫자 (자릿수가 세로로 맞는다), 시장색 없이. */
export const Numeric: Story = {
  render: () => <Table columns={plainHoldingColumns} data={holdings} />,
};

/** 원장은 합계로 닫힌다. 총계 행 위아래로 가장 진한 괘선이 온다. */
export const WithSummaryRow: Story = {
  tags: ['visual', 'visual-mobile'],
  render: () => (
    <Table
      columns={holdingColumns}
      data={holdings}
      summaryRow={{
        name: '합계',
        qty: holdings.reduce((s, h) => s + h.qty, 0),
        price: holdings.reduce((s, h) => s + h.price * h.qty, 0),
        pnl: holdings.reduce((s, h) => s + h.pnl, 0),
        rate: 12.04,
      }}
    />
  ),
};

/**
 * 시장 관례 축. 같은 데이터인데 상승·하락의 색이 뒤집힌다 —
 * 한국·일본·중국은 적색 상승, 미국·유럽은 녹색 상승이다.
 * market.css 를 임포트한 앱에서만 색이 나타난다.
 */
export const Market: Story = {
  tags: ['visual'],
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <div data-market="kr">
        <p style={{ margin: '0 0 8px', font: 'inherit', opacity: 0.6 }}>data-market="kr"</p>
        <Table columns={holdingColumns} data={holdings} />
      </div>
      <div data-market="us">
        <p style={{ margin: '0 0 8px', font: 'inherit', opacity: 0.6 }}>data-market="us"</p>
        <Table columns={holdingColumns} data={holdings} />
      </div>
    </div>
  ),
};

export const StickyHeader: Story = {
  render: () => (
    <div style={{ maxHeight: 220 }}>
      <Table columns={holdingColumns} data={holdings} stickyHeader />
    </div>
  ),
};

export const RowClick: Story = {
  render: function RowClickStory() {
    const [selected, setSelected] = useState<string | null>(null);
    return (
      <div>
        <Table
          columns={memberColumns}
          data={members}
          rowKey="name"
          onRowClick={(row) => setSelected((row as Member).name)}
        />
        <p style={{ marginTop: 12 }}>선택: {selected ?? '없음'}</p>
      </div>
    );
  },
};

export const EmptyState: Story = {
  tags: ['visual'],
  render: () => <Table columns={memberColumns} data={[]} />,
};

/** 좁은 화면의 기본값. 한 행이 두 줄을 차지한다. */
export const MobileSummary: Story = {
  tags: ['visual-mobile'],
  render: () => <Table columns={holdingColumns} data={holdings} />,
};

/**
 * 슬롯이 성기게 찬 요약 행. 두 줄이 아니라 한 줄뿐이라 내용만으로는
 * 행 높이가 44px 에도 못 미친다 — 이때 행을 64px 로 지탱하는 것은
 * --tui-row-height 바닥 하나뿐이다.
 */
export const MobileSummarySparse: Story = {
  tags: ['visual-mobile'],
  render: () => (
    <Table
      columns={[
        { key: 'name', header: '종목' },
        { key: 'price', header: '현재가', numeric: true, render: (v: number) => won(v) },
      ]}
      data={holdings}
    />
  ),
};

/** 모든 열을 비교해야 하는 화면은 가로 스크롤을 명시적으로 고른다. */
export const MobileScroll: Story = {
  tags: ['visual-mobile'],
  render: () => <Table columns={holdingColumns} data={holdings} mobileVariant="scroll" />,
};
