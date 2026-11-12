// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, forwardRef, useState, type AnchorHTMLAttributes } from 'react';
import { Card } from '../../src/components/Card';

afterEach(cleanup);

describe('Card — 정적 컨테이너', () => {
  it('상호작용 역할 없이 내용만 렌더한다', () => {
    render(
      <Card data-testid="card">
        <Card.Header title="Monthly report" description="Updated today" />
        <Card.Content>Body</Card.Content>
        <Card.Footer>Footer</Card.Footer>
      </Card>,
    );
    const card = screen.getByTestId('card');
    expect(card.tagName).toBe('DIV');
    expect(card).not.toHaveAttribute('role');
    expect(card).not.toHaveAttribute('tabindex');
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('radio')).toBeNull();
    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(screen.getByText('Monthly report')).toBeInTheDocument();
    expect(screen.getByText('Updated today')).toBeInTheDocument();
  });

  it('as 로 루트 요소를 바꾸고 ref·네이티브 속성을 루트에 전달한다', () => {
    const ref = createRef<HTMLElement>();
    render(
      <Card as="article" ref={ref} aria-label="Report" className="mine">
        <Card.Content>Body</Card.Content>
      </Card>,
    );
    const article = screen.getByRole('article', { name: 'Report' });
    expect(ref.current).toBe(article);
    expect(article).toHaveClass('mine');
  });

  it('titleAs 로 제목을 heading 으로 만든다', () => {
    render(
      <Card>
        <Card.Header title="Monthly report" titleAs="h3" />
      </Card>,
    );
    expect(screen.getByRole('heading', { level: 3, name: 'Monthly report' })).toBeInTheDocument();
  });

  it('Card.Media 는 aspectRatio 를 적용한다', () => {
    render(
      <Card>
        <Card.Media aspectRatio="16 / 9" data-testid="media">
          <img src="data:," alt="Cover" />
        </Card.Media>
      </Card>,
    );
    expect(screen.getByTestId('media').style.aspectRatio).toBe('16 / 9');
    expect(screen.getByRole('img', { name: 'Cover' })).toBeInTheDocument();
  });
});

