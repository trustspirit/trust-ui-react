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
 * 보이지 않는(또는 inert 인) 요소는 포커스 대상이 아니다.
 *
 * inert 는 checkVisibility() 가 판정해주지 않는 별개의 축이다 — 스펙상
 * inert 요소는 여전히 "보이지만" 상호작용만 막힌 상태라 checkVisibility() 는
 * inert 조상이 있어도 true 를 돌려준다(크롬 105+, 파이어폭스 122+, 사파리
 * 17.4+ 등 대부분의 실제 브라우저에서). 그래서 inert 는 checkVisibility 분기
 * 안이 아니라 항상 독립적으로, 가장 먼저 확인한다. container 위쪽 조상의
 * inert 는 이 트랩과 무관하므로 container.contains 로 범위를 제한한다.
 * Task 2 가 배경 콘텐츠에 inert 를 붙일 예정이므로, 이걸 놓치면 트랩이
 * 배경(비활성 영역)으로 포커스를 넘기는 자체 버그가 된다.
 */
function hasInertAncestorWithin(el: HTMLElement, container: HTMLElement): boolean {
  const inertAncestor = el.closest('[inert]');
  return inertAncestor !== null && container.contains(inertAncestor);
}

/**
 * CSS 상 보이는지 확인한다 (inert 는 위에서 이미 걸렀으므로 여기서는 다루지
 * 않는다).
 *
 * checkVisibility() 가 있으면 그것을 쓴다 — 조상 display/visibility,
 * content-visibility 를 플랫폼이 한 번에 판정해준다. 이 저장소의 테스트
 * 환경(jsdom v28)에는 아직 구현되어 있지 않아(typeof 가 'undefined') 아래
 * 수동 순회가 테스트에서 실제로 쓰인다.
 *
 * 수동 경로에서 display 는 조상까지 거슬러 올라가며 확인해야 한다 —
 * getComputedStyle 은 조상의 display:none 을 자기 것으로 접어 넣지 않는다
 * (감춰진 블록 안의 버튼도 자기 display 는 그대로 inline-block 이다).
 * 반면 visibility 는 상속되는 속성이라 getComputedStyle 이 이미 상속과
 * 자손의 재정의(visibility:hidden 조상 안에서 visibility:visible 로 되돌린
 * 경우)까지 계산해서 알려주므로, 자기 자신의 값만 보면 된다 — 조상을 따로
 * 훑으면 이런 재정의 사례를 잘못 배제하게 된다.
 */
function isCssVisible(el: HTMLElement, container: HTMLElement): boolean {
  if (typeof el.checkVisibility === 'function') {
    return el.checkVisibility({
      opacityProperty: false,
      visibilityProperty: true,
    });
  }

  let node: HTMLElement | null = el;
  while (node) {
    if (getComputedStyle(node).display === 'none') return false;
    if (node === container) break;
    node = node.parentElement;
  }
  return getComputedStyle(el).visibility !== 'hidden';
}

function isVisible(el: HTMLElement, container: HTMLElement): boolean {
  if (hasInertAncestorWithin(el, container)) return false;
  return isCssVisible(el, container);
}

/**
 * container 안에서 현재 포커스 가능한 요소만 골라 문서 순서대로 반환한다.
 * 열린 뒤에도 내용이 바뀔 수 있으므로(리스트 추가/제거 등) 이 함수는
 * 캐시하지 않고 매번 새로 호출해야 한다.
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const candidates = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  );
  return candidates.filter((el) => isVisible(el, container));
}

/**
 * container 안에 포커스를 가두는 훅.
 *
 * - active 가 참이 되는 순간 컨테이너 안 첫 포커스 가능 요소로 포커스를 옮긴다.
 *   후보가 없으면 컨테이너 자신에 tabIndex=-1 을 부여하고 포커스한다(닫힐 때
 *   원래 tabindex 상태 — 아예 없었는지, 다른 값이 있었는지 — 로 되돌린다).
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

  useEffect(() => {
    // active 와 container 존재 여부는 아래 두 동작(초기 포커스 이동, Tab 가로채기)
    // 모두에 공통으로 필요한 전제라 하나의 effect 로 묶어 가드를 한 번만 둔다.
    const container = containerRef.current;
    if (!active || !container) return;

    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const [first] = getFocusableElements(container);
    // 컨테이너에 tabIndex 를 직접 부여했을 때만 복구 함수를 채운다 — 이미
    // 포커스 가능한 자식이 있었다면 컨테이너의 tabindex 를 건드리지 않는다.
    let restoreContainerTabIndex: (() => void) | null = null;
    if (first) {
      first.focus();
    } else {
      const hadTabIndexAttr = container.hasAttribute('tabindex');
      const previousTabIndexValue = container.getAttribute('tabindex');
      container.tabIndex = -1;
      container.focus();
      restoreContainerTabIndex = () => {
        if (hadTabIndexAttr) {
          container.setAttribute('tabindex', previousTabIndexValue!);
        } else {
          container.removeAttribute('tabindex');
        }
      };
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      // 매번 다시 계산한다 — 캐시하면 열린 뒤 추가/삭제된 요소를 놓친다.
      const focusable = getFocusableElements(container);
      if (focusable.length === 0) {
        // 포커스를 줄 곳이 없으면 컨테이너 밖으로 나가지 못하게만 막는다.
        event.preventDefault();
        return;
      }

      const firstFocusable = focusable[0];
      const lastFocusable = focusable[focusable.length - 1];
      const activeElement =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      const isKnownActiveElement =
        activeElement != null && focusable.includes(activeElement);

      if (event.shiftKey) {
        if (!isKnownActiveElement || activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (!isKnownActiveElement || activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    container.addEventListener('keydown', onKeyDown);

    // 닫힐 때: 리스너를 떼고, 컨테이너에 준 tabindex 를 복구하고,
    // 직전 포커스로 되돌린다. 그 요소가 사라졌으면 아무것도 하지 않는다.
    return () => {
      container.removeEventListener('keydown', onKeyDown);
      restoreContainerTabIndex?.();

      const previous = previouslyFocusedRef.current;
      if (previous && document.contains(previous)) {
        previous.focus();
      }
      previouslyFocusedRef.current = null;
    };
  }, [active, containerRef]);
}
