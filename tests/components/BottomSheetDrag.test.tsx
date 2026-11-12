// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { BottomSheet } from '../../src/components/BottomSheet';

// 속도 계산이 performance.now() 에 의존하므로 시계를 직접 움직인다.
let now = 0;
beforeEach(() => {
  now = 1000;
  vi.spyOn(performance, 'now').mockImplementation(() => now);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// jsdom 의 기본 뷰포트 높이는 768px 이다. 아래 계산은 모두 이 값을 기준으로 한다.
const VH = 768;

async function openSheet(props: Partial<React.ComponentProps<typeof BottomSheet>> = {}) {
  const onClose = vi.fn();
  render(
    <BottomSheet open onClose={onClose} {...props}>
      <button>안의 버튼</button>
    </BottomSheet>,
  );
  const sheet = await screen.findByRole('dialog');
  // 핸들은 시트의 첫 자식이다(내용 영역보다 앞).
  const handle = sheet.firstElementChild as HTMLElement;
  return { sheet, handle, onClose };
}

/** 손가락을 대고 `ms` 동안 fromY → toY 로 옮긴다(아직 떼지 않는다). */
function drag(handle: HTMLElement, fromY: number, toY: number, ms = 400) {
  fireEvent.pointerDown(handle, { pointerId: 1, clientX: 100, clientY: fromY });
  now += ms;
  fireEvent.pointerMove(handle, { pointerId: 1, clientX: 100, clientY: toY });
}

function release(handle: HTMLElement, y: number) {
  fireEvent.pointerUp(handle, { pointerId: 1, clientX: 100, clientY: y });
}

describe('BottomSheet 드래그', () => {
  it('핸들을 끌면 시트가 손가락을 따라 움직인다', async () => {
    const { sheet, handle } = await openSheet({ snapPoints: [0.3, 0.9] });
    const before = sheet.style.transform;

    drag(handle, 300, 400);

    expect(sheet.style.transform).not.toBe(before);
    // 초기 스냅 0.3, 최대 0.9 → 기본 위치는 (0.9-0.3)*768 = 460.8px, 여기에 100px 이 더해진다.
    expect(sheet.style.transform).toBe(`translateY(${(0.9 - 0.3) * VH + 100}px)`);
  });

  it('최소 스냅의 60% 아래까지 끌어내리고 놓으면 닫힌다', async () => {
    const { handle, onClose } = await openSheet(); // snapPoints [0.5]

    // 300px 내리면 보이는 비율은 0.5 - 300/768 ≈ 0.11 로, 0.5*0.6 = 0.3 보다 작다.
    drag(handle, 300, 600);
    release(handle, 600);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('천천히 조금만 끌고 놓으면 닫히지 않고 제자리로 돌아온다', async () => {
    const { sheet, handle, onClose } = await openSheet();

    // 20px 을 400ms 에 걸쳐 → 0.05px/ms, 튕김 기준(0.5 뷰포트/초 = 0.384px/ms)에 못 미친다.
    drag(handle, 300, 320);
    release(handle, 320);

    expect(onClose).not.toHaveBeenCalled();
    expect(sheet.style.transform).toBe('translateY(0px)');
  });

  it('dismissible 이 false 면 끝까지 끌어내려도 닫히지 않는다', async () => {
    const { handle, onClose } = await openSheet({ dismissible: false, snapPoints: [0.3, 0.9] });

    drag(handle, 300, 700);
    release(handle, 700);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('짧은 거리라도 아래로 빠르게 튕기면 닫힌다', async () => {
    const { handle, onClose } = await openSheet();

    // 40px 을 20ms 에 → 2px/ms ≈ 2.6 뷰포트/초
    drag(handle, 300, 340, 20);
    release(handle, 340);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('끌다가 멈춘 뒤 놓으면 튕김으로 보지 않는다', async () => {
    const { handle, onClose } = await openSheet();

    drag(handle, 300, 340, 20);
    now += 300; // 손가락을 댄 채 멈춤
    release(handle, 340);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('높은 스냅에서 아래로 튕기면 닫히지 않고 한 단계만 내려간다', async () => {
    const { sheet, handle, onClose } = await openSheet({ snapPoints: [0.3, 0.9], initialSnap: 1 });

    drag(handle, 100, 140, 20);
    release(handle, 140);

    expect(onClose).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(sheet.style.transform).toBe(`translateY(${(0.9 - 0.3) * VH}px)`),
    );
  });
});
