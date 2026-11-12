/**
 * 앵커(트리거) 옆에 뜨는 레이어의 위치 계산. Menu, Select, DatePicker, Tooltip 등이
 * 각자 구현하던 것을 한곳에 모은다. DOM 을 건드리지 않는 순수 함수라 단위 테스트가
 * 가능하고, 모든 좌표는 뷰포트 기준(position: fixed 용)이다.
 */

export type Placement = 'bottom' | 'top' | 'left' | 'right';
export type Alignment = 'start' | 'center' | 'end';

export interface RectLike {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface AnchoredPositionInput {
  anchor: RectLike;
  layer: { width: number; height: number };
  viewport: { width: number; height: number };
  /** Preferred side. Flips to the opposite side when it does not fit there. Default 'bottom'. */
  placement?: Placement;
  /** Alignment along the anchor's edge. Default 'start'. */
  align?: Alignment;
  /** Gap between anchor and layer. Default 4. */
  offset?: number;
  /** Minimum distance kept from every viewport edge. Default 8. */
  padding?: number;
  /** Right-to-left context: `start` and `end` swap sides for top/bottom placements. */
  rtl?: boolean;
}

export interface AnchoredPosition {
  top: number;
  left: number;
  /** The side actually used after flipping. */
  placement: Placement;
  /** Room available on the chosen side; apply as max-height so long content scrolls. */
  maxHeight: number;
}

const OPPOSITE: Record<Placement, Placement> = {
  bottom: 'top',
  top: 'bottom',
  left: 'right',
  right: 'left',
};

/** 화면 안으로 당긴다. 레이어가 화면보다 크면 시작 쪽 여백을 우선한다. */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

export function computeAnchoredPosition({
  anchor,
  layer,
  viewport,
  placement = 'bottom',
  align = 'start',
  offset = 4,
  padding = 8,
  rtl = false,
}: AnchoredPositionInput): AnchoredPosition {
  const vertical = placement === 'bottom' || placement === 'top';

  // 각 방향에 남은 공간(여백과 간격을 뺀 것).
  const room: Record<Placement, number> = {
    bottom: viewport.height - anchor.bottom - offset - padding,
    top: anchor.top - offset - padding,
    right: viewport.width - anchor.right - offset - padding,
    left: anchor.left - offset - padding,
  };

  // 원하는 쪽에 들어가지 않고 반대쪽이 더 넓을 때만 뒤집는다.
  const needed = vertical ? layer.height : layer.width;
  const side =
    needed > room[placement] && room[OPPOSITE[placement]] > room[placement]
      ? OPPOSITE[placement]
      : placement;

  const alongStart = vertical ? anchor.left : anchor.top;
  const alongSize = vertical ? anchor.width : anchor.height;
  const layerAlong = vertical ? layer.width : layer.height;
  const viewportAlong = vertical ? viewport.width : viewport.height;

  // 위·아래 배치의 start/end 는 글 방향을 따른다. RTL 에서 start 는 오른쪽 가장자리다.
  // 좌·우 배치의 교차축은 세로라 방향과 무관하다.
  const effectiveAlign: Alignment =
    rtl && vertical && align !== 'center' ? (align === 'start' ? 'end' : 'start') : align;

  let along = alongStart;
  if (effectiveAlign === 'center') along = alongStart + alongSize / 2 - layerAlong / 2;
  if (effectiveAlign === 'end') along = alongStart + alongSize - layerAlong;
  along = clamp(along, padding, Math.max(padding, viewportAlong - layerAlong - padding));

  let top: number;
  let left: number;
  if (side === 'bottom' || side === 'top') {
    const height = Math.min(layer.height, Math.max(0, room[side]));
    top = side === 'bottom' ? anchor.bottom + offset : anchor.top - offset - height;
    left = along;
  } else {
    left = side === 'right' ? anchor.right + offset : anchor.left - offset - layer.width;
    top = along;
  }

  const maxHeight =
    side === 'bottom' || side === 'top'
      ? Math.max(0, room[side])
      : Math.max(0, viewport.height - padding * 2);

  return { top, left, placement: side, maxHeight };
}

/**
 * 레이어를 어디에 포털할지 정한다.
 * showModal() 로 열린 <dialog> 는 top layer 에 있어서, body 에 붙인 레이어는
 * 그 아래에 깔리고 비활성(inert) 상태가 된다. 그 dialog 안으로 넣어야 한다.
 */
export function getLayerContainer(anchor: Element | null | undefined): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  return anchor?.closest('dialog') ?? document.body;
}

/**
 * 앵커가 시트(top layer 가 아닌 role="dialog") 안에 있는가.
 * 시트는 z-index 로 떠 있으므로, 그 안에서 연 레이어는 시트보다 위여야 보인다.
 */
export function isInsideSheet(anchor: Element | null | undefined): boolean {
  return !!anchor?.closest('[role="dialog"][aria-modal="true"]:not(dialog)');
}
