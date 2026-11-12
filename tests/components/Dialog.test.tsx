// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeAll, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dialog } from '../../src/components/Dialog';
import { BottomSheet } from '../../src/components/BottomSheet';
import { installDialogPolyfill } from '../helpers/dialog';

beforeAll(installDialogPolyfill);
afterEach(cleanup);

function renderDialog(props: Partial<React.ComponentProps<typeof Dialog>> = {}) {
  const onClose = vi.fn();
  const utils = render(
    <Dialog open onClose={onClose} {...props}>
      <Dialog.Title>계좌 삭제</Dialog.Title>
      <Dialog.Content>
        <button>확인</button>
      </Dialog.Content>
    </Dialog>,
  );
  return { onClose, ...utils };
}

describe('Dialog', () => {
  it('Dialog.Title 이 다이얼로그의 이름이 된다', () => {
    renderDialog();
    expect(screen.getByRole('dialog', { name: '계좌 삭제' })).toBeInTheDocument();
  });

  it('제목의 닫기 버튼은 onClose 를 따로 넘기지 않아도 다이얼로그를 닫는다', async () => {
    const { onClose } = renderDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('브라우저가 스스로 닫으면(form method="dialog" 등) onClose 로 알린다', () => {
    const { onClose } = renderDialog();
    (screen.getByRole('dialog') as HTMLDialogElement).close();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('open 을 false 로 바꿔 닫을 때는 onClose 를 다시 부르지 않는다', () => {
    const { onClose, rerender } = renderDialog();
    rerender(
      <Dialog open={false} onClose={onClose}>
        <Dialog.Title>계좌 삭제</Dialog.Title>
      </Dialog>,
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it('Escape 는 항상 상태를 거쳐 닫는다 — 브라우저 기본 닫힘은 막는다', () => {
    const { onClose } = renderDialog();
    const notPrevented = fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
    expect(notPrevented).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closeOnEscape 가 false 면 Escape 로 닫히지 않는다', () => {
    const { onClose } = renderDialog({ closeOnEscape: false });
    const notPrevented = fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
    expect(notPrevented).toBe(false);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('열려 있는 동안 페이지 스크롤을 잠근다', () => {
    const { unmount } = renderDialog();
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('안에서 시작한 드래그를 백드롭에서 놓아도 닫히지 않는다', () => {
    const { onClose } = renderDialog();
    const dialog = screen.getByRole('dialog');

    fireEvent.mouseDown(screen.getByRole('button', { name: '확인' }));
    fireEvent.click(dialog); // 놓은 위치가 백드롭이면 click 의 target 은 dialog 다

    expect(onClose).not.toHaveBeenCalled();
  });

  it('백드롭에서 누르고 놓으면 닫힌다', () => {
    const { onClose } = renderDialog();
    const dialog = screen.getByRole('dialog');

    fireEvent.mouseDown(dialog);
    fireEvent.click(dialog);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('Dialog mobileVariant="sheet"', () => {
  it('closeOnEscape / closeOnBackdrop 을 시트에도 적용한다', async () => {
    const { onClose } = renderDialog({
      mobileVariant: 'sheet',
      closeOnEscape: false,
      closeOnBackdrop: false,
    });
    const sheet = await screen.findByRole('dialog');

    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(sheet.previousElementSibling!); // 백드롭

    expect(onClose).not.toHaveBeenCalled();
  });

  it('className 과 제목 이름을 시트에 전달한다', async () => {
    renderDialog({ mobileVariant: 'sheet', className: 'my-sheet' });
    const sheet = await screen.findByRole('dialog', { name: '계좌 삭제' });
    expect(sheet).toHaveClass('my-sheet');
  });
});

describe('BottomSheet — Escape', () => {
  it('안쪽에서 이미 처리한 Escape 로는 닫히지 않는다', async () => {
    const onClose = vi.fn();
    render(
      <BottomSheet open onClose={onClose}>
        <input aria-label="검색" onKeyDown={(e) => e.key === 'Escape' && e.preventDefault()} />
      </BottomSheet>,
    );
    const input = await screen.findByLabelText('검색');

    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onClose).not.toHaveBeenCalled();
  });

  it('겹쳐 열린 시트는 맨 위 것만 닫힌다', async () => {
    const closeLower = vi.fn();
    const closeUpper = vi.fn();
    render(
      <>
        <BottomSheet open onClose={closeLower} aria-label="아래">
          <button>a</button>
        </BottomSheet>
        <BottomSheet open onClose={closeUpper} aria-label="위">
          <button>b</button>
        </BottomSheet>
      </>,
    );
    // 같은 틱에 열면 먼저 열린 시트가 나머지 body 자식을 aria-hidden 으로 만들어
    // 역할 조회에 잡히지 않는다. 속성으로 직접 기다린다.
    await waitFor(() => expect(document.querySelector('[aria-label="위"]')).not.toBeNull());

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(closeUpper).toHaveBeenCalledTimes(1);
    expect(closeLower).not.toHaveBeenCalled();
  });
});
