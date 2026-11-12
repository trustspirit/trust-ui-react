// @vitest-environment jsdom
import * as React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Combobox, type ComboboxOption } from '../../src/components/Combobox';

// jsdom 은 scrollIntoView 를 구현하지 않는다.
Element.prototype.scrollIntoView = () => {};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const banks: ComboboxOption[] = [
  { value: 'kb', label: '국민은행' },
  { value: 'sh', label: '신한은행' },
  { value: 'wr', label: '우리은행', disabled: true },
  { value: 'hn', label: '하나은행', description: 'KEB' },
  { value: 'kk', label: 'Kakao Bank' },
];

function stubTouchDevice() {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('coarse'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

const getInput = () => screen.getByRole('combobox') as HTMLInputElement;
const optionNames = () => screen.queryAllByRole('option').map((o) => o.textContent);

describe('Combobox — 역할과 이름', () => {
  it('label 로 이름 붙은 편집 가능한 콤보박스다', () => {
    render(<Combobox label="은행" options={banks} required />);
    const input = screen.getByRole('combobox', { name: '은행' });
    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('오류 메시지를 설명으로 잇는다', () => {
    render(<Combobox label="은행" options={banks} errorMessage="은행을 선택하세요" />);
    expect(getInput()).toHaveAccessibleDescription('은행을 선택하세요');
    expect(getInput()).toHaveAttribute('aria-invalid', 'true');
  });

  it('열리면 listbox 를 aria-controls 로 가리키고 listbox 도 label 로 이름이 붙는다', async () => {
    const user = userEvent.setup();
    render(<Combobox label="은행" options={banks} />);
    await user.click(getInput());
    const listbox = screen.getByRole('listbox', { name: '은행' });
    expect(getInput()).toHaveAttribute('aria-expanded', 'true');
    expect(getInput()).toHaveAttribute('aria-controls', listbox.id);
    expect(within(listbox).getAllByRole('option')).toHaveLength(5);
    expect(screen.getByRole('option', { name: /우리은행/ })).toHaveAttribute('aria-disabled', 'true');
  });

  it('선택된 값의 label 을 글자로 보여 주고 옵션에 aria-selected 를 준다', async () => {
    const user = userEvent.setup();
    render(<Combobox label="은행" options={banks} defaultValue="sh" />);
    expect(getInput().value).toBe('신한은행');
    await user.click(getInput());
    // 방금 연 목록은 걸러지지 않는다 — 글자가 선택된 label 그대로이기 때문.
    expect(screen.getAllByRole('option')).toHaveLength(5);
    expect(screen.getByRole('option', { name: '신한은행' })).toHaveAttribute('aria-selected', 'true');
  });
});

describe('Combobox — 키보드', () => {
  it('화살표로 열고, 비활성 옵션을 건너뛰며 움직이고, Enter 로 고른다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Combobox label="은행" options={banks} onChange={onChange} />);
    const input = getInput();
    input.focus();

    await user.keyboard('{ArrowDown}');
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(input).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: '국민은행' }).id);

    await user.keyboard('{ArrowDown}{ArrowDown}');
    // 우리은행(disabled)을 건너뛴다.
    expect(input).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: /하나은행/ }).id);

    await user.keyboard('{ArrowUp}');
    expect(input).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: '신한은행' }).id);

    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('sh', banks[1]);
    expect(input.value).toBe('신한은행');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).not.toHaveAttribute('aria-activedescendant');
    // 포커스는 계속 입력 칸에 있다.
    expect(input).toHaveFocus();
  });

  it('ArrowUp 으로 열면 마지막 옵션에서 시작하고 Home/End 로 양 끝에 간다', async () => {
    const user = userEvent.setup();
    render(<Combobox label="은행" options={banks} />);
    const input = getInput();
    input.focus();

    await user.keyboard('{ArrowUp}');
    expect(input).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Kakao Bank' }).id);
    await user.keyboard('{Home}');
    expect(input).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: '국민은행' }).id);
    await user.keyboard('{End}');
    expect(input).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Kakao Bank' }).id);
  });

  it('Escape 는 먼저 목록을 닫고, 닫힌 상태에서는 글자와 값을 비운다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Combobox label="은행" options={banks} defaultValue="kb" onChange={onChange} />);
    const input = getInput();
    input.focus();

    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Escape}');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input.value).toBe('국민은행');
    expect(onChange).not.toHaveBeenCalled();

    await user.keyboard('{Escape}');
    expect(input.value).toBe('');
    expect(onChange).toHaveBeenLastCalledWith(null, null);
  });

  it('비어 있고 닫힌 상태의 Escape 는 가로채지 않는다 — 바깥 Dialog 가 닫힐 수 있어야 한다', () => {
    render(<Combobox label="은행" options={banks} />);
    expect(fireEvent.keyDown(getInput(), { key: 'Escape' })).toBe(true);
  });

  it('Tab 은 아무것도 고르지 않고 닫는다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <>
        <Combobox label="은행" options={banks} onChange={onChange} />
        <button type="button">next</button>
      </>,
    );
    const input = getInput();
    input.focus();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    await user.tab();
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(input.value).toBe('');
  });

  it('IME 조합 중의 키는 아무것도 움직이지 않는다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Combobox label="은행" options={banks} onChange={onChange} />);
    const input = getInput();
    input.focus();

    // 닫힌 상태: 조합 중 ArrowDown 은 열지 않는다.
    fireEvent.keyDown(input, { key: 'ArrowDown', isComposing: true });
    expect(input).toHaveAttribute('aria-expanded', 'false');

    await user.keyboard('{ArrowDown}');
    const active = input.getAttribute('aria-activedescendant');
    expect(active).toBeTruthy();

    fireEvent.keyDown(input, { key: 'ArrowDown', isComposing: true });
    fireEvent.keyDown(input, { key: 'ArrowDown', keyCode: 229 });
    expect(input).toHaveAttribute('aria-activedescendant', active);

    // 조합을 확정하는 Enter 가 옵션 선택으로 새지 않는다.
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    fireEvent.keyDown(input, { key: 'Escape', keyCode: 229 });
    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('Combobox — 걸러내기', () => {
  it('입력한 글자로 label 을 대소문자 구분 없이 거른다', async () => {
    const user = userEvent.setup();
    render(<Combobox label="은행" options={banks} />);
    await user.type(getInput(), 'kakao');
    expect(optionNames()).toEqual(['Kakao Bank']);
  });

  it('조합 중인 글자로도 거른다 — keydown 이 아니라 change 값을 쓴다', () => {
    render(<Combobox label="은행" options={banks} />);
    const input = getInput();
    input.focus();
    // 한글 조합 중에는 keydown 이 229 로만 오고, 글자는 change(input) 이벤트로 온다.
    fireEvent.keyDown(input, { key: 'Process', keyCode: 229, isComposing: true });
    fireEvent.change(input, { target: { value: '신' } });
    expect(optionNames()).toEqual(['신한은행']);
  });

  it('결과가 없으면 emptyText 를 보여 주고 라이브 영역으로 알린다', async () => {
    const user = userEvent.setup();
    render(<Combobox label="은행" options={banks} emptyText="결과 없음" />);
    await user.type(getInput(), 'zzz');
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByRole('status')).toHaveTextContent('결과 없음');
  });

  it('결과 수를 polite 라이브 영역으로 알린다', async () => {
    const user = userEvent.setup();
    render(<Combobox label="은행" options={banks} />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toBeEmptyDOMElement();
    await user.type(getInput(), '은행');
    expect(status).toHaveTextContent('4 results');
  });

  it('사용자 filter 를 쓴다', async () => {
    const user = userEvent.setup();
    render(
      <Combobox
        label="은행"
        options={banks}
        filter={(option, query) => option.value.startsWith(query)}
      />,
    );
    await user.type(getInput(), 'k');
    expect(optionNames()).toEqual(['국민은행', 'Kakao Bank']);
  });

  it('minQueryLength 에 못 미치면 열지 않는다', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<Combobox label="은행" options={banks} minQueryLength={2} onSearch={onSearch} />);
    await user.type(getInput(), '은');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(onSearch).not.toHaveBeenCalled();
    await user.type(getInput(), '행');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(onSearch).toHaveBeenLastCalledWith('은행');
  });
});

