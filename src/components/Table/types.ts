import type { CSSProperties, ReactNode } from 'react';

/** 수치의 방향. 색은 글자에만 쓴다 — 배경·배지·테두리에 쓰지 않는다. */
export type Tone = 'rise' | 'fall' | 'neutral';

/** 모바일 요약 2행에서 열이 차지하는 자리. */
export type MobileSlot = 'primary' | 'secondary' | 'value' | 'delta' | 'hidden';

export interface Column<T> {
  /** 행 객체에서 값을 꺼낼 경로. 점 표기로 중첩 접근을 지원한다 ("price.close") */
  key: string;
  /** 열 머리 글자 */
  header: string;
  /**
   * 셀 렌더러. 지정하지 않으면 값을 그대로 그린다.
   * 요약 행과 데스크톱 칸이 같은 결과를 써야 하므로 render 는 순수해야
   * 한다(부수 효과를 넣지 않는다) — 행마다 한 번만 호출되고 두 곳이 나눠 쓴다.
   *
   * 총계 행에서는 row 가 Partial<T> 다 — summaryRow 에 없는 필드는
   * undefined 이므로 row 의 필드를 직접 읽을 때도 방어해야 한다
   * (index === -1 이 총계 행이라는 신호다).
   */
  render?: (value: any, row: T, index: number) => ReactNode;
  /** 정렬 가능 여부 */
  sortable?: boolean;
  /** 고정 열 너비 */
  width?: string | number;
  /**
   * 수치 열. 우측 정렬되고 머리도 같은 쪽으로 붙는다.
   * 등폭 숫자는 표 전체에 기본 적용되므로 이 값과 무관하다.
   */
  numeric?: boolean;
  /**
   * 글자색. 'auto' 는 값의 부호로 판정한다(양수 rise, 음수 fall, 0 neutral).
   * 상승/하락 색은 market.css 를 임포트한 앱에서만 나타나고,
   * 그러지 않으면 조용히 기본 잉크색으로 남는다.
   */
  tone?: 'auto' | 'none' | ((value: any, row: T) => Tone);
  /** 텍스트 정렬. numeric 이 지정한 우측 정렬을 덮어쓴다 */
  align?: 'left' | 'center' | 'right';
  /** 모바일 요약 행에서 이 열이 차지할 자리. 지정하지 않으면 추론한다 */
  mobileSlot?: MobileSlot;
}

export interface TableProps<T> {
  /** 열 정의 */
  columns: Column<T>[];
  /** 행 데이터 */
  data: T[];
  /** 스크롤 시 머리 고정 (기본 false) */
  stickyHeader?: boolean;
  /**
   * 좁은 화면에서의 표현.
   * 'summary'(기본) = 한 행이 두 줄을 차지하는 요약 행.
   * 'scroll' = 모든 열을 유지하고 가로로 스크롤한다.
   *
   * ⚠️ v1 의 기본값은 'scroll' 이었다. v1 에서 이 prop 을 지정하지 않고 쓰던
   * 코드를 v2 로 옮기면 컴파일 오류 없이 좁은 화면 동작만 조용히 바뀐다 —
   * 모든 열이 가로 스크롤로 보이던 것이, 네 자리(primary/value/secondary/
   * delta)만 남고 나머지 열은 화면에서 사라지는 요약 2행으로 바뀐다.
   * 예전과 같은 동작을 유지하려면 mobileVariant="scroll" 을 명시한다.
   */
  mobileVariant?: 'summary' | 'scroll';
  /** 호버 시 행 강조 (기본 true) */
  hoverable?: boolean;
  /** 데이터가 비었을 때의 글자 */
  emptyText?: string;
  /**
   * 표를 닫는 총계 행. 본문 행과 같은 열 정의·렌더러를 그대로 탄다.
   * 셀 렌더러의 index 인자로는 -1 이 들어온다 — 본문의 어느 행도 아니라는 뜻이다.
   * Partial<T> 이므로 값이 없는 열도 있을 수 있는데, 그런 열의 render 도
   * 여느 행과 똑같이 호출된다 — 다만 value 인자가 undefined 다. 그 칸에
   * 무엇을 그릴지(빈 칸이든 '—' 같은 자리표시자든)는 render 가 정한다.
   */
  summaryRow?: Partial<T>;
  /**
   * 행 클릭 핸들러 — 포인터 편의 기능이다.
   * <tr> 은 role="grid" 밖에서는 상호작용 구성요소가 아니므로 행 자체를
   * 포커스 가능하게 만들지 않는다. 키보드와 보조기술로 닿아야 하는 동작은
   * 셀 안에 실제 컨트롤(button/link)을 렌더해서 제공한다.
   */
  onRowClick?: (row: T, index: number) => void;
  /** 행 식별자 추출기 */
  rowKey?: string | ((row: T) => string);
  /** 추가 클래스 이름 */
  className?: string;
  /** 추가 인라인 스타일 */
  style?: CSSProperties;
}

export type SortDirection = 'asc' | 'desc' | null;

export interface SortState {
  key: string | null;
  direction: SortDirection;
}
