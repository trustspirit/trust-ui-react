// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import { createRef, type ComponentProps } from 'react';
import { Avatar } from '../../src/components/Avatar';
import { AvatarGroup } from '../../src/components/AvatarGroup';

afterEach(cleanup);

const NAMES = ['Ada Park', 'Ben Cho', 'Cy Lim', 'Di Seo', 'Eli Han', 'Fay Oh'];
const people = (n: number) => NAMES.slice(0, n).map((name) => <Avatar key={name} name={name} />);

/** Avatar 가 받은 props 를 그대로 드러내는 대역 — size 전달을 클래스명 없이 확인한다. */
const Probe = (props: ComponentProps<typeof Avatar>) => (
  <span data-testid="probe" data-size={props.size ?? ''} className={props.className} style={props.style} />
);

describe('AvatarGroup', () => {
  it('max 이하이면 전부 보여 주고 넘침 타일은 없다', () => {
    render(<AvatarGroup>{people(3)}</AvatarGroup>);
    const group = screen.getByRole('group', { name: '3 people' });
    expect(within(group).getAllByRole('img')).toHaveLength(3);
    expect(within(group).queryByText(/^\+/)).toBeNull();
  });

  it('기본 max 는 4 다', () => {
    render(<AvatarGroup>{people(6)}</AvatarGroup>);
    const group = screen.getByRole('group', { name: '6 people' });
    expect(within(group).getByRole('img', { name: 'Di Seo' })).toBeInTheDocument();
    expect(within(group).queryByRole('img', { name: 'Eli Han' })).toBeNull();
    expect(within(group).getByRole('img', { name: '2 more' })).toHaveTextContent('+2');
  });

  it('max 를 넘으면 max 개만 보여 주고 나머지를 +N 으로 센다', () => {
    render(<AvatarGroup max={2}>{people(5)}</AvatarGroup>);
    const group = screen.getByRole('group');
    expect(within(group).getByRole('img', { name: 'Ada Park' })).toBeInTheDocument();
    expect(within(group).getByRole('img', { name: 'Ben Cho' })).toBeInTheDocument();
    expect(within(group).queryByRole('img', { name: 'Cy Lim' })).toBeNull();
    expect(within(group).getByRole('img', { name: '3 more' })).toHaveTextContent('+3');
  });

  it('total 이 자식 수보다 크면 total 기준으로 센다', () => {
    render(
      <AvatarGroup max={3} total={12}>
        {people(5)}
      </AvatarGroup>,
    );
    expect(screen.getByRole('group', { name: '12 people' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '9 more' })).toHaveTextContent('+9');
  });

  it('자식이 max 보다 적어도 total 이 더 크면 넘침 타일을 보여 준다', () => {
    render(<AvatarGroup total={10}>{people(2)}</AvatarGroup>);
    expect(screen.getByRole('img', { name: '8 more' })).toBeInTheDocument();
  });

  it('total 이 자식 수보다 작으면 무시한다', () => {
    render(<AvatarGroup total={1}>{people(3)}</AvatarGroup>);
    expect(screen.getByRole('group', { name: '3 people' })).toBeInTheDocument();
    expect(screen.queryByText(/^\+/)).toBeNull();
  });

  it('한 명이면 단수로 부른다', () => {
    render(<AvatarGroup>{people(1)}</AvatarGroup>);
    expect(screen.getByRole('group', { name: '1 person' })).toBeInTheDocument();
  });

  it('label 과 overflowLabel 로 이름을 바꾼다', () => {
    render(
      <AvatarGroup max={1} label="프로젝트 참여자" overflowLabel={(n) => `외 ${n}명`}>
        {people(4)}
      </AvatarGroup>,
    );
    expect(screen.getByRole('group', { name: '프로젝트 참여자' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '외 3명' })).toBeInTheDocument();
  });

  it('renderOverflow 로 넘침 타일을 바꾼다', () => {
    const renderOverflow = vi.fn((hidden: number) => <button type="button">Show {hidden} more</button>);
    render(
      <AvatarGroup max={2} renderOverflow={renderOverflow}>
        {people(5)}
      </AvatarGroup>,
    );
    expect(renderOverflow).toHaveBeenCalledWith(3, expect.anything());
    expect(screen.getByRole('button', { name: 'Show 3 more' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: '3 more' })).toBeNull();
  });

  it('renderOverflow 의 두 번째 인자는 기본 타일이다', () => {
    render(
      <AvatarGroup max={2} renderOverflow={(_, tile) => <button type="button">{tile}</button>}>
        {people(5)}
      </AvatarGroup>,
    );
    expect(screen.getByRole('button', { name: '3 more' })).toBeInTheDocument();
  });

  it('넘치지 않으면 renderOverflow 를 부르지 않는다', () => {
    const renderOverflow = vi.fn(() => null);
    render(<AvatarGroup renderOverflow={renderOverflow}>{people(2)}</AvatarGroup>);
    expect(renderOverflow).not.toHaveBeenCalled();
  });

  it('size 를 각 아바타에 전달하되 자식이 정한 size 는 지킨다', () => {
    render(
      <AvatarGroup size="lg">
        <Probe name="a" />
        <Probe name="b" size="sm" />
      </AvatarGroup>,
    );
    const [first, second] = screen.getAllByTestId('probe');
    expect(first).toHaveAttribute('data-size', 'lg');
    expect(second).toHaveAttribute('data-size', 'sm');
  });

  it('첫 아바타가 가장 위에 쌓인다', () => {
    render(
      <AvatarGroup max={3}>
        <Probe name="a" />
        <Probe name="b" />
        <Probe name="c" />
        <Probe name="d" />
      </AvatarGroup>,
    );
    const z = screen.getAllByTestId('probe').map((el) => Number(el.style.zIndex));
    expect(z).toHaveLength(3);
    expect(z[0]).toBeGreaterThan(z[1]);
    expect(z[1]).toBeGreaterThan(z[2]);
    expect(z[2]).toBeGreaterThan(0);
  });

  it('ref·className·네이티브 속성을 루트에 전달한다', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <AvatarGroup ref={ref} className="mine" data-testid="g">
        {people(2)}
      </AvatarGroup>,
    );
    expect(ref.current).toBe(screen.getByTestId('g'));
    expect(ref.current).toHaveClass('mine');
  });
});
