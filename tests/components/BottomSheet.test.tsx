// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { BottomSheet } from '../../src/components/BottomSheet';

afterEach(cleanup);

// 트리거 버튼 + BottomSheet — open 을 state 로 토글해 실제 사용 패턴을 흉내낸다.
function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(true)}>열기</button>
      <BottomSheet open={open} onClose={() => setOpen(false)}>
        <button>안의 버튼</button>
      </BottomSheet>
    </div>
  );
}

describe('BottomSheet', () => {
  it('열리면 포커스가 시트 안으로 들어가고, 닫히면 트리거로 되돌아온다', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const openButton = screen.getByRole('button', { name: '열기' });
    openButton.focus();
    expect(openButton).toHaveFocus();

    await user.click(openButton);
    const insideButton = await screen.findByRole('button', { name: '안의 버튼' });
    expect(insideButton).toHaveFocus();

    // Escape 로 닫는다 — 실제 사용자 경로(브라우저 확인에서 쓴 경로)와 같다.
    await user.keyboard('{Escape}');

    // 퇴장 애니메이션(280ms) 이 끝나 mounted 가 false 로 바뀐 뒤에야
    // 포커스 복구 클린업이 실행된다.
    await waitFor(() => expect(openButton).toHaveFocus(), { timeout: 2000 });
    // body 로 떨어지지 않았다는 것도 명시적으로 확인한다.
    expect(document.activeElement).not.toBe(document.body);
  });

  // jsdom(이 저장소가 쓰는 v28 기준) 은 `inert` 를 behavioral 하게(즉
  // .focus() 를 실제로 막는 식으로) 구현하지 않는 정도가 아니라, 아예
  // `'inert' in HTMLElement.prototype` 자체가 false 다 — 직접 찍어
  // 확인했다. 그 결과 BottomSheet 의 SUPPORTS_INERT 기능 감지가 이
  // 테스트 환경에서는 항상 false 로 떨어져, 실제로 `inert` 가 아니라
  // 폴백 경로인 aria-hidden="true" 가 걸린다(이건 버그가 아니라 우리
  // 폴백 로직이 의도대로 작동한 것이다). 그래서 이 테스트는 두 선택자를
  // 모두 본다: [inert], [aria-hidden="true"].
  //
  // 이 effect 선언 순서(inertifySiblings 먼저, useFocusTrap 나중)를
  // BottomSheet.tsx 에서 손으로 뒤바꾸고 이 테스트를 실행하면 실제로
  // 실패한다(직접 재현하고 확인한 실제 출력, 이후 순서는 원래대로
  // 되돌렸다):
  //
  //   AssertionError: expected false to be true // Object.is equality
  //   - Expected: true
  //   + Received: false
  //    ❯ tests/components/BottomSheet.test.tsx:101:28
  //
  //   (inertAtRestore 가 true 로 잡혀야 정상인 이 테스트가, 순서를
  //   뒤바꾸면 아직 aria-hidden 이 걸려 있는 채로 트리거에 focus() 가
  //   호출되어 false 로 잡힌다 — "격리 해제가 먼저 끝났다"는 주장이
  //   거짓이 된다는 뜻이다.)
  //
  // 참고: 처음엔 [inert] 만 보도록 짰다가, 위 사실(jsdom 에 inert 자체가
  // 없다는 것) 을 모른 채로 순서를 뒤바꿔도 이 테스트가 계속 통과하는
  // 거짓 양성을 냈다 — aria-hidden 이 아니라 존재하지도 않는 inert 속성을
  // 찾고 있었기 때문이다. 두 선택자를 다 보도록 고친 뒤에야 순서를
  // 뒤바꿨을 때 실제로 실패하는 것을 확인했다.
  it('닫힐 때 inert 해제가 포커스 복구보다 먼저 끝난다 (순서를 바꾸면 이 테스트가 실패한다)', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const openButton = screen.getByRole('button', { name: '열기' });
    await user.click(openButton);
    await screen.findByRole('button', { name: '안의 버튼' });

    let inertAtRestore: boolean | null = null;
    const originalFocus = HTMLElement.prototype.focus;
    HTMLElement.prototype.focus = function focusSpy(
      this: HTMLElement,
      ...args: Parameters<typeof HTMLElement.prototype.focus>
    ) {
      if (this === openButton && inertAtRestore === null) {
        // 이 시점에 트리거의 조상 중 어느 하나라도 아직 inert(또는 그
        // 폴백인 aria-hidden="true") 라면, 격리 해제보다 포커스 복구가
        // 먼저 실행됐다는 뜻이다(순서 위반). jsdom(v28 기준) 은
        // 'inert' in HTMLElement.prototype 가 false 라 이 저장소의
        // BottomSheet 는 이 테스트 환경에서 실제로 aria-hidden 폴백
        // 경로를 탄다 — 그래서 두 선택자를 모두 본다.
        inertAtRestore =
          openButton.closest('[inert], [aria-hidden="true"]') === null;
      }
      return originalFocus.apply(this, args);
    };

    try {
      await user.keyboard('{Escape}');
      await waitFor(() => expect(openButton).toHaveFocus(), { timeout: 2000 });
    } finally {
      HTMLElement.prototype.focus = originalFocus;
    }

    expect(inertAtRestore).toBe(true);
  });

  // F2: 시트 A 가 퇴장 애니메이션(280ms) 중에도 여전히 mounted 인 동안 시트
  // B 가 열리면, 참조 카운트가 없는 구현은 A 가 언마운트될 때 "배경엔 원래
  // inert 가 없었다"는 A 자신의 스냅샷으로 배경을 복구해버려 B 가 아직 열려
  // 있는데도 격리가 풀린다. src/utils/backgroundInert.ts 의 참조 카운트로
  // 고쳤다 — 이 테스트는 그 전환 동안 격리가 유지되는지, 그리고 이미
  // 무관한 이유로 격리돼 있던 요소가 모든 시트가 닫힌 뒤에도 그대로
  // 남는지를 함께 확인한다.
  it('시트 A→B 전환 동안 배경 격리가 풀리지 않고, 원래 격리돼 있던 요소는 전부 닫힌 뒤에도 그대로 남는다', async () => {
    const user = userEvent.setup();

    function TwoSheetHarness() {
      const [openA, setOpenA] = useState(false);
      const [openB, setOpenB] = useState(false);
      return (
        <div>
          <button onClick={() => setOpenA(true)}>A 열기</button>
          <button
            onClick={() => {
              setOpenA(false);
              setOpenB(true);
            }}
          >
            A 닫고 B 열기
          </button>
          <div data-testid="background">배경</div>
          <BottomSheet open={openA} onClose={() => setOpenA(false)}>
            <button>A 안의 버튼</button>
          </BottomSheet>
          <BottomSheet open={openB} onClose={() => setOpenB(false)}>
            <button>B 안의 버튼</button>
          </BottomSheet>
        </div>
      );
    }

    // 시트가 열리기 전부터 무관한 이유로 이미 aria-hidden 이던 배경 요소.
    // "이미 격리돼 있던 요소는 시트가 다 닫힌 뒤에도 그대로 남아야 한다"는
    // 불변식을 검증하려고 수동으로 body 에 붙인다(테스트 환경엔 jsdom 에
    // 'inert' 자체가 없으므로 aria-hidden 폴백을 쓴다 — 다른 테스트의
    // 코멘트 참고).
    const preexisting = document.createElement('div');
    preexisting.setAttribute('aria-hidden', 'true');
    document.body.appendChild(preexisting);

    const isIsolated = (el: Element) =>
      el.closest('[inert], [aria-hidden="true"]') !== null;

    try {
      render(<TwoSheetHarness />);

      // 배경이 아직 격리되기 전에 트리거 참조를 미리 잡아둔다 — A 를 열면
      // 이 트리거들이 속한 wrapper 자체가 aria-hidden 이 되어(올바른
      // 동작이다) 이후 getByRole 로는 더 이상 찾을 수 없어진다.
      const openAButton = screen.getByRole('button', { name: 'A 열기' });
      const closeAOpenBButton = screen.getByRole('button', { name: 'A 닫고 B 열기' });
      const background = screen.getByTestId('background');

      await user.click(openAButton);
      await screen.findByRole('button', { name: 'A 안의 버튼' });

      expect(isIsolated(background)).toBe(true);

      // A 를 닫으면서(퇴장 애니메이션 시작) 동시에 B 를 연다 — 둘 다
      // 280ms 동안 mounted 상태로 겹친다. 이 버튼도 지금은 배경과 함께
      // aria-hidden 아래 있어 getByRole 로는 못 찾으므로 미리 잡아둔
      // 참조로 클릭한다.
      await user.click(closeAOpenBButton);
      await screen.findByRole('button', { name: 'B 안의 버튼' });

      // A 의 퇴장 애니메이션이 끝나 완전히 언마운트될 때까지 기다린다.
      await waitFor(
        () => expect(screen.queryByRole('button', { name: 'A 안의 버튼' })).toBeNull(),
        { timeout: 2000 },
      );

      // 참조 카운트가 없다면 이 시점에 A 의 클린업이 배경 격리를 풀어버려
      // 아래 단언이 실패한다 — B 가 아직 열려 있는데도.
      expect(isIsolated(background)).toBe(true);

      // B 마저 닫는다.
      await user.keyboard('{Escape}');
      await waitFor(
        () => expect(screen.queryByRole('button', { name: 'B 안의 버튼' })).toBeNull(),
        { timeout: 2000 },
      );

      // 시트가 하나도 안 남으면 배경은 더 이상 격리되지 않는다.
      expect(isIsolated(background)).toBe(false);
      // 시트와 무관하게 원래부터 aria-hidden 이었던 요소는 그대로 남는다.
      expect(preexisting.getAttribute('aria-hidden')).toBe('true');
    } finally {
      preexisting.remove();
    }
  });
});
