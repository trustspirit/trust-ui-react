import { useState, type CSSProperties, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Carousel } from './Carousel';

const meta: Meta<typeof Carousel> = {
  title: 'Components/Carousel',
  component: Carousel,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 560 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Carousel>;

const panel: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  gap: 'var(--tui-gap-1)',
  minHeight: 180,
  padding: 'var(--tui-pad-4)',
  boxSizing: 'border-box',
  border: '1px solid var(--tui-rule)',
  borderRadius: 'var(--tui-radius-sheet)',
  background: 'var(--tui-field)',
  color: 'var(--tui-ink)',
};

function Panel({ n, children, style }: { n: number; children?: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ ...panel, ...style }}>
      <span style={{ fontSize: 'var(--tui-font-size-caption)', color: 'var(--tui-ink-2)' }}>No. {n}</span>
      <strong style={{ fontSize: 'var(--tui-font-size-h3)' }}>Slide {n}</strong>
      {children}
    </div>
  );
}

const five = [1, 2, 3, 4, 5];

export const Default: Story = {
  render: () => (
    <Carousel aria-label="Featured">
      {five.map((n) => (
        <Carousel.Slide key={n}>
          <Panel n={n} />
        </Carousel.Slide>
      ))}
    </Carousel>
  ),
};

export const Peek: Story = {
  render: () => (
    <Carousel aria-label="Featured" slidesPerView={1.2} gap={3}>
      {five.map((n) => (
        <Carousel.Slide key={n}>
          <Panel n={n} />
        </Carousel.Slide>
      ))}
    </Carousel>
  ),
};

export const MultipleSlides: Story = {
  render: () => (
    <Carousel aria-label="Products" slidesPerView={3} gap={3}>
      {[1, 2, 3, 4, 5, 6, 7].map((n) => (
        <Carousel.Slide key={n}>
          <Panel n={n} style={{ minHeight: 120 }} />
        </Carousel.Slide>
      ))}
    </Carousel>
  ),
};

export const AutoWidth: Story = {
  render: () => (
    <Carousel aria-label="Tags" slidesPerView="auto" gap={2} showDots={false}>
      {[120, 200, 160, 240, 140, 180, 220].map((width, i) => (
        <Carousel.Slide key={width}>
          <Panel n={i + 1} style={{ width, minHeight: 100 }} />
        </Carousel.Slide>
      ))}
    </Carousel>
  ),
};

export const CenterAligned: Story = {
  render: () => (
    <Carousel aria-label="Featured" slidesPerView={1.4} gap={3} align="center">
      {five.map((n) => (
        <Carousel.Slide key={n}>
          <Panel n={n} />
        </Carousel.Slide>
      ))}
    </Carousel>
  ),
};

export const Loop: Story = {
  render: () => (
    <Carousel aria-label="Featured" loop>
      {five.map((n) => (
        <Carousel.Slide key={n}>
          <Panel n={n} />
        </Carousel.Slide>
      ))}
    </Carousel>
  ),
};

export const ArrowsOnHover: Story = {
  render: () => (
    <Carousel aria-label="Featured" showArrows="hover">
      {five.map((n) => (
        <Carousel.Slide key={n}>
          <Panel n={n} />
        </Carousel.Slide>
      ))}
    </Carousel>
  ),
};

export const AutoPlay: Story = {
  render: () => (
    <Carousel aria-label="Announcements" autoPlay={4000} loop>
      {five.map((n) => (
        <Carousel.Slide key={n}>
          <Panel n={n}>
            <a href="#more" style={{ color: 'inherit' }}>
              Read more
            </a>
          </Panel>
        </Carousel.Slide>
      ))}
    </Carousel>
  ),
};

export const Controlled: Story = {
  render: function Render() {
    const [index, setIndex] = useState(0);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--tui-gap-3)' }}>
        <Carousel aria-label="Featured" index={index} onIndexChange={setIndex}>
          {five.map((n) => (
            <Carousel.Slide key={n}>
              <Panel n={n} />
            </Carousel.Slide>
          ))}
        </Carousel>
        <div style={{ display: 'flex', gap: 'var(--tui-gap-2)', alignItems: 'center' }}>
          <button type="button" onClick={() => setIndex(0)}>
            First
          </button>
          <button type="button" onClick={() => setIndex(4)}>
            Last
          </button>
          <span style={{ fontSize: 'var(--tui-font-size-small)', color: 'var(--tui-ink-2)' }}>
            index: {index}
          </span>
        </div>
      </div>
    );
  },
};

export const RightToLeft: Story = {
  render: () => (
    <div dir="rtl">
      <Carousel
        aria-label="مميز"
        slidesPerView={1.2}
        gap={3}
        previousLabel="السابق"
        nextLabel="التالي"
      >
        {five.map((n) => (
          <Carousel.Slide key={n}>
            <Panel n={n} />
          </Carousel.Slide>
        ))}
      </Carousel>
    </div>
  ),
};
