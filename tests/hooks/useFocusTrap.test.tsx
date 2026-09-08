// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef, useState, type ReactNode } from 'react';
import { useFocusTrap } from '../../src/hooks/useFocusTrap';

afterEach(cleanup);

// 계약 1, 2, 4 를 검증하기 위한 기본 하네스.
// active 는 고정값으로 받고, 컨테이너 안에는 children 을 그대로 렌더한다.
function TrapHarness({
  active,
  children,
}: {
  active: boolean;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, active);
  return (
    <div>
      <button>바깥 버튼</button>
      <div ref={ref} data-testid="container">
        {children}
      </div>
      <button>바깥 버튼 2</button>
    </div>
  );
}

// 계약 3 (닫힐 때 포커스 복귀) 을 검증하기 위한 토글형 하네스.
// 트리거 버튼을 눌러 active 를 켜고, 컨테이너 안 버튼을 눌러 다시 끈다.
function ToggleHarness() {
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, active);
  return (
    <div>
      <button onClick={() => setActive(true)}>열기</button>
      {active && (
        <div ref={ref}>
          <button onClick={() => setActive(false)}>닫기</button>
        </div>
      )}
    </div>
  );
}

// 계약 3 의 예외 경로: 트리거가 문서에서 사라진 뒤 트랩이 닫히는 경우.
function DisappearingTriggerHarness() {
  const [showTrigger, setShowTrigger] = useState(true);
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, active);
  return (
    <div>
      {showTrigger && <button onClick={() => setActive(true)}>열기</button>}
      {active && (
        <div ref={ref}>
          <button
            onClick={() => {
              setShowTrigger(false);
              setActive(false);
            }}
          >
            트리거 제거 후 닫기
          </button>
        </div>
      )}
    </div>
  );
}