describe('Combobox — 비동기', () => {
  it('onSearch 로 질의를 알리고, loading 을 표시하고, 돌아온 options 를 그대로 보여 준다', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    function Async() {
      const [options, setOptions] = React.useState<ComboboxOption[]>([]);
      const [loading, setLoading] = React.useState(false);
      return (
        <>
          <Combobox
            label="종목"
            options={options}
            loading={loading}
            filter={null}
            onSearch={(query) => {
              onSearch(query);
              setLoading(true);
            }}
          />
          <button
            type="button"
            onClick={() => {
              // 서버가 이미 걸러 준 결과: label 이 질의와 일치하지 않아도 보여야 한다.
              setOptions([{ value: '005930', label: 'Samsung Electronics' }]);
              setLoading(false);
            }}
          >
            resolve
          </button>
        </>
      );
    }
    render(<Async />);
    const input = getInput();

    await user.type(input, '삼성');
    expect(onSearch).toHaveBeenLastCalledWith('삼성');
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    expect(screen.queryAllByRole('option')).toHaveLength(0);

    // 버튼 클릭은 입력 칸을 blur 시킨다. 응답은 포커스와 무관하게 오므로 직접 실행한다.
    act(() => {
      screen.getByRole('button', { name: 'resolve' }).click();
    });
    expect(optionNames()).toEqual(['Samsung Electronics']);
    expect(screen.getByRole('listbox')).not.toHaveAttribute('aria-busy');
    expect(screen.getByRole('status')).toHaveTextContent('1 result');
  });
});

