// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Expander } from '../../src/components/Expander';

afterEach(cleanup);

function Sample() {
  return (
    <Expander>
      <Expander.Item value="a">
        <Expander.Trigger>배송 안내</Expander.Trigger>
        <Expander.Content>
          <a href="/policy">배송 정책</a>
        </Expander.Content>
      </Expander.Item>
    </Expander>
  );
}

describe('Expander', () => {
  // 접힌 패널은 높이 0 으로 가려질 뿐이라, inert 가 없으면 안의 링크가
  // 보이지 않는 채로 Tab 순서에 남는다.
  it('접힌 패널은 inert 이고, 펼치면 풀린다', async () => {
    render(<Sample />);
    const panel = screen.getByText('배송 정책').closest('[role="region"]')!;
    expect(panel).toHaveAttribute('inert');

    await userEvent.click(screen.getByRole('button', { name: '배송 안내' }));
    expect(panel).not.toHaveAttribute('inert');

    await userEvent.click(screen.getByRole('button', { name: '배송 안내' }));
    expect(panel).toHaveAttribute('inert');
  });
});