describe('useFocusTrap', () => {
  it('active 가 되면 컨테이너 안 첫 포커스 가능 요소로 포커스를 옮긴다', () => {
    render(
      <TrapHarness active>
        <button>첫번째</button>
        <button>두번째</button>
      </TrapHarness>,
    );
    expect(screen.getByRole('button', { name: '첫번째' })).toHaveFocus();
  });

  it('포커스 가능 요소가 하나도 없으면 컨테이너 자신에 포커스를 준다', () => {
    render(<TrapHarness active />);
    const container = screen.getByTestId('container');
    expect(container).toHaveAttribute('tabindex', '-1');
    expect(container).toHaveFocus();
  });

  it('disabled 버튼과 tabindex=-1 요소는 후보에서 제외된다', () => {
    render(
      <TrapHarness active>
        <button disabled>비활성</button>
        <button tabIndex={-1}>탭인덱스 제외</button>
        <button>진짜 첫번째</button>
      </TrapHarness>,
    );
    // 초기 포커스는 disabled/tabindex=-1 를 건너뛰고 진짜 첫번째로 간다.
    expect(screen.getByRole('button', { name: '진짜 첫번째' })).toHaveFocus();
  });

  it('display:none 으로 감춰진 요소는 후보에서 제외된다', () => {
    render(
      <TrapHarness active>
        <button style={{ display: 'none' }}>감춰짐</button>
        <button>보임</button>
      </TrapHarness>,
    );
    expect(screen.getByRole('button', { name: '보임' })).toHaveFocus();
  });

  it('Tab 이 마지막 요소를 넘으면 첫 요소로 순환한다', async () => {
    const user = userEvent.setup();
    render(
      <TrapHarness active>
        <button>첫번째</button>
        <button>두번째</button>
      </TrapHarness>,
    );
    screen.getByRole('button', { name: '두번째' }).focus();
    await user.tab();
    expect(screen.getByRole('button', { name: '첫번째' })).toHaveFocus();
  });

  it('Shift+Tab 이 첫 요소보다 앞으로 가면 마지막 요소로 순환한다', async () => {
    const user = userEvent.setup();
    render(
      <TrapHarness active>
        <button>첫번째</button>
        <button>두번째</button>
      </TrapHarness>,
    );
    screen.getByRole('button', { name: '첫번째' }).focus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: '두번째' })).toHaveFocus();
  });

  it('active 가 거짓인 동안에는 Tab 을 가로채지 않아 컨테이너 밖으로 나갈 수 있다', async () => {
    const user = userEvent.setup();
    render(
      <TrapHarness active={false}>
        <button>안쪽 버튼</button>
      </TrapHarness>,
    );
    screen.getByRole('button', { name: '안쪽 버튼' }).focus();
    await user.tab();
    // 트랩이 꺼져 있으므로 컨테이너를 벗어나 다음 바깥 버튼으로 이동한다.
    expect(screen.getByRole('button', { name: '바깥 버튼 2' })).toHaveFocus();
  });

  it('active 가 참인 동안에는 같은 상황에서 컨테이너를 벗어나지 못하고 첫 요소로 순환한다', async () => {
    const user = userEvent.setup();
    render(
      <TrapHarness active>
        <button>안쪽 버튼</button>
      </TrapHarness>,
    );
    screen.getByRole('button', { name: '안쪽 버튼' }).focus();
    await user.tab();
    expect(screen.getByRole('button', { name: '안쪽 버튼' })).toHaveFocus();
  });

  it('열린 뒤 추가된 요소도 Tab 순환에 포함된다 (목록을 캐시하면 실패한다)', async () => {
    function DynamicHarness() {
      // '추가' 버튼 뒤에 새 항목이 붙는 구조로 만든다 — 캐시된 목록이라면
      // '추가'를 마지막으로 착각해 새 항목을 건너뛰고 첫번째로 순환해버린다.
      const [items, setItems] = useState<string[]>([]);
      const ref = useRef<HTMLDivElement>(null);
      useFocusTrap(ref, true);
      return (
        <div ref={ref}>
          <button>첫번째</button>
          <button onClick={() => setItems((prev) => [...prev, '나중에 추가됨'])}>
            추가
          </button>
          {items.map((label) => (
            <button key={label}>{label}</button>
          ))}
        </div>
      );
    }

    const user = userEvent.setup();
    render(<DynamicHarness />);

    // 초기 포커스: 첫번째
    expect(screen.getByRole('button', { name: '첫번째' })).toHaveFocus();

    // '추가' 버튼을 클릭해 트랩이 열린 뒤 새 버튼을 주입한다.
    await user.click(screen.getByRole('button', { name: '추가' }));
    expect(screen.getByRole('button', { name: '추가' })).toHaveFocus();

    // 목록을 캐시하는 구현이라면 '추가'가 캐시상 마지막이라 여기서 '첫번째'로
    // 순환해버린다. 매번 다시 계산해야 '나중에 추가됨'으로 간다.
    await user.tab();
    expect(screen.getByRole('button', { name: '나중에 추가됨' })).toHaveFocus();

    // 새로 계산된 목록에서는 '나중에 추가됨'이 마지막이므로 여기서 순환한다.
    await user.tab();
    expect(screen.getByRole('button', { name: '첫번째' })).toHaveFocus();
  });

  it('active 가 거짓이 되면 열리기 직전 포커스로 되돌린다', async () => {
    const user = userEvent.setup();
    render(<ToggleHarness />);

    const openButton = screen.getByRole('button', { name: '열기' });
    await user.click(openButton);
    expect(screen.getByRole('button', { name: '닫기' })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: '닫기' }));
    expect(openButton).toHaveFocus();
  });

  it('직전 포커스 요소가 문서에서 사라졌으면 아무것도 하지 않는다', async () => {
    const user = userEvent.setup();
    render(<DisappearingTriggerHarness />);

    await user.click(screen.getByRole('button', { name: '열기' }));
    expect(
      screen.getByRole('button', { name: '트리거 제거 후 닫기' }),
    ).toHaveFocus();

    // 던지지 않는지 확인 — 구현이 던지면 이 클릭 자체가 예외로 테스트를 무너뜨린다.
    await user.click(
      screen.getByRole('button', { name: '트리거 제거 후 닫기' }),
    );
    // 여기까지 왔다면 예외 없이 통과한 것이다.
    expect(screen.queryByRole('button', { name: '열기' })).toBeNull();
  });
});
