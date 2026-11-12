// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from '../../src/components/Select';

// jsdom 은 scrollIntoView 를 구현하지 않는다. 하이라이트 이동 시 Select 가 호출한다.
Element.prototype.scrollIntoView = () => {};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const options = [
  { value: 'kb', label: '국민' },
  { value: 'sh', label: '신한' },
  { value: 'wr', label: '우리' },
];

/** (pointer: coarse) 가 성립하는 터치 기기를 흉내낸다. jsdom 에는 matchMedia 가 없다. */
function stubTouchDevice() {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('coarse'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

describe('Select — 접근 가능한 이름과 상태', () => {
  it('label 이 콤보박스의 이름이 된다', () => {
    render(<Select label="은행" options={options} />);
    expect(screen.getByRole('combobox', { name: /은행/ })).toBeInTheDocument();
  });

  it('오류 메시지를 콤보박스 설명으로 연결하고 invalid 로 표시한다', () => {
    render(<Select label="은행" options={options} errorMessage="은행을 선택하세요" />);
    const combobox = screen.getByRole('combobox');
    expect(combobox).toHaveAccessibleDescription('은행을 선택하세요');
    expect(combobox).toHaveAttribute('aria-invalid', 'true');
  });

  it('required 를 보조 기술에 알린다', () => {
    render(<Select label="은행" options={options} required />);
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-required', 'true');
  });

  it('터치 기기의 네이티브 select 도 label 로 이름이 붙는다', async () => {
    stubTouchDevice();
    render(<Select label="은행" options={options} />);
    const native = await screen.findByLabelText(/은행/);
    expect(native.tagName).toBe('SELECT');
  });
});

describe('Select — 키보드', () => {
  it('화살표로 옮긴 하이라이트를 aria-activedescendant 로 알린다', async () => {
    const user = userEvent.setup();
    render(<Select label="은행" options={options} />);
    const combobox = screen.getByRole('combobox');
    combobox.focus();

    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');

    const highlighted = screen.getByRole('option', { name: '신한' });
    expect(highlighted.id).not.toBe('');
    expect(combobox).toHaveAttribute('aria-activedescendant', highlighted.id);
  });

  it('닫힌 상태의 Escape 는 가로채지 않는다 — 바깥 Dialog 가 닫힐 수 있어야 한다', () => {
    render(<Select label="은행" options={options} />);
    const combobox = screen.getByRole('combobox');

    // fireEvent 는 preventDefault 가 호출되지 않았을 때 true 를 돌려준다.
    expect(fireEvent.keyDown(combobox, { key: 'Escape' })).toBe(true);
  });

  it('열린 상태의 Escape 는 드롭다운만 닫는다', async () => {
    const user = userEvent.setup();
    render(<Select label="은행" options={options} />);
    const combobox = screen.getByRole('combobox');
    await user.click(combobox);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    expect(fireEvent.keyDown(combobox, { key: 'Escape' })).toBe(false);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('검색해서 Enter 로 고르면 포커스가 트리거로 돌아온다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Select label="은행" options={options} searchable onChange={onChange} />);
    const combobox = screen.getByRole('combobox');
    await user.click(combobox);

    await user.keyboard('신{ArrowDown}{Enter}');

    expect(onChange).toHaveBeenCalledWith('sh');
    expect(combobox).toHaveFocus();
  });

  it('한글 조합 중의 키 입력은 탐색으로 처리하지 않는다', async () => {
    const user = userEvent.setup();
    render(<Select label="은행" options={options} searchable />);
    await user.click(screen.getByRole('combobox'));
    const search = screen.getByRole('searchbox');

    fireEvent.keyDown(search, { key: 'ArrowDown', isComposing: true });

    expect(search).not.toHaveAttribute('aria-activedescendant');
  });
});

describe('Select — 다중 선택 칩', () => {
  it('비활성 상태에서는 칩을 지울 수 없다', async () => {
    const onChange = vi.fn();
    render(<Select label="은행" options={options} multiple disabled value={['kb', 'sh']} onChange={onChange} />);

    const remove = screen.getByRole('button', { name: 'Remove 국민' });
    expect(remove).toBeDisabled();
    await userEvent.click(remove);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('칩 삭제 버튼에서 Enter 를 누르면 드롭다운이 열리지 않고 칩이 지워진다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Select label="은행" options={options} multiple value={['kb', 'sh']} onChange={onChange} />);

    screen.getByRole('button', { name: 'Remove 국민' }).focus();
    await user.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledWith(['sh']);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});

describe('Select — 터치 기기', () => {
  it('옵션 목록 안에서 스크롤해도 드롭다운이 닫히지 않는다', async () => {
    stubTouchDevice();
    render(<Select label="은행" options={options} multiple />);
    await userEvent.click(await screen.findByRole('combobox'));
    const listbox = screen.getByRole('listbox');
    const scroller = within(listbox).getByRole('option', { name: '국민' }).parentElement!;

    fireEvent.scroll(scroller);

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('페이지가 스크롤되면 드롭다운을 닫는다', async () => {
    stubTouchDevice();
    render(<Select label="은행" options={options} multiple />);
    await userEvent.click(await screen.findByRole('combobox'));

    fireEvent.scroll(document);

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('Dialog 안의 검색형 Select 는 시트를 그 dialog 안에 연다', async () => {
    stubTouchDevice();
    render(
      <dialog open aria-label="계좌 추가">
        <Select label="은행" options={options} searchable />
      </dialog>,
    );
    await userEvent.click(await screen.findByRole('combobox'));

    const listbox = screen.getByRole('listbox');
    expect(listbox.closest('dialog')).not.toBeNull();
  });
});
