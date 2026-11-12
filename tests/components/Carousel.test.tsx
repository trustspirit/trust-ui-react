// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, act, within } from '@testing-library/react';
import { useState } from 'react';
import { Carousel, type CarouselProps } from '../../src/components/Carousel';

// jsdom 에는 레이아웃도 scrollTo 도 없다. 호출만 기록한다.
const scrollTo = vi.fn();
let reducedMotion = false;

beforeEach(() => {
  scrollTo.mockClear();
  reducedMotion = false;
  Object.defineProperty(Element.prototype, 'scrollTo', { configurable: true, writable: true, value: scrollTo });
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? reducedMotion : false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  );
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function Slides({ count = 3, ...props }: Partial<CarouselProps> & { count?: number }) {
  return (
    <Carousel aria-label="Featured" {...props}>
      {Array.from({ length: count }, (_, i) => (
        <Carousel.Slide key={i}>
          <a href={`#${i + 1}`}>Slide {i + 1} link</a>
        </Carousel.Slide>
      ))}
    </Carousel>
  );
}

const slides = () => screen.getAllByRole('group', { hidden: true }).filter((el) => el.getAttribute('aria-roledescription') === 'slide');
const dots = () => within(screen.getByRole('group', { name: 'Choose slide' })).getAllByRole('button');
const currentDot = () => dots().findIndex((d) => d.getAttribute('aria-current') === 'true');
const next = () => screen.getByRole('button', { name: 'Next slide' });
const previous = () => screen.getByRole('button', { name: 'Previous slide' });
// 트랙은 역할이 없는 스크롤 상자다. 라이브 영역 속성으로 찾는다.
const track = () => screen.getByRole('region').querySelector('[aria-live]') as HTMLElement;

describe('Carousel — roles and labels', () => {
  it('is a labelled carousel region with labelled slides', () => {
    render(<Slides />);
    const region = screen.getByRole('region', { name: 'Featured' });
    expect(region).toHaveAttribute('aria-roledescription', 'carousel');
    const all = slides();
    expect(all).toHaveLength(3);
    expect(all[0]).toHaveAttribute('aria-label', '1 of 3');
    expect(all[2]).toHaveAttribute('aria-label', '3 of 3');
  });

  it('uses slideLabel and the control labels', () => {
    render(
      <Slides
        slideLabel={(i, total) => `${total}장 중 ${i}번째`}
        previousLabel="이전"
        nextLabel="다음"
      />,
    );
    expect(slides()[1]).toHaveAttribute('aria-label', '3장 중 2번째');
    expect(screen.getByRole('button', { name: '이전' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음' })).toBeInTheDocument();
  });

  it('the track is keyboard focusable and a polite live region when not auto-playing', () => {
    render(<Slides />);
    expect(track()).toHaveAttribute('tabindex', '0');
    expect(track()).toHaveAttribute('aria-live', 'polite');
  });

  it('marks off-screen slides inert in a one-slide view', () => {
    render(<Slides />);
    const all = slides();
    expect(all[0]).not.toHaveAttribute('inert');
    expect(all[1]).toHaveAttribute('inert');
    fireEvent.click(next());
    expect(slides()[0]).toHaveAttribute('inert');
    expect(slides()[1]).not.toHaveAttribute('inert');
  });

  it('leaves slides alone in fractional and auto views', () => {
    const { rerender } = render(<Slides slidesPerView={1.2} />);
    expect(slides().some((s) => s.hasAttribute('inert'))).toBe(false);
    rerender(<Slides slidesPerView="auto" />);
    expect(slides().some((s) => s.hasAttribute('inert'))).toBe(false);
  });

  it('can hide arrows and dots', () => {
    render(<Slides showArrows={false} showDots={false} />);
    expect(screen.queryByRole('button', { name: 'Next slide' })).toBeNull();
    expect(screen.queryByRole('group', { name: 'Choose slide' })).toBeNull();
  });
});

describe('Carousel — navigation', () => {
  it('next and previous change the slide and scroll the track', () => {
    const onIndexChange = vi.fn();
    render(<Slides onIndexChange={onIndexChange} />);
    expect(currentDot()).toBe(0);

    fireEvent.click(next());
    expect(currentDot()).toBe(1);
    expect(onIndexChange).toHaveBeenLastCalledWith(1);
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo.mock.calls[0][0]).toMatchObject({ behavior: 'smooth' });
    expect(scrollTo.mock.contexts[0]).toBe(track());

    fireEvent.click(previous());
    expect(currentDot()).toBe(0);
    expect(onIndexChange).toHaveBeenLastCalledWith(0);
    expect(scrollTo).toHaveBeenCalledTimes(2);
  });

  it('scrolls by the distance between the slide and the track start', () => {
    render(<Slides />);
    vi.spyOn(track(), 'getBoundingClientRect').mockReturnValue({ left: 10, right: 310, width: 300 } as DOMRect);
    vi.spyOn(slides()[1], 'getBoundingClientRect').mockReturnValue({ left: 310, right: 610, width: 300 } as DOMRect);
    Object.defineProperty(track(), 'scrollLeft', { configurable: true, value: 0 });
    fireEvent.click(next());
    expect(scrollTo.mock.calls[0][0]).toMatchObject({ left: 300 });
  });

  it('in RTL the target is measured from the right edge (scrollLeft is negative there)', () => {
    render(
      <div dir="rtl">
        <Slides />
      </div>,
    );
    vi.spyOn(track(), 'getBoundingClientRect').mockReturnValue({ left: 10, right: 310, width: 300 } as DOMRect);
    vi.spyOn(slides()[1], 'getBoundingClientRect').mockReturnValue({ left: -290, right: 10, width: 300 } as DOMRect);
    Object.defineProperty(track(), 'scrollLeft', { configurable: true, value: 0 });
    fireEvent.click(next());
    expect(scrollTo.mock.calls[0][0]).toMatchObject({ left: -300 });
  });

  it('uses instant scrolling under prefers-reduced-motion', () => {
    reducedMotion = true;
    render(<Slides />);
    fireEvent.click(next());
    expect(scrollTo.mock.calls[0][0]).toMatchObject({ behavior: 'auto' });
  });

  it('disables previous on the first slide and next on the last', () => {
    render(<Slides defaultIndex={0} />);
    expect(previous()).toBeDisabled();
    expect(next()).toBeEnabled();
    fireEvent.click(next());
    fireEvent.click(next());
    expect(currentDot()).toBe(2);
    expect(next()).toBeDisabled();
    expect(previous()).toBeEnabled();
  });

  it('with loop the ends wrap around', () => {
    render(<Slides loop defaultIndex={2} />);
    expect(next()).toBeEnabled();
    fireEvent.click(next());
    expect(currentDot()).toBe(0);
    expect(previous()).toBeEnabled();
    fireEvent.click(previous());
    expect(currentDot()).toBe(2);
  });

  it('dots jump to a slide and mark the current one', () => {
    render(<Slides />);
    const all = dots();
    expect(all).toHaveLength(3);
    expect(all[0]).toHaveAccessibleName('Go to slide 1');
    expect(all[0]).toHaveAttribute('aria-current', 'true');
    fireEvent.click(all[2]);
    expect(currentDot()).toBe(2);
    expect(dots()[0]).not.toHaveAttribute('aria-current');
  });

  it('a multi-slide view stops where the last slide comes into view', () => {
    render(<Slides count={5} slidesPerView={3} />);
    // 5 장을 3 장씩 보면 멈출 수 있는 자리는 3 곳이다.
    expect(dots()).toHaveLength(3);
    fireEvent.click(next());
    fireEvent.click(next());
    expect(next()).toBeDisabled();
  });

  it('follows a controlled index', () => {
    function Controlled() {
      const [index, setIndex] = useState(0);
      return (
        <>
          <button type="button" onClick={() => setIndex(2)}>
            jump
          </button>
          <Slides index={index} onIndexChange={setIndex} />
        </>
      );
    }
    render(<Controlled />);
    fireEvent.click(screen.getByRole('button', { name: 'jump' }));
    expect(currentDot()).toBe(2);
    expect(scrollTo).toHaveBeenCalledTimes(1);
    fireEvent.click(previous());
    expect(currentDot()).toBe(1);
  });

  it('does not move when the controlled parent ignores the change', () => {
    const onIndexChange = vi.fn();
    render(<Slides index={0} onIndexChange={onIndexChange} />);
    fireEvent.click(next());
    expect(onIndexChange).toHaveBeenCalledWith(1);
    expect(currentDot()).toBe(0);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('follows the slide the user scrolled to', () => {
    vi.useFakeTimers();
    const onIndexChange = vi.fn();
    render(<Slides onIndexChange={onIndexChange} />);
    vi.spyOn(track(), 'getBoundingClientRect').mockReturnValue({ left: 0, right: 300, width: 300 } as DOMRect);
    const all = slides();
    // 사용자가 세 번째 슬라이드까지 밀었다.
    [-600, -300, 0].forEach((left, i) =>
      vi.spyOn(all[i], 'getBoundingClientRect').mockReturnValue({ left, right: left + 300, width: 300 } as DOMRect),
    );
    fireEvent.scroll(track());
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(currentDot()).toBe(2);
    expect(onIndexChange).toHaveBeenLastCalledWith(2);
    // 사용자가 직접 옮긴 자리로 다시 스크롤하지 않는다.
    expect(scrollTo).not.toHaveBeenCalled();
  });
});

describe('Carousel — keyboard', () => {
  it('ArrowRight / ArrowLeft move one slide', () => {
    render(<Slides />);
    fireEvent.keyDown(track(), { key: 'ArrowRight' });
    expect(currentDot()).toBe(1);
    fireEvent.keyDown(track(), { key: 'ArrowLeft' });
    expect(currentDot()).toBe(0);
    // 끝에서는 멈춘다.
    fireEvent.keyDown(track(), { key: 'ArrowLeft' });
    expect(currentDot()).toBe(0);
  });

  it('Home and End jump to the ends', () => {
    render(<Slides />);
    fireEvent.keyDown(track(), { key: 'End' });
    expect(currentDot()).toBe(2);
    fireEvent.keyDown(track(), { key: 'Home' });
    expect(currentDot()).toBe(0);
  });

  it('in RTL ArrowLeft is next', () => {
    render(
      <div dir="rtl">
        <Slides />
      </div>,
    );
    fireEvent.keyDown(track(), { key: 'ArrowRight' });
    expect(currentDot()).toBe(0);
    fireEvent.keyDown(track(), { key: 'ArrowLeft' });
    expect(currentDot()).toBe(1);
    fireEvent.keyDown(track(), { key: 'ArrowRight' });
    expect(currentDot()).toBe(0);
  });

  it('leaves arrow keys alone when they come from a control inside a slide', () => {
    render(<Slides />);
    fireEvent.keyDown(screen.getByRole('link', { name: 'Slide 1 link' }), { key: 'ArrowRight' });
    expect(currentDot()).toBe(0);
  });
});

describe('Carousel — autoPlay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  const tick = (ms: number) =>
    act(() => {
      vi.advanceTimersByTime(ms);
    });

  it('advances on the interval and has a pause button', () => {
    render(<Slides autoPlay={3000} loop />);
    expect(screen.getByRole('button', { name: 'Pause slideshow' })).toBeInTheDocument();
    expect(track()).toHaveAttribute('aria-live', 'off');
    tick(3000);
    expect(currentDot()).toBe(1);
    tick(3000);
    expect(currentDot()).toBe(2);
    tick(3000);
    expect(currentDot()).toBe(0);
  });

  it('stops at the last slide without loop', () => {
    render(<Slides autoPlay={1000} defaultIndex={1} />);
    tick(1000);
    expect(currentDot()).toBe(2);
    tick(5000);
    expect(currentDot()).toBe(2);
  });

  it('has no pause button without autoPlay', () => {
    render(<Slides />);
    expect(screen.queryByRole('button', { name: 'Pause slideshow' })).toBeNull();
  });

  it('the pause button stops and resumes rotation', () => {
    render(<Slides autoPlay={3000} loop />);
    fireEvent.click(screen.getByRole('button', { name: 'Pause slideshow' }));
    expect(track()).toHaveAttribute('aria-live', 'polite');
    tick(10000);
    expect(currentDot()).toBe(0);

    fireEvent.click(screen.getByRole('button', { name: 'Play slideshow' }));
    expect(screen.getByRole('button', { name: 'Pause slideshow' })).toBeInTheDocument();
    tick(3000);
    expect(currentDot()).toBe(1);
  });

  it('pauses while hovered', () => {
    render(<Slides autoPlay={3000} loop />);
    const region = screen.getByRole('region');
    fireEvent.pointerEnter(region);
    tick(10000);
    expect(currentDot()).toBe(0);
    fireEvent.pointerLeave(region);
    tick(3000);
    expect(currentDot()).toBe(1);
  });

  it('pauses while focus is inside', () => {
    render(<Slides autoPlay={3000} loop />);
    act(() => track().focus());
    expect(track()).toHaveAttribute('aria-live', 'polite');
    tick(10000);
    expect(currentDot()).toBe(0);
    act(() => track().blur());
    tick(3000);
    expect(currentDot()).toBe(1);
  });

  it('pauses while the page is hidden', () => {
    render(<Slides autoPlay={3000} loop />);
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    tick(10000);
    expect(currentDot()).toBe(0);
    visibility.mockReturnValue('visible');
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    tick(3000);
    expect(currentDot()).toBe(1);
  });

  it('never auto-plays under prefers-reduced-motion', () => {
    reducedMotion = true;
    render(<Slides autoPlay={3000} loop />);
    tick(20000);
    expect(currentDot()).toBe(0);
    expect(screen.queryByRole('button', { name: 'Pause slideshow' })).toBeNull();
    expect(track()).toHaveAttribute('aria-live', 'polite');
  });
});
