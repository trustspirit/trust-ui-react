// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { Button } from '../../src/components/Button';

afterEach(cleanup);

describe('Button', () => {
  it('라벨을 렌더한다', () => {
    render(<Button>저장</Button>);
    expect(screen.getByRole('button', { name: '저장' })).toBeDefined();
  });

  it('로딩 중에는 비활성이다', () => {
    render(<Button loading>저장</Button>);
    expect(screen.getByRole('button')).toHaveProperty('disabled', true);
  });

  it('variant 마다 다른 클래스를 붙인다', () => {
    const { container } = render(
      <>
        <Button variant="primary">a</Button>
        <Button variant="danger">b</Button>
      </>,
    );
    const [a, b] = Array.from(container.querySelectorAll('button'));
    expect(a.className).not.toBe(b.className);
  });
});
