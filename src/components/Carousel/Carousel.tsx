import {
  Children,
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { isRtl } from '../../utils/direction';
import styles from './Carousel.module.css';

/* ── Context ── */

interface SlideContextValue {
  index: number;
  label: string;
  /** 한 장씩 보는 구성에서 화면 밖 슬라이드인지. 포커스가 보이지 않는 곳으로 들어가지 않게 한다. */
  inert: boolean;
  register: (index: number, element: HTMLElement | null) => void;
}

const SlideContext = createContext<SlideContextValue | null>(null);

/* ── Props ── */

export interface CarouselProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Accessible name of the carousel */
  'aria-label'?: string;
  /** Id of the element that names the carousel */
  'aria-labelledby'?: string;
  /**
   * Slides visible at once. A fraction (1.2) shows a peek of the next slide;
   * `'auto'` uses each slide's own width.
   */
  slidesPerView?: number | 'auto';
  /** Space between slides, on the spacing scale */
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Current slide, zero-based (controlled) */
  index?: number;
  /** Initial slide, zero-based (uncontrolled) */
  defaultIndex?: number;
  /** Called when the current slide changes, by the controls, the keyboard or swiping */
  onIndexChange?: (index: number) => void;
  /** Lets next on the last slide return to the first, and previous on the first go to the last */
  loop?: boolean;
  /**
   * Previous/next buttons. By default they are shown with a mouse and hidden on touch,
   * where swiping is the affordance. `'hover'` shows them while the carousel is hovered or focused.
   */
  showArrows?: boolean | 'hover';
  /** Shows one dot button per position */
  showDots?: boolean;
  /**
   * Advances automatically every N milliseconds. Pauses on hover, on focus within and
   * while the page is hidden; never runs under `prefers-reduced-motion`.
   * Without `loop` it stops at the last slide.
   */
  autoPlay?: number;
  /** Where a slide snaps inside the track */
  align?: 'start' | 'center';
  /** Accessible name of the previous button */
  previousLabel?: string;
  /** Accessible name of the next button */
  nextLabel?: string;
  /** Accessible name of the button that pauses auto-play */
  pauseLabel?: string;
  /** Accessible name of the button that resumes auto-play */
  playLabel?: string;
  /** Accessible name of the group of dots */
  dotsLabel?: string;
  /** Accessible name of one dot. Receives the one-based position and the number of positions. */
  dotLabel?: (index: number, total: number) => string;
  /** Accessible name of one slide. Receives the one-based index and the number of slides. */
  slideLabel?: (index: number, total: number) => string;
  /** `Carousel.Slide` elements */
  children?: ReactNode;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
}

export interface CarouselSlideProps extends HTMLAttributes<HTMLDivElement> {
  /** Slide content */
  children?: ReactNode;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: CSSProperties;
}

/* ── Helpers ── */

const defaultSlideLabel = (index: number, total: number) => `${index} of ${total}`;
const defaultDotLabel = (index: number) => `Go to slide ${index}`;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

// 부드러운 스크롤이 끝났다고 보는 시간. scrollend 를 모르는 브라우저(Safari)의 안전망이다.
const SETTLE_TIMEOUT = 1000;

function ArrowIcon({ direction }: { direction: 'previous' | 'next' }) {
  return (
    <svg
      className="tui-mirror-rtl"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points={direction === 'previous' ? '15 6 9 12 15 18' : '9 6 15 12 9 18'} />
    </svg>
  );
}

function PlayPauseIcon({ playing }: { playing: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {playing ? (
        <>
          <rect x="5" y="4" width="5" height="16" rx="1" />
          <rect x="14" y="4" width="5" height="16" rx="1" />
        </>
      ) : (
        <polygon points="7 4 20 12 7 20" />
      )}
    </svg>
  );
}

/* ── Carousel ── */

