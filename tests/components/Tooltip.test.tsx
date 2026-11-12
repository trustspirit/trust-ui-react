// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tooltip } from '../../src/components/Tooltip';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('Tooltip', () => {
  it('Escape 로 닫을 수 있다', async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="저장합니다" delay={0}>
        <button>저장</button>
      </Tooltip>,
    );
    await user.hover(screen.getByRole('button', { name: '저장' }));
    expect(await screen.findByRole('tooltip')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('자식이 이미 가진 aria-describedby 를 지우지 않고 합친다', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Tooltip content="영문과 숫자를 섞어 주세요" delay={0}>
          <input aria-label="비밀번호" aria-describedby="pw-error" />
        </Tooltip>
        <p id="pw-error">8자 이상이어야 합니다</p>
      </>,
    );
    const input = screen.getByLabelText('비밀번호');
    expect(input).toHaveAttribute('aria-describedby', 'pw-error');

    await user.hover(input);
    await screen.findByRole('tooltip');

    expect(input).toHaveAccessibleDescription('8자 이상이어야 합니다 영문과 숫자를 섞어 주세요');
  });

  it('Dialog 안의 트리거에 붙은 툴팁은 그 dialog 안에 놓인다', async () => {
    render(
      <dialog open aria-label="설정">
        <Tooltip content="도움말" defaultVisible>
          <button>?</button>
        </Tooltip>
      </dialog>,
    );
    // 첫 렌더에는 트리거 ref 가 아직 없어 body 로 간다. 다시 보이게 하면 dialog 안이다.
    fireEvent.mouseLeave(screen.getByRole('button', { name: '?' }));
    fireEvent.focus(screen.getByRole('button', { name: '?' }));

    expect((await screen.findByRole('tooltip')).closest('dialog')).not.toBeNull();
  });

  it('터치 기기의 inline 변형은 도움말을 입력의 설명으로 연결한다', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('coarse'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    render(
      <Tooltip content="하이픈 없이 입력">
        <input aria-label="전화번호" />
      </Tooltip>,
    );

    expect(await screen.findByText('하이픈 없이 입력')).toBeInTheDocument();
    expect(screen.getByLabelText('전화번호')).toHaveAccessibleDescription('하이픈 없이 입력');
  });
});