describe('Card — 링크', () => {
  it('href 가 있으면 카드 전체가 링크이고 이름은 내용에서 온다', () => {
    const ref = createRef<HTMLElement>();
    render(
      <Card href="#report" ref={ref}>
        <Card.Header title="Monthly report" />
      </Card>,
    );
    const link = screen.getByRole('link', { name: 'Monthly report' });
    expect(link).toHaveAttribute('href', '#report');
    expect(ref.current).toBe(link);
    expect(within(link).queryByRole('button')).toBeNull();
  });

  it('Enter 로 활성화된다', async () => {
    const onClick = vi.fn();
    render(
      <Card href="#report" onClick={onClick}>
        <Card.Content>Open</Card.Content>
      </Card>,
    );
    await userEvent.tab();
    expect(screen.getByRole('link')).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('as 에 커스텀 링크 컴포넌트를 받는다', () => {
    const RouterLink = forwardRef<
      HTMLAnchorElement,
      AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }
    >(({ to, ...rest }, ref) => <a ref={ref} href={`/app${to}`} data-router="" {...rest} />);
    render(
      <Card as={RouterLink} to="/report">
        <Card.Content>Open</Card.Content>
      </Card>,
    );
    const link = screen.getByRole('link', { name: 'Open' });
    expect(link).toHaveAttribute('href', '/app/report');
    expect(link).toHaveAttribute('data-router');
  });

  it('disabled 링크는 aria-disabled 이고 클릭을 막는다', async () => {
    const onClick = vi.fn();
    render(
      <Card href="#report" disabled onClick={onClick}>
        <Card.Content>Open</Card.Content>
      </Card>,
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(link);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('Card — 버튼', () => {
  it('onClick 만 있으면 type="button" 버튼이다', () => {
    render(
      <Card onClick={() => {}}>
        <Card.Header title="Add account" description="Connect a bank" />
      </Card>,
    );
    const button = screen.getByRole('button', { name: /Add account/ });
    expect(button).toHaveAttribute('type', 'button');
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('클릭·Enter·Space 로 활성화된다', async () => {
    const onClick = vi.fn();
    render(
      <Card onClick={onClick}>
        <Card.Content>Add</Card.Content>
      </Card>,
    );
    await userEvent.click(screen.getByRole('button'));
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it('disabled 면 활성화되지 않는다', async () => {
    const onClick = vi.fn();
    render(
      <Card onClick={onClick} disabled>
        <Card.Content>Add</Card.Content>
      </Card>,
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('버튼 안에는 구문(phrasing) 요소만 렌더한다', () => {
    render(
      <Card onClick={() => {}}>
        <Card.Header title="Add account" titleAs="h3" description="Connect" />
        <Card.Content>Body</Card.Content>
        <Card.Footer>Footer</Card.Footer>
      </Card>,
    );
    const button = screen.getByRole('button');
    expect(button.querySelector('div, h1, h2, h3, h4, h5, h6, p')).toBeNull();
  });
});

describe('Card — stretched', () => {
  it('루트는 컨테이너로 남고 제목이 링크가 된다', () => {
    const onSave = vi.fn();
    render(
      <Card interactive="stretched" data-testid="card">
        <Card.Header title="Monthly report" titleAs="h3" href="#report" />
        <Card.Footer>
          <button type="button" onClick={onSave}>
            Save
          </button>
        </Card.Footer>
      </Card>,
    );
    const card = screen.getByTestId('card');
    expect(card.tagName).toBe('DIV');
    expect(card).not.toHaveAttribute('role');
    expect(card).not.toHaveAttribute('href');

    const link = screen.getByRole('link', { name: 'Monthly report' });
    expect(link).toHaveAttribute('href', '#report');
    // 제목 heading 이 링크를 감싼다.
    expect(screen.getByRole('heading', { level: 3 })).toContainElement(link);
    // 안쪽 컨트롤은 링크의 자식이 아니다 — 중첩된 상호작용 요소가 없다.
    expect(link).not.toContainElement(screen.getByRole('button', { name: 'Save' }));
  });

  it('제목에 onClick 을 주면 버튼이 되고 Enter/Space 로 활성화된다', async () => {
    const onOpen = vi.fn();
    const onSave = vi.fn();
    render(
      <Card interactive="stretched">
        <Card.Header title="Monthly report" onClick={onOpen} />
        <Card.Footer>
          <button type="button" onClick={onSave}>
            Save
          </button>
        </Card.Footer>
      </Card>,
    );
    const trigger = screen.getByRole('button', { name: 'Monthly report' });
    expect(trigger).toHaveAttribute('type', 'button');
    await userEvent.tab();
    expect(trigger).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onOpen).toHaveBeenCalledTimes(2);

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledTimes(2);
  });
});

describe('Card — selectable', () => {
  it('multiple 은 checkbox, single 은 radio 이고 이름은 카드 내용이다', () => {
    render(
      <>
        <Card selectable selectionMode="multiple">
          <Card.Header title="Email alerts" />
        </Card>
        <Card selectable selectionMode="single" name="plan" value="pro">
          <Card.Header title="Pro plan" />
        </Card>
      </>,
    );
    expect(screen.getByRole('checkbox', { name: 'Email alerts' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Pro plan' })).not.toBeChecked();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('비제어: 클릭과 Space 로 선택이 바뀌고 onSelectedChange 를 부른다', async () => {
    const onSelectedChange = vi.fn();
    render(
      <Card selectable defaultSelected onSelectedChange={onSelectedChange}>
        <Card.Header title="Email alerts" />
      </Card>,
    );
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();

    await userEvent.click(screen.getByText('Email alerts'));
    expect(checkbox).not.toBeChecked();
    expect(onSelectedChange).toHaveBeenLastCalledWith(false);

    // 라벨을 누르면 포커스는 입력 요소로 간다 — 이어서 키보드로 바꿀 수 있다.
    expect(checkbox).toHaveFocus();
    await userEvent.keyboard(' ');
    expect(checkbox).toBeChecked();
    expect(onSelectedChange).toHaveBeenLastCalledWith(true);
  });

  it('제어: selected 가 checked 상태를 정한다', async () => {
    function Controlled() {
      const [selected, setSelected] = useState(false);
      return (
        <>
          <Card selectable selected={selected} onSelectedChange={setSelected}>
            <Card.Content>Weekly digest</Card.Content>
          </Card>
          <output>{String(selected)}</output>
        </>
      );
    }
    render(<Controlled />);
    await userEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('checkbox')).toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent('true');
  });

  it('제어 값을 부모가 바꾸지 않으면 선택이 바뀌지 않는다', async () => {
    const onSelectedChange = vi.fn();
    render(
      <Card selectable selected={false} onSelectedChange={onSelectedChange}>
        <Card.Content>Weekly digest</Card.Content>
      </Card>,
    );
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onSelectedChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('single 은 같은 name 끼리 하나만 선택되고 화살표 키로 옮겨 간다', async () => {
    render(
      <>
        <Card selectable selectionMode="single" name="plan" value="basic" defaultSelected>
          <Card.Header title="Basic" />
        </Card>
        <Card selectable selectionMode="single" name="plan" value="pro">
          <Card.Header title="Pro" />
        </Card>
      </>,
    );
    const basic = screen.getByRole('radio', { name: 'Basic' });
    const pro = screen.getByRole('radio', { name: 'Pro' });
    expect(basic).toBeChecked();

    await userEvent.click(screen.getByText('Pro'));
    expect(pro).toBeChecked();
    expect(basic).not.toBeChecked();

    await userEvent.keyboard('{ArrowUp}');
    expect(basic).toBeChecked();
    expect(basic).toHaveFocus();
  });

  it('name/value 로 폼에 제출된다', async () => {
    render(
      <form data-testid="form">
        <Card selectable selectionMode="single" name="plan" value="basic">
          <Card.Header title="Basic" />
        </Card>
        <Card selectable selectionMode="single" name="plan" value="pro">
          <Card.Header title="Pro" />
        </Card>
        <Card selectable name="addons" value="backup" defaultSelected>
          <Card.Header title="Backup" />
        </Card>
        <Card selectable name="addons" value="support">
          <Card.Header title="Support" />
        </Card>
      </form>,
    );
    await userEvent.click(screen.getByRole('radio', { name: 'Pro' }));
    const data = new FormData(screen.getByTestId('form') as HTMLFormElement);
    expect(data.get('plan')).toBe('pro');
    expect(data.getAll('addons')).toEqual(['backup']);
  });

  it('disabled 면 선택할 수 없다', async () => {
    const onSelectedChange = vi.fn();
    render(
      <Card selectable disabled onSelectedChange={onSelectedChange}>
        <Card.Header title="Email alerts" />
      </Card>,
    );
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
    await userEvent.click(screen.getByText('Email alerts'));
    expect(checkbox).not.toBeChecked();
    expect(onSelectedChange).not.toHaveBeenCalled();
  });

  it('aria-label 은 입력 요소의 이름이 되고 ref 는 루트 label 을 가리킨다', () => {
    const ref = createRef<HTMLElement>();
    render(
      <Card selectable aria-label="Choose Pro" ref={ref}>
        <Card.Content>Pro</Card.Content>
      </Card>,
    );
    expect(screen.getByRole('checkbox', { name: 'Choose Pro' })).toBeInTheDocument();
    expect(ref.current?.tagName).toBe('LABEL');
  });
});
