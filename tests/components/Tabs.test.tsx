// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs } from '../../src/components/Tabs';
import { Expander } from '../../src/components/Expander';

afterEach(cleanup);

describe('Tabs', () => {
  it('활성 탭이 없어도 Tab 으로 탭 목록에 들어갈 수 있다', async () => {
    const user = userEvent.setup();
    render(
      <Tabs>
        <Tabs.List>
          <Tabs.Trigger value="a" disabled>개요</Tabs.Trigger>
          <Tabs.Trigger value="b">내역</Tabs.Trigger>
          <Tabs.Trigger value="c">설정</Tabs.Trigger>
        </Tabs.List>
      </Tabs>,
    );

    await user.tab();

    expect(screen.getByRole('tab', { name: '내역' })).toHaveFocus();
  });

  it('공백이 든 value 로도 탭과 패널이 올바르게 연결된다', () => {
    render(
      <Tabs defaultValue="my tab">
        <Tabs.List>
          <Tabs.Trigger value="my tab">내 탭</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="my tab">내용</Tabs.Content>
      </Tabs>,
    );
    const tab = screen.getByRole('tab', { name: '내 탭' });
    const panel = screen.getByRole('tabpanel');

    expect(tab.getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.id).not.toMatch(/\s/);
    // aria-labelledby 가 공백으로 쪼개지지 않아야 패널 이름이 탭 이름이 된다.
    expect(panel).toHaveAccessibleName('내 탭');
  });
});

describe('Expander id', () => {
  it('공백이 든 value 로도 패널이 트리거로 이름 붙는다', () => {
    render(
      <Expander defaultValue={['my item']}>
        <Expander.Item value="my item">
          <Expander.Trigger>배송 안내</Expander.Trigger>
          <Expander.Content>내용</Expander.Content>
        </Expander.Item>
      </Expander>,
    );
    expect(screen.getByRole('region')).toHaveAccessibleName('배송 안내');
  });
});