const CarouselRoot = forwardRef<HTMLDivElement, CarouselProps>(
  (
    {
      slidesPerView = 1,
      gap = 0,
      index: controlledIndex,
      defaultIndex = 0,
      onIndexChange,
      loop = false,
      showArrows,
      showDots = true,
      autoPlay,
      align = 'start',
      previousLabel = 'Previous slide',
      nextLabel = 'Next slide',
      pauseLabel = 'Pause slideshow',
      playLabel = 'Play slideshow',
      dotsLabel = 'Choose slide',
      dotLabel = defaultDotLabel,
      slideLabel = defaultSlideLabel,
      children,
      className,
      style,
      onPointerEnter,
      onPointerLeave,
      onFocus,
      onBlur,
      ...rest
    },
    ref,
  ) => {
    const slides = Children.toArray(children);
    const total = slides.length;

    // 여러 장을 함께 보면 마지막 장이 화면에 들어오는 순간 더 갈 곳이 없다.
    // 멈출 수 있는 자리의 수는 슬라이드 수보다 적다.
    const perView = typeof slidesPerView === 'number' ? Math.max(slidesPerView, 1) : 1;
    const lastIndex =
      typeof slidesPerView === 'number' && align === 'start'
        ? Math.max(0, total - Math.floor(perView))
        : Math.max(0, total - 1);
    const clamp = (i: number) => Math.min(Math.max(i, 0), lastIndex);

    const [internalIndex, setInternalIndex] = useState(defaultIndex);
    const isControlled = controlledIndex !== undefined;
    const current = clamp(isControlled ? controlledIndex : internalIndex);

    const trackRef = useRef<HTMLDivElement>(null);
    const slideEls = useRef<(HTMLElement | null)[]>([]);
    // 트랙이 실제로 보여 주고 있는 자리. current 와 다를 때만 스크롤한다.
    const visibleRef = useRef(0);
    // 버튼으로 시작한 스크롤이 향하는 자리. 지나가는 슬라이드를 "현재"로 잡지 않게 한다.
    const pendingRef = useRef<number | null>(null);
    const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mounted = useRef(false);

    const register = useCallback((i: number, element: HTMLElement | null) => {
      slideEls.current[i] = element;
    }, []);

    const onIndexChangeRef = useRef(onIndexChange);
    onIndexChangeRef.current = onIndexChange;
    const currentRef = useRef(current);
    currentRef.current = current;

    const select = useCallback(
      (next: number) => {
        if (next === currentRef.current) return;
        if (!isControlled) setInternalIndex(next);
        onIndexChangeRef.current?.(next);
      },
      [isControlled],
    );

    /* ── 스크롤 ── */

    const clearPending = useCallback(() => {
      pendingRef.current = null;
      if (settleTimer.current !== null) {
        clearTimeout(settleTimer.current);
        settleTimer.current = null;
      }
    }, []);

    /**
     * 슬라이드와 트랙의 화면상 거리. scrollLeft 는 RTL 에서 음수로 가므로 절대 위치를
     * 계산하지 않고, 지금 위치에서 얼마나 더 가야 하는지만 구한다. 화면 좌표의 차이는
     * 글 방향과 무관하게 scrollLeft 에 그대로 더할 수 있다.
     */
    const offsetOf = useCallback(
      (slide: HTMLElement, track: HTMLElement) => {
        const s = slide.getBoundingClientRect();
        const t = track.getBoundingClientRect();
        if (align === 'center') return (s.left + s.right) / 2 - (t.left + t.right) / 2;
        return isRtl(track) ? s.right - t.right : s.left - t.left;
      },
      [align],
    );

    const scrollToIndex = useCallback(
      (target: number, instant: boolean) => {
        const track = trackRef.current;
        const slide = slideEls.current[target];
        if (!track || !slide) return;

        clearPending();
        pendingRef.current = target;
        settleTimer.current = setTimeout(clearPending, SETTLE_TIMEOUT);

        const left = track.scrollLeft + offsetOf(slide, track);
        const behavior: ScrollBehavior = instant || prefersReducedMotion() ? 'auto' : 'smooth';
        // scrollIntoView 는 쓰지 않는다. 조상 스크롤 상자까지 움직여서, 자동 재생 중인
        // 캐러셀이 화면 밖에 있으면 페이지를 끌고 간다.
        if (typeof track.scrollTo === 'function') track.scrollTo({ left, behavior });
        else track.scrollLeft = left;
      },
      [clearPending, offsetOf],
    );

    useEffect(() => {
      if (current !== visibleRef.current) {
        visibleRef.current = current;
        // 처음 그릴 때의 위치 맞춤은 움직임 없이 한다.
        scrollToIndex(current, !mounted.current);
      }
      mounted.current = true;
    }, [current, scrollToIndex]);

    useEffect(() => clearPending, [clearPending]);

    /* ── 현재 슬라이드 추적 ── */

    const syncFromLayout = useCallback(() => {
      const track = trackRef.current;
      if (!track) return;
      let nearest = -1;
      let best = Infinity;
      slideEls.current.forEach((slide, i) => {
        if (!slide || i > lastIndex) return;
        const distance = Math.abs(offsetOf(slide, track));
        if (distance < best) {
          best = distance;
          nearest = i;
        }
      });
      if (nearest < 0) return;

      if (pendingRef.current !== null) {
        // 목적지에 닿을 때까지는 지나가는 슬라이드를 무시한다.
        if (nearest === pendingRef.current) clearPending();
        return;
      }
      if (nearest === visibleRef.current) return;
      visibleRef.current = nearest;
      select(nearest);
    }, [clearPending, lastIndex, offsetOf, select]);

    useEffect(() => {
      const track = trackRef.current;
      if (!track) return;

      // 사용자가 직접 밀기 시작하면 버튼 스크롤의 목적지는 더 이상 의미가 없다.
      const interrupt = () => clearPending();
      track.addEventListener('pointerdown', interrupt, { passive: true });
      track.addEventListener('wheel', interrupt, { passive: true });
      track.addEventListener('touchstart', interrupt, { passive: true });
      track.addEventListener('scrollend', syncFromLayout);

      let cleanupTracking: () => void;
      if (typeof IntersectionObserver !== 'undefined') {
        // 슬라이드가 트랙 경계를 넘을 때만 불린다. 스크롤 이벤트마다 재는 것보다 드물다.
        const observer = new IntersectionObserver(syncFromLayout, {
          root: track,
          threshold: [0, 0.25, 0.5, 0.75, 1],
        });
        slideEls.current.forEach((slide) => slide && observer.observe(slide));
        cleanupTracking = () => observer.disconnect();
      } else {
        let frame: number | null = null;
        const onScroll = () => {
          if (frame !== null) return;
          frame = requestAnimationFrame(() => {
            frame = null;
            syncFromLayout();
          });
        };
        track.addEventListener('scroll', onScroll, { passive: true });
        cleanupTracking = () => {
          track.removeEventListener('scroll', onScroll);
          if (frame !== null) cancelAnimationFrame(frame);
        };
      }

      return () => {
        track.removeEventListener('pointerdown', interrupt);
        track.removeEventListener('wheel', interrupt);
        track.removeEventListener('touchstart', interrupt);
        track.removeEventListener('scrollend', syncFromLayout);
        cleanupTracking();
      };
    }, [clearPending, syncFromLayout, total]);

    /* ── 이동 ── */

    const canPrevious = total > 1 && (loop || current > 0);
    const canNext = total > 1 && (loop || current < lastIndex);

    const goPrevious = () => {
      if (!canPrevious) return;
      select(current > 0 ? current - 1 : lastIndex);
    };
    const goNext = () => {
      if (!canNext) return;
      select(current < lastIndex ? current + 1 : 0);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      // 슬라이드 안의 입력·링크에서 온 화살표 키는 그 컨트롤의 것이다.
      if (e.target !== e.currentTarget) return;
      const rtl = isRtl(e.currentTarget);
      switch (e.key) {
        case rtl ? 'ArrowLeft' : 'ArrowRight':
          e.preventDefault();
          goNext();
          break;
        case rtl ? 'ArrowRight' : 'ArrowLeft':
          e.preventDefault();
          goPrevious();
          break;
        case 'Home':
          e.preventDefault();
          select(0);
          break;
        case 'End':
          e.preventDefault();
          select(lastIndex);
          break;
      }
    };

    /* ── 자동 재생 ── */

    const [reducedMotion, setReducedMotion] = useState(false);
    const [userPaused, setUserPaused] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [focusWithin, setFocusWithin] = useState(false);
    const [pageHidden, setPageHidden] = useState(false);

    const autoPlayRequested = typeof autoPlay === 'number' && autoPlay > 0;

    useEffect(() => {
      if (!autoPlayRequested || typeof window.matchMedia !== 'function') return;
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mq.matches);
      const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mq.addEventListener?.('change', onChange);
      return () => mq.removeEventListener?.('change', onChange);
    }, [autoPlayRequested]);

    useEffect(() => {
      if (!autoPlayRequested) return;
      const onVisibility = () => setPageHidden(document.visibilityState === 'hidden');
      onVisibility();
      document.addEventListener('visibilitychange', onVisibility);
      return () => document.removeEventListener('visibilitychange', onVisibility);
    }, [autoPlayRequested]);

    // 움직임을 줄여 달라는 설정에서는 자동 재생 자체가 없다. 멈춤 버튼도 필요 없다.
    const autoPlayEnabled = autoPlayRequested && !reducedMotion;
    const rotating = autoPlayEnabled && !userPaused && !hovered && !focusWithin && !pageHidden;

    const goNextRef = useRef(goNext);
    goNextRef.current = goNext;

    useEffect(() => {
      if (!rotating || !canNext) return;
      // current 가 바뀔 때마다 다시 건다. 사용자가 직접 넘긴 직후에 곧바로 또 넘어가지 않는다.
      const timer = setTimeout(() => goNextRef.current(), autoPlay);
      return () => clearTimeout(timer);
    }, [rotating, canNext, current, autoPlay]);

    const handlePointerEnter = (e: PointerEvent<HTMLDivElement>) => {
      // 터치에는 "올려 둠"이 없다. 탭한 뒤 leave 가 오지 않아 영영 멈춘다.
      if (e.pointerType !== 'touch') setHovered(true);
      onPointerEnter?.(e);
    };
    const handlePointerLeave = (e: PointerEvent<HTMLDivElement>) => {
      setHovered(false);
      onPointerLeave?.(e);
    };
    const handleFocus = (e: FocusEvent<HTMLDivElement>) => {
      setFocusWithin(true);
      onFocus?.(e);
    };
    const handleBlur = (e: FocusEvent<HTMLDivElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusWithin(false);
      onBlur?.(e);
    };

    /* ── Render ── */

    const single = slidesPerView === 1;
    const arrowsMode = showArrows === undefined ? 'auto' : showArrows === 'hover' ? 'hover' : showArrows ? 'always' : 'none';

    const rootClassNames = [
      styles.carousel,
      styles[`gap${gap}`],
      slidesPerView === 'auto' ? styles.autoWidth : '',
      single ? styles.single : '',
      align === 'center' ? styles.alignCenter : '',
      arrowsMode === 'auto' ? styles.arrowsAuto : '',
      arrowsMode === 'hover' ? styles.arrowsHover : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    const rootStyle = {
      ...style,
      // 슬라이드 폭 계산에 쓰는 값. 모듈 CSS 의 기본값(1)을 덮는다.
      '--tui-carousel-per-view': perView,
    } as CSSProperties;

    const positions = lastIndex + 1;

    return (
      <div
        role="region"
        aria-roledescription="carousel"
        {...rest}
        ref={ref}
        className={rootClassNames}
        style={rootStyle}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        <div className={styles.viewport}>
          {arrowsMode !== 'none' && (
            <button
              type="button"
              className={`${styles.arrow} ${styles.arrowPrevious}`}
              aria-label={previousLabel}
              disabled={!canPrevious}
              onClick={goPrevious}
            >
              <ArrowIcon direction="previous" />
            </button>
          )}
          <div
            ref={trackRef}
            className={styles.track}
            // 스크롤 상자는 키보드로도 움직일 수 있어야 한다.
            tabIndex={0}
            // 돌아가는 동안 매 슬라이드를 읽으면 다른 낭독을 끊는다. 멈춰 있을 때만 알린다.
            aria-live={rotating ? 'off' : 'polite'}
            aria-atomic="false"
            onKeyDown={handleKeyDown}
          >
            {slides.map((slide, i) => (
              <SlideContext.Provider
                // eslint-disable-next-line react/no-array-index-key
                key={i}
                value={{
                  index: i,
                  label: slideLabel(i + 1, total),
                  inert: single && i !== current,
                  register,
                }}
              >
                {slide}
              </SlideContext.Provider>
            ))}
          </div>
          {arrowsMode !== 'none' && (
            <button
              type="button"
              className={`${styles.arrow} ${styles.arrowNext}`}
              aria-label={nextLabel}
              disabled={!canNext}
              onClick={goNext}
            >
              <ArrowIcon direction="next" />
            </button>
          )}
        </div>

        {(autoPlayEnabled || (showDots && positions > 1)) && (
          <div className={styles.controls}>
            {autoPlayEnabled && (
              <button
                type="button"
                className={styles.playPause}
                aria-label={userPaused ? playLabel : pauseLabel}
                onClick={() => setUserPaused((paused) => !paused)}
              >
                <PlayPauseIcon playing={!userPaused} />
              </button>
            )}
            {showDots && positions > 1 && (
              <div role="group" aria-label={dotsLabel} className={styles.dots}>
                {Array.from({ length: positions }, (_, i) => (
                  <button
                    // eslint-disable-next-line react/no-array-index-key
                    key={i}
                    type="button"
                    className={styles.dot}
                    aria-label={dotLabel(i + 1, positions)}
                    aria-current={i === current ? 'true' : undefined}
                    onClick={() => select(i)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
);

CarouselRoot.displayName = 'Carousel';

/* ── Carousel.Slide ── */

const CarouselSlide = forwardRef<HTMLDivElement, CarouselSlideProps>(
  ({ children, className, ...rest }, ref) => {
    const ctx = useContext(SlideContext);
    if (!ctx) {
      throw new Error('Carousel.Slide must be used within <Carousel>');
    }
    const { index, label, inert, register } = ctx;

    const elementRef = useRef<HTMLDivElement | null>(null);
    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        elementRef.current = node;
        register(index, node);
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      },
      [index, ref, register],
    );

    // React 18 은 inert prop 을 모른다. 속성을 직접 다룬다(Expander 와 같은 방식).
    useEffect(() => {
      elementRef.current?.toggleAttribute('inert', inert);
    }, [inert]);

    return (
      <div
        role="group"
        aria-roledescription="slide"
        aria-label={label}
        {...rest}
        ref={setRefs}
        className={[styles.slide, className ?? ''].filter(Boolean).join(' ')}
      >
        {children}
      </div>
    );
  },
);

CarouselSlide.displayName = 'Carousel.Slide';

/* ── Export as compound component ── */

export const Carousel = Object.assign(CarouselRoot, {
  Slide: CarouselSlide,
});
