/**
 * Ref-counted background inertification. Mirrors scrollLock.ts's shape for
 * the same class of problem: multiple overlays can be mounted at once (e.g.
 * a BottomSheet-to-BottomSheet transition — the closing sheet stays mounted
 * for its exit animation while the next sheet opens on top of it). Each
 * caller acquires() on mount and releases() on unmount; only the very first
 * acquire actually applies inert, and only the very last release actually
 * restores.
 *
 * F2: 시트가 각자 자기 스냅샷을 들고 있으면, 시트 A 가 퇴장 애니메이션
 * 중(여전히 mounted) 시트 B 가 열렸다가, A 의 애니메이션이 끝나 A 가
 * 언마운트될 때 "A 를 열기 전엔 배경이 inert 가 아니었다"는 A 자신의
 * 스냅샷으로 배경을 복구해버린다 — B 가 아직 열려 있는데도 배경의 격리가
 * 풀리고, 이어서 B 의 포커스 트랩과 무관하게 A 쪽 트리거로 포커스가 튈 수
 * 있다. scrollLock.ts 와 같은 참조 카운트로 고친다: 카운트가 0→1 이 될 때만
 * 스냅샷을 뜨고 실제로 inert 를 걸며, 카운트가 1→0 이 될 때만 그 스냅샷으로
 * 되돌린다. 이미 inert(또는 aria-hidden) 였던 요소는 원래 있던 값 그대로
 * 복구되므로, 여러 시트가 겹쳐 열리고 전부 닫힌 뒤에도 "원래 inert 였던
 * 요소는 계속 inert" 라는 불변식이 유지된다.
 */

// inert 는 대부분의 최신 브라우저(크롬 102+, 사파리 15.5+, 파이어폭스 112+)에
// 있지만, 이 값은 모듈 로드 시 한 번만 확인해 매 acquire 마다 다시 묻지
// 않는다. 없으면 aria-hidden 으로 물러난다 — BottomSheet.tsx 상단 주석에
// 적었듯 포인터 격리는 이 폴백으로 보장되지 않는다.
const SUPPORTS_INERT =
  typeof HTMLElement !== 'undefined' && 'inert' in HTMLElement.prototype;

interface InertSnapshot {
  el: Element;
  hadAttr: boolean;
  prevValue: string | null;
}

let lockCount = 0;
let snapshots: InertSnapshot[] = [];

/**
 * document.body 의 직계 자식 중 `exclude` 에 없는 것들을 비활성화한다.
 * 이미 잠금이 걸려 있으면(다른 시트가 먼저 acquire 했으면) 아무 것도 새로
 * 하지 않고 카운트만 올린다 — 그래서 나중에 연 시트 자신의 배경/시트 노드는
 * (당연히 존재하지 않았으므로) 스냅샷 대상에 포함되지 않고, 먼저 연 시트가
 * 이미 걸어둔 격리도 건드리지 않는다.
 */
export function acquireBackgroundInert(exclude: (Element | null)[]): void {
  if (typeof document === 'undefined') return;

  if (lockCount === 0) {
    const attr = SUPPORTS_INERT ? 'inert' : 'aria-hidden';
    const siblings = Array.from(document.body.children).filter(
      (el) => !exclude.includes(el),
    );
    snapshots = siblings.map((el) => ({
      el,
      hadAttr: el.hasAttribute(attr),
      prevValue: el.getAttribute(attr),
    }));

    siblings.forEach((el) => {
      el.setAttribute(attr, SUPPORTS_INERT ? '' : 'true');
    });
  }

  lockCount += 1;
}

/**
 * 마지막 release 에서만 실제로 스냅샷을 복구한다. 그 전까지의 release 는
 * 카운트만 내린다 — 아직 다른 시트가 열려 있는 동안 배경 격리가 풀리는 것을
 * 막기 위함이다.
 */
export function releaseBackgroundInert(): void {
  if (typeof document === 'undefined') return;
  if (lockCount === 0) return; // defensive — release without acquire

  lockCount -= 1;
  if (lockCount === 0) {
    const attr = SUPPORTS_INERT ? 'inert' : 'aria-hidden';
    snapshots.forEach(({ el, hadAttr, prevValue }) => {
      if (hadAttr) {
        el.setAttribute(attr, prevValue!);
      } else {
        el.removeAttribute(attr);
      }
    });
    snapshots = [];
  }
}
