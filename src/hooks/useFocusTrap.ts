import { useEffect, useRef, type RefObject } from 'react';

// 널리 쓰이는 "포커스 가능 요소" 셀렉터. 각 항목의 이유:
// - a[href]            : 링크는 href 가 있어야 실제로 포커스/활성화 가능하다.
// - button, input, select, textarea : 기본 폼 컨트롤. disabled 는 아래서 별도로 걸러낸다.
// - [tabindex]          : 개발자가 명시적으로 탭 순서에 넣은 임의 요소(div 등).
//   tabindex="-1" 는 스크립트로만 포커스 가능하고 Tab 순서에는 들어가지 않아야
//   하므로 :not([tabindex="-1"]) 로 제외한다.
// - [contenteditable]   : 편집 가능한 영역도 텍스트 입력처럼 포커스 대상이다.
const FOCUSABLE_SELECTOR = [
  'a[href]:not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]:not([contenteditable="false"]):not([tabindex="-1"])',
].join(', ');

/**
 * container 안에서 현재 포커스 가능한 요소만 골라 문서 순서대로 반환한다.
 * 열린 뒤에도 내용이 바뀔 수 있으므로(리스트 추가/제거 등) 이 함수는
 * 캐시하지 않고 매번 새로 호출해야 한다.
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const candidates = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  );
  // display:none 요소는 포커스할 수 없다.
  // 브라우저에서는 흔히 offsetParent !== null 로 감춰짐을 판별하지만,
  // jsdom 은 레이아웃을 계산하지 않아 모든 요소의 offsetParent 가 항상 null 이라
  // (display:none 여부와 무관하게) 이 체크로는 테스트 환경에서 아무것도 통과하지
  // 못한다. 대신 getComputedStyle(...).display 는 인라인 스타일/속성으로 지정한
  // display:none 을 jsdom 에서도 정확히 반영하므로 이를 기준으로 삼는다.
  return candidates.filter((el) => getComputedStyle(el).display !== 'none');
}

/**
 * container 안에 포커스를 가두는 훅.
 *
 * - active 가 참이 되는 순간 컨테이너 안 첫 포커스 가능 요소로 포커스를 옮긴다.
 *   후보가 없으면 컨테이너 자신에 tabIndex=-1 을 부여하고 포커스한다.
 * - active 인 동안 Tab/Shift+Tab 이 경계를 넘으면 반대쪽 끝으로 순환시킨다.
 *   포커스 가능 목록은 Tab 을 누를 때마다 다시 계산한다 — 시트 내용이 열린
 *   뒤에 바뀔 수 있기 때문에(항목 추가/삭제) 캐시하면 최신 상태를 놓친다.
 * - active 가 거짓이 되면 트랩이 열리기 직전에 포커스를 갖고 있던 요소로
 *   되돌린다. 그 요소가 더 이상 문서에 없으면 아무것도 하지 않는다.
 *
 * 컴포넌트에 의존하지 않는다 — ref 와 boolean 만 받는다.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
): void {
  // 트랩이 열리기 직전 포커스를 담아둔다. 컴포넌트 리렌더와 무관해야 하므로 ref.
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // 열릴 때: 이전 포커스를 기억하고 컨테이너 안으로 포커스를 옮긴다.
  useEffect(() => {
    const container = containerRef.current;
    if (!active || !container) return;

    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const [first] = getFocusableElements(container);
    if (first) {
      first.focus();
    } else {
      container.tabIndex = -1;
      container.focus();
    }

    // 닫힐 때(정리 함수): 직전 포커스로 되돌린다. 사라졌으면 아무것도 하지 않는다.
    return () => {
      const previous = previouslyFocusedRef.current;
      if (previous && document.contains(previous)) {
        previous.focus();
      }
      previouslyFocusedRef.current = null;
    };
  }, [active, containerRef]);

  // active 인 동안 Tab 을 가로채 경계에서 순환시킨다.
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      // 매번 다시 계산한다 — 캐시하면 열린 뒤 추가/삭제된 요소를 놓친다.
      const focusable = getFocusableElements(container);
      if (focusable.length === 0) {
        // 포커스를 줄 곳이 없으면 컨테이너 밖으로 나가지 못하게만 막는다.
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey) {
        if (activeElement === first || !focusable.includes(activeElement as HTMLElement)) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (activeElement === last || !focusable.includes(activeElement as HTMLElement)) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    container.addEventListener('keydown', onKeyDown);
    return () => container.removeEventListener('keydown', onKeyDown);
  }, [active, containerRef]);
}
