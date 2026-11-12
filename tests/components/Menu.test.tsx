// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Menu } from '../../src/components/Menu';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function Sample({ onEdit = () => {} }: { onEdit?: () => void }) {
  return (
    <>
      <Menu>
        <Menu.Trigger>
          <button>더보기</button>
        </Menu.Trigger>
        <Menu.Content>
          <Menu.Item onClick={onEdit}>수정</Menu.Item>
          <Menu.Item>복제</Menu.Item>
          <Menu.Item danger>삭제</Menu.Item>
        </Menu.Content>
      </Menu>
      <button>다음 버튼</button>
    </>
  );
}

describe('Menu', () => {
  it('항목을 고르면 포커스가 트리거로 돌아온다', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<Sample onEdit={onEdit} />);
    const trigger = screen.getByRole('button', { name: '더보기' });

    await user.click(trigger);
    await user.click(await screen.findByRole('menuitem', { name: '수정' }));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('Tab 으로 닫으면 트리거 다음 요소로 간다', async () => {
    const user = userEvent.setup();
    render(<Sample />);

    await user.click(screen.getByRole('button', { name: '더보기' }));
    await waitFor(() => expect(screen.getByRole('menuitem', { name: '수정' })).toHaveFocus());
    await user.tab();

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음 버튼' })).toHaveFocus();
  });

  it('Home / End 로 처음과 끝 항목으로 간다', async () => {
    const user = userEvent.setup();
    render(<Sample />);
    await user.click(screen.getByRole('button', { name: '더보기' }));
    // 메뉴는 열린 다음 프레임에 첫 항목으로 포커스를 옮긴다. 그때까지 기다린다.
    await waitFor(() => expect(screen.getByRole('menuitem', { name: '수정' })).toHaveFocus());

    await user.keyboard('{End}');
    expect(screen.getByRole('menuitem', { name: '삭제' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('menuitem', { name: '수정' })).toHaveFocus();
  });

  it('Dialog 안에서 열면 메뉴가 그 dialog 안에 놓인다', async () => {
    render(
      <dialog open aria-label="설정">
        <Sample />
      </dialog>,
    );

    await userEvent.click(screen.getByRole('button', { name: '더보기' }));

    expect((await screen.findByRole('menu')).closest('dialog')).not.toBeNull();
  });

  it('시트 변형은 문자열이 아닌 항목 내용도 그대로 보여 준다', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('coarse'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    const name = '하늘';
    render(
      <Menu mobileVariant="sheet" defaultOpen>
        <Menu.Trigger>
          <button>더보기</button>
        </Menu.Trigger>
        <Menu.Content>
          <>
            <Menu.Item>{name} 삭제</Menu.Item>
            <Menu.Item>
              <b>수정</b>
            </Menu.Item>
          </>
        </Menu.Content>
      </Menu>,
    );

    expect(await screen.findByRole('button', { name: '하늘 삭제' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '수정' })).toBeInTheDocument();
  });
});