describe('Combobox — 포인터', () => {
  it('옵션을 클릭하면 고르고 포커스는 입력 칸에 남는다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Combobox label="은행" options={banks} onChange={onChange} />);
    const input = getInput();
    await user.click(input);
    await user.click(screen.getByRole('option', { name: /하나은행/ }));
    expect(onChange).toHaveBeenCalledWith('hn', banks[3]);
    expect(input.value).toBe('하나은행');
    expect(input).toHaveFocus();
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('비활성 옵션은 클릭해도 고르지 않는다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Combobox label="은행" options={banks} onChange={onChange} />);
    await user.click(getInput());
    await user.click(screen.getByRole('option', { name: /우리은행/ }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('지우기 버튼은 값과 글자를 비우고 포커스를 입력 칸에 둔다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Combobox label="은행" options={banks} defaultValue="kb" onChange={onChange} clearLabel="지우기" />);
    const input = getInput();
    await user.click(screen.getByRole('button', { name: '지우기' }));
    expect(onChange).toHaveBeenLastCalledWith(null, null);
    expect(input.value).toBe('');
    expect(input).toHaveFocus();
    // 비울 것이 없으면 버튼도 없다.
    expect(screen.queryByRole('button', { name: '지우기' })).toBeNull();
  });

  it('clearable={false} 면 지우기 버튼이 없다', () => {
    render(<Combobox label="은행" options={banks} defaultValue="kb" clearable={false} />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('Combobox — blur', () => {
  it('선택과 맞지 않는 글자는 선택된 label 로 되돌린다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Combobox label="은행" options={banks} defaultValue="kb" onChange={onChange} />);
    const input = getInput();
    await user.click(input);
    await user.keyboard('abc');
    expect(input.value).toBe('국민은행abc');
    await user.tab();
    expect(input.value).toBe('국민은행');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('선택이 없으면 빈 칸으로 되돌린다', async () => {
    const user = userEvent.setup();
    render(<Combobox label="은행" options={banks} />);
    const input = getInput();
    await user.type(input, '신한');
    await user.tab();
    expect(input.value).toBe('');
  });

  it('글자를 모두 지우고 나가면 선택을 해제한다', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Combobox label="은행" options={banks} defaultValue="kb" onChange={onChange} />);
    const input = getInput();
    await user.clear(input);
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith(null, null);
    expect(input.value).toBe('');
  });
});

describe('Combobox — 제어', () => {
  it('value 가 밖에서 바뀌면 글자가 따라간다', () => {
    const { rerender } = render(<Combobox label="은행" options={banks} value="kb" />);
    expect(getInput().value).toBe('국민은행');
    rerender(<Combobox label="은행" options={banks} value="sh" />);
    expect(getInput().value).toBe('신한은행');
    rerender(<Combobox label="은행" options={banks} value={null} />);
    expect(getInput().value).toBe('');
  });

  it('inputValue / onInputValueChange 로 글자를 제어한다', async () => {
    const user = userEvent.setup();
    const onInputValueChange = vi.fn();
    render(
      <Combobox label="은행" options={banks} inputValue="Ka" onInputValueChange={onInputValueChange} />,
    );
    expect(getInput().value).toBe('Ka');
    await user.type(getInput(), 'k');
    expect(onInputValueChange).toHaveBeenLastCalledWith('Kak');
    // 부모가 값을 바꾸지 않았으므로 그대로다.
    expect(getInput().value).toBe('Ka');
  });

  it('name 이 있으면 선택된 value 를 폼 값으로 낸다', () => {
    const { container } = render(<Combobox label="은행" options={banks} defaultValue="sh" name="bank" />);
    expect((container.querySelector('input[type="hidden"][name="bank"]') as HTMLInputElement).value).toBe('sh');
  });
});

describe('Combobox — 터치', () => {
  it('터치 기기에서도 같은 팝업을 쓰고, 페이지가 스크롤되면 닫는다', async () => {
    stubTouchDevice();
    const user = userEvent.setup();
    render(<Combobox label="은행" options={banks} />);
    await act(async () => {});
    const input = getInput();
    expect(input.tagName).toBe('INPUT');
    await user.type(input, '은행');
    const listbox = screen.getByRole('listbox');

    // 목록 자신의 스크롤은 닫을 이유가 아니다.
    fireEvent.scroll(listbox);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    // 포커스 직후의 스크롤은 가상 키보드가 올라오며 생긴 것이다. 닫지 않는다.
    fireEvent.scroll(document);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    const later = Date.now() + 1000;
    vi.spyOn(Date, 'now').mockReturnValue(later);
    fireEvent.scroll(document);
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
