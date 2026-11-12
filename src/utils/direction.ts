/**
 * 요소가 오른쪽에서 왼쪽으로 읽는 문맥(아랍어·히브리어 등)에 있는가.
 * 가장 가까운 dir 속성이 명시적으로 rtl/ltr 이면 그것을 따르고, 없거나 auto 면
 * 브라우저가 계산한 direction 을 본다.
 */
export function isRtl(element: Element | null | undefined): boolean {
  if (!element || typeof window === 'undefined') return false;
  const dir = element.closest('[dir]')?.getAttribute('dir')?.toLowerCase();
  if (dir === 'rtl') return true;
  if (dir === 'ltr') return false;
  return window.getComputedStyle(element).direction === 'rtl';
}
