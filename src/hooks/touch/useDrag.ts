import { useEffect, useRef, type RefObject } from 'react';

export interface DragOffset {
  x: number;
  y: number;
}

export interface DragVelocity {
  x: number;
  y: number;
}

export interface UseDragOptions {
  /** Restrict drag to a single axis. Default 'both'. */
  axis?: 'x' | 'y' | 'both';
  /**
   * Whether listeners should be attached. Default true.
   * Pass the mount state of a conditionally rendered target here: a ref object
   * never changes identity, so without this the hook cannot tell that the
   * element appeared after the first render.
   */
  enabled?: boolean;
  onDragStart?: () => void;
  onDrag?: (offset: DragOffset) => void;
  onDragEnd?: (offset: DragOffset, velocity: DragVelocity) => void;
}

/**
 * Pointer-events-based drag tracking. Reports offset and velocity. Does NOT
 * apply transforms or modify the DOM itself — that's the caller's job.
 *
 * Velocity is computed from the last two pointermove samples (px/ms). If the
 * pointer rested for longer than `REST_MS` before release, velocity is zero.
 */
const REST_MS = 100;

export function useDrag(
  ref: RefObject<HTMLElement | null>,
  options: UseDragOptions = {},
): void {
  const optsRef = useRef(options);
  optsRef.current = options;
  const enabled = options.enabled ?? true;

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    let dragging = false;
    let activeId: number | null = null;
    let startX = 0;
    let startY = 0;
    // 직전 두 개의 move 표본. 속도는 이 둘의 차이로 구한다.
    let prevX = 0;
    let prevY = 0;
    let prevTime = 0;
    let lastX = 0;
    let lastY = 0;
    let lastTime = 0;

    const onDown = (e: PointerEvent) => {
      if (dragging) return;
      dragging = true;
      activeId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      lastX = prevX = e.clientX;
      lastY = prevY = e.clientY;
      lastTime = prevTime = performance.now();
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* may fail in rare conditions */
      }
      optsRef.current.onDragStart?.();
    };

    const onMove = (e: PointerEvent) => {
      if (!dragging || activeId !== e.pointerId) return;
      const axis = optsRef.current.axis ?? 'both';
      const offset: DragOffset = {
        x: axis === 'y' ? 0 : e.clientX - startX,
        y: axis === 'x' ? 0 : e.clientY - startY,
      };
      optsRef.current.onDrag?.(offset);
      prevX = lastX;
      prevY = lastY;
      prevTime = lastTime;
      lastX = e.clientX;
      lastY = e.clientY;
      lastTime = performance.now();
    };

    const onUp = (e: PointerEvent) => {
      if (!dragging || activeId !== e.pointerId) return;
      dragging = false;
      activeId = null;
      const axis = optsRef.current.axis ?? 'both';
      // 놓기 직전에 멈춰 있었다면 튕긴 것이 아니다.
      const rested = performance.now() - lastTime > REST_MS;
      const dt = Math.max(lastTime - prevTime, 1);
      const offset: DragOffset = {
        x: axis === 'y' ? 0 : e.clientX - startX,
        y: axis === 'x' ? 0 : e.clientY - startY,
      };
      const velocity: DragVelocity = {
        x: axis === 'y' || rested ? 0 : (lastX - prevX) / dt,
        y: axis === 'x' || rested ? 0 : (lastY - prevY) / dt,
      };
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* ok */
      }
      optsRef.current.onDragEnd?.(offset, velocity);
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
    };
  }, [ref, enabled]);
}
