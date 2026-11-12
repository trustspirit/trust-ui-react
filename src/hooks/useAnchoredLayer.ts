import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react';
import {
  computeAnchoredPosition,
  getLayerContainer,
  isInsideSheet,
  type Alignment,
  type AnchoredPosition,
  type Placement,
} from '../utils/anchoredPosition';
import { isRtl } from '../utils/direction';

// 서버 렌더에서 useLayoutEffect 는 경고만 내고 아무 일도 하지 않는다.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export interface UseAnchoredLayerOptions {
  /** Whether the layer is currently rendered. */
  open: boolean;
  /** The element the layer is attached to (trigger). */
  anchorRef: RefObject<HTMLElement | null>;
  /** The floating element itself. */
  layerRef: RefObject<HTMLElement | null>;
  placement?: Placement;
  align?: Alignment;
  /** Gap between anchor and layer in px. Default 4. */
  offset?: number;
  /** Give the layer the anchor's width (select-style dropdowns). */
  matchAnchorWidth?: boolean;
}

export interface AnchoredLayer {
  /** Spread onto the layer element. Hidden until the first measurement. */
  style: CSSProperties;
  /** Side actually used after collision handling. */
  placement: Placement;
  /** Where to portal the layer: the enclosing modal <dialog>, otherwise body. */
  container: HTMLElement | null;
  /** Recompute now (content changed size, etc.). */
  update: () => void;
}

/**
 * 트리거 옆에 뜨는 레이어의 공통 동작: 포털 위치, 화면 충돌 처리, 스크롤·리사이즈 추적.
 * 좌표는 뷰포트 기준(position: fixed)이라 스크롤 컨테이너나 dialog 의 overflow 에 잘리지 않는다.
 */
export function useAnchoredLayer({
  open,
  anchorRef,
  layerRef,
  placement = 'bottom',
  align = 'start',
  offset = 4,
  matchAnchorWidth = false,
}: UseAnchoredLayerOptions): AnchoredLayer {
  const [position, setPosition] = useState<AnchoredPosition | null>(null);
  const [anchorWidth, setAnchorWidth] = useState<number | undefined>(undefined);

  const update = useCallback(() => {
    const anchor = anchorRef.current;
    const layer = layerRef.current;
    if (!anchor || !layer) return;

    const anchorRect = anchor.getBoundingClientRect();
    // 이전에 건 max-height 가 걸린 채로 재면 "들어간다"고 오판한다. 잠시 풀고 잰다.
    const previousMaxHeight = layer.style.maxHeight;
    layer.style.maxHeight = 'none';
    const size = { width: layer.offsetWidth, height: layer.offsetHeight };
    layer.style.maxHeight = previousMaxHeight;

    setAnchorWidth(anchorRect.width);
    setPosition(
      computeAnchoredPosition({
        anchor: anchorRect,
        layer: matchAnchorWidth ? { ...size, width: anchorRect.width } : size,
        viewport: {
          width: document.documentElement.clientWidth || window.innerWidth,
          height: window.innerHeight,
        },
        placement,
        align,
        offset,
        rtl: isRtl(anchor),
      }),
    );
  }, [anchorRef, layerRef, placement, align, offset, matchAnchorWidth]);

  // 그리기 전에 잰다. 그러지 않으면 한 프레임 동안 (0,0) 에 보인다.
  useIsomorphicLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    update();
  }, [open, update]);

  useEffect(() => {
    if (!open) return;
    // 캡처 단계로 듣는다: 페이지뿐 아니라 중간 스크롤 컨테이너의 스크롤도 잡는다.
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);

    // 내용이 늦게 채워지거나 글꼴이 바뀌어 크기가 달라지는 경우.
    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(update);
      if (layerRef.current) observer.observe(layerRef.current);
      if (anchorRef.current) observer.observe(anchorRef.current);
    }
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
      observer?.disconnect();
    };
  }, [open, update, anchorRef, layerRef]);

  const anchor = anchorRef.current;
  const style: CSSProperties = {
    position: 'fixed',
    // 소수 좌표에 놓이면 글자와 1px 테두리가 흐려진다. 정수 픽셀에 맞춘다.
    top: Math.round(position?.top ?? 0),
    left: Math.round(position?.left ?? 0),
    maxHeight: position?.maxHeight,
    width: matchAnchorWidth ? anchorWidth : undefined,
    visibility: position ? 'visible' : 'hidden',
    // 시트는 z-index 로 떠 있다. 그 안에서 연 레이어는 시트보다 위에 있어야 보인다.
    zIndex: open && isInsideSheet(anchor) ? ('calc(var(--tui-z-bottom-sheet) + 1)' as unknown as number) : undefined,
  };

  return {
    style,
    placement: position?.placement ?? placement,
    container: open ? getLayerContainer(anchor) : null,
    update,
  };
}
