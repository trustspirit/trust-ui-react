// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Table } from '../../src/components/Table/Table';
import type { Column } from '../../src/components/Table/types';

afterEach(cleanup);

interface Row {
  name: string;
  value: number;
}

const data: Row[] = [
  { name: '가나다', value: 30 },
  { name: '나다라', value: 10 },
  { name: '다라마', value: 20 },
];

function nameColumn(): Column<Row> {
  return { key: 'name', header: '이름' };
}

function valueColumn(over: Partial<Column<Row>> = {}): Column<Row> {
  return { key: 'value', header: '값', sortable: true, numeric: true, ...over };
}

/** tbody 안의 각 행이 '이름' 열에서 보여주는 값의 순서. */
function bodyOrder(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('tbody tr')).map(
    (tr) => tr.querySelector('td')?.textContent ?? '',
  );
}

describe('Table 정렬', () => {
  it('머리를 클릭하면 순서가 바뀌고 aria-sort 가 세 상태를 오간다', async () => {
    const user = userEvent.setup();
    const { container } = render(<Table columns={[nameColumn(), valueColumn()]} data={data} />);

    // 초기: 정렬 안 됨 — aria-sort 속성 자체가 없다.
    const header = screen.getByRole('columnheader', { name: '값' });
    expect(header).not.toHaveAttribute('aria-sort');
    expect(bodyOrder(container)).toEqual(['가나다', '나다라', '다라마']);

    const sortButton = within(header).getByRole('button');

    // 1클릭: 오름차순
    await user.click(sortButton);
    expect(header).toHaveAttribute('aria-sort', 'ascending');
    expect(bodyOrder(container)).toEqual(['나다라', '다라마', '가나다']); // 10, 20, 30

    // 2클릭: 내림차순
    await user.click(sortButton);
    expect(header).toHaveAttribute('aria-sort', 'descending');
    expect(bodyOrder(container)).toEqual(['가나다', '다라마', '나다라']); // 30, 20, 10

    // 3클릭: 정렬 해제 — 원래 순서로 되돌아오고 aria-sort 가 다시 사라진다.
    await user.click(sortButton);
    expect(header).not.toHaveAttribute('aria-sort');
    expect(bodyOrder(container)).toEqual(['가나다', '나다라', '다라마']);
  });
});

describe('Table 총계 행', () => {
  it('summaryRow 는 tfoot 에 그려지고, 정렬·클릭 대상이 아니다', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    const { container } = render(
      <Table
        columns={[nameColumn(), valueColumn()]}
        data={data}
        summaryRow={{ name: '합계', value: 60 }}
        onRowClick={onRowClick}
      />,
    );

    const tfoot = container.querySelector('tfoot');
    expect(tfoot).not.toBeNull();
    expect(tfoot?.textContent).toContain('합계');

    // 본문 행 수는 여전히 데이터 길이와 같다 — 총계 행이 tbody 로 새지 않았다.
    expect(container.querySelectorAll('tbody > tr')).toHaveLength(data.length);

    // tfoot 안에는 정렬 버튼(머리에만 있는 것)이 전혀 없다 — 정렬 대상이 아니다.
    expect(tfoot?.querySelectorAll('button')).toHaveLength(0);

    // tfoot 을 클릭해도 onRowClick 이 불리지 않는다 — 클릭 대상이 아니다.
    const tfootCell = tfoot!.querySelector('td')!;
    await user.click(tfootCell);
    expect(onRowClick).not.toHaveBeenCalled();

    // 대조군: 본문 행을 클릭하면 정상적으로 불린다.
    const bodyCell = container.querySelector('tbody td')!;
    await user.click(bodyCell);
    expect(onRowClick).toHaveBeenCalledTimes(1);
  });
});

describe('Table onRowClick', () => {
  it('onRowClick 이 있어도 <tr> 에는 tabIndex 를 붙이지 않는다', () => {
    // <tr> 은 role="grid" 밖에서는 상호작용 구성요소가 아니다 — 이 판정이
    // 되돌려지면(예: 키보드 레이어를 다시 절반쯤 붙이면) 이 테스트가 잡는다.
    const { container } = render(
      <Table columns={[nameColumn(), valueColumn()]} data={data} onRowClick={() => {}} />,
    );

    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.getAttribute('tabindex')).toBeNull();
    }
  });

  it('onRowClick 이 없으면 행 클릭이 아무 효과가 없다', async () => {
    const user = userEvent.setup();
    const { container } = render(<Table columns={[nameColumn(), valueColumn()]} data={data} />);
    const cell = container.querySelector('tbody td')!;
    // 에러 없이 클릭이 끝나면 충분하다 — onRowClick 이 없을 때 아무 핸들러도
    // 걸리지 않았음을 간접적으로 보여준다.
    await expect(user.click(cell)).resolves.not.toThrow();
  });
});

describe('Table 빈 상태', () => {
  it('data 가 비어 있으면 emptyText 를 보여준다', () => {
    render(<Table columns={[nameColumn(), valueColumn()]} data={[]} emptyText="데이터가 없어요" />);
    expect(screen.getByText('데이터가 없어요')).toBeDefined();
  });
});

describe('Table Column.render 호출 횟수', () => {
  it('render 는 (열, 행)당 정확히 한 번만 불린다 — 모바일 요약 칸과 중복 호출되지 않는다', () => {
    // mobileVariant 기본값은 'summary' 다. 요약 칸이 데스크톱 칸과 같은
    // 내용을 보여주므로, 값을 두 번 계산하면(예: 요약 칸에서 render 를
    // 다시 부르면) display:none 여부와 무관하게 스파이 호출 수가 늘어난다.
    const renderSpy = vi.fn((value: unknown) => String(value));
    const columns: Column<Row>[] = [nameColumn(), valueColumn({ render: renderSpy })];

    render(<Table columns={columns} data={data} />);

    expect(renderSpy).toHaveBeenCalledTimes(data.length);
    data.forEach((row, index) => {
      expect(renderSpy).toHaveBeenNthCalledWith(index + 1, row.value, row, index);
    });
  });

  it('summaryRow 가 있어도 총계 행 자신의 render 호출은 한 번 추가될 뿐이다', () => {
    const renderSpy = vi.fn((value: unknown) => (value == null ? '—' : String(value)));
    const columns: Column<Row>[] = [nameColumn(), valueColumn({ render: renderSpy })];

    render(
      <Table columns={columns} data={data} summaryRow={{ name: '합계', value: 60 }} />,
    );

    // 본문 행 3번 + 총계 행 1번 = 4번. 두 배(8번)가 되면 요약 칸이나
    // 총계 행에서 render 를 다시 부르고 있다는 뜻이다.
    expect(renderSpy).toHaveBeenCalledTimes(data.length + 1);
    // 마지막 호출이 총계 행(index === -1)이다.
    expect(renderSpy).toHaveBeenLastCalledWith(60, { name: '합계', value: 60 }, -1);
  });
});
