// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { VisuallyHidden } from '../../src/components/VisuallyHidden';

afterEach(cleanup);

describe('VisuallyHidden', () => {
  it('내용을 접근성 트리에 남긴다 — 버튼의 이름이 된다', () => {
    render(
      <button type="button">
        <VisuallyHidden>Close dialog</VisuallyHidden>
      </button>,
    );
    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument();
  });

  it('기본은 span 이고 as 로 요소를 바꾼다', () => {
    render(
      <>
        <VisuallyHidden data-testid="a">a</VisuallyHidden>
        <VisuallyHidden as="h2" data-testid="b" className="mine">
          b
        </VisuallyHidden>
      </>,
    );
    expect(screen.getByTestId('a').tagName).toBe('SPAN');
    expect(screen.getByRole('heading', { level: 2, name: 'b' })).toHaveClass('mine');
  });
});
