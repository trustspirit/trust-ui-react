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
  onDragStart?: () => void;
  onDrag?: (offset: DragOffset) => void;
  onDragEnd?: (offset: DragOffset, velocity: DragVelocity) => void;
}

/**
 * Pointer-events-based drag tracking. Reports offset and velocity. Does NOT
 * apply transforms or modify the DOM itself — that's the caller's job.
 *
 * Velocity is computed from the last two pointermove samples (px/ms).
 */
export function useDrag(
  ref: RefObject<HTMLElement | null>,
  options: UseDragOptions = {},
): void {
  const optsRef = useRef(options);
  optsRef.current = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let dragging = false;
    let activeId: number | null = null;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;
    let lastTime = 0;

    const onDown = (e: PointerEvent) => {
      if (dragging) return;
      dragging = true;
      activeId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      lastX = e.clientX;
      lastY = e.clientY;
      lastTime = performance.now();
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
      lastX = e.clientX;
      lastY = e.clientY;
      lastTime = performance.now();
    };

    const onUp = (e: PointerEvent) => {
      if (!dragging || activeId !== e.pointerId) return;
      dragging = false;
      activeId = null;
      const axis = optsRef.current.axis ?? 'both';
      const dt = Math.max(performance.now() - lastTime, 1);
      const offset: DragOffset = {
        x: axis === 'y' ? 0 : e.clientX - startX,
        y: axis === 'x' ? 0 : e.clientY - startY,
      };
      const velocity: DragVelocity = {
        x: axis === 'y' ? 0 : (e.clientX - lastX) / dt,
        y: axis === 'x' ? 0 : (e.clientY - lastY) / dt,
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
  }, [ref]);
}
