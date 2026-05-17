import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import { useTouchDevice } from './useTouchDevice';
import { useHaptic } from './useHaptic';
import { useVisualViewport } from './useVisualViewport';
import { useSwipe } from './useSwipe';
import { useLongPress } from './useLongPress';
import { useDrag } from './useDrag';

const meta: Meta = {
  title: 'Foundation/Touch Hooks',
};
export default meta;
type Story = StoryObj;

const cardStyle: React.CSSProperties = {
  padding: 24,
  borderRadius: 'var(--tui-radius-lg)',
  border: '1px solid var(--tui-border)',
  background: 'var(--tui-bg-subtle)',
  fontFamily: 'var(--tui-font-sans)',
  color: 'var(--tui-text)',
};

export const UseTouchDevice: Story = {
  render: () => {
    const isTouch = useTouchDevice();
    return (
      <div style={cardStyle}>
        <h3>useTouchDevice</h3>
        <p>Current pointer environment: <strong>{isTouch ? 'touch (coarse)' : 'mouse (fine)'}</strong></p>
        <p style={{ fontSize: 13, color: 'var(--tui-text-muted)' }}>
          Try opening Chrome DevTools → Device toolbar → enable mobile emulation, then reload.
        </p>
      </div>
    );
  },
};

export const UseHaptic: Story = {
  render: () => {
    const haptic = useHaptic();
    return (
      <div style={cardStyle}>
        <h3>useHaptic</h3>
        <p style={{ fontSize: 13, color: 'var(--tui-text-muted)' }}>
          Best-effort Vibration API (Android only; iOS Safari silently no-ops).
          Mount HapticProvider with a native bridge trigger to enable iOS.
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          {(['light', 'medium', 'heavy', 'success', 'warning', 'error'] as const).map((type) => (
            <button
              key={type}
              onClick={() => haptic(type)}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--tui-radius-md)',
                background: 'var(--tui-primary)',
                color: 'var(--tui-primary-text)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
    );
  },
};

export const UseVisualViewport: Story = {
  render: () => {
    const vv = useVisualViewport();
    return (
      <div style={cardStyle}>
        <h3>useVisualViewport</h3>
        <pre style={{ fontSize: 13, fontFamily: 'var(--tui-font-mono)' }}>
          {`height:       ${vv.height}
offsetTop:    ${vv.offsetTop}
keyboardOpen: ${vv.keyboardOpen}`}
        </pre>
        <input
          style={{
            marginTop: 12,
            padding: 10,
            borderRadius: 'var(--tui-radius-md)',
            border: '1px solid var(--tui-border)',
            background: 'var(--tui-bg)',
            color: 'var(--tui-text)',
            width: '100%',
          }}
          placeholder="Focus me on a mobile device to open keyboard"
        />
      </div>
    );
  },
};

export const UseSwipe: Story = {
  render: () => {
    const ref = useRef<HTMLDivElement | null>(null);
    const [event, setEvent] = useState('—');
    useSwipe(ref, {
      onSwipeUp: () => setEvent('swiped UP'),
      onSwipeDown: () => setEvent('swiped DOWN'),
      onSwipeLeft: () => setEvent('swiped LEFT'),
      onSwipeRight: () => setEvent('swiped RIGHT'),
    });
    return (
      <div style={cardStyle}>
        <h3>useSwipe</h3>
        <div
          ref={ref}
          style={{
            marginTop: 12,
            height: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--tui-primary-subtle)',
            color: 'var(--tui-primary)',
            borderRadius: 'var(--tui-radius-lg)',
            userSelect: 'none',
            touchAction: 'none',
          }}
        >
          Swipe here · last: <strong style={{ marginLeft: 8 }}>{event}</strong>
        </div>
      </div>
    );
  },
};

export const UseLongPress: Story = {
  render: () => {
    const ref = useRef<HTMLButtonElement | null>(null);
    const [count, setCount] = useState(0);
    useLongPress(ref, () => setCount((c) => c + 1));
    return (
      <div style={cardStyle}>
        <h3>useLongPress</h3>
        <p>Long-press count: <strong>{count}</strong></p>
        <button
          ref={ref}
          style={{
            marginTop: 12,
            padding: '12px 20px',
            background: 'var(--tui-primary)',
            color: 'var(--tui-primary-text)',
            border: 'none',
            borderRadius: 'var(--tui-radius-md)',
            cursor: 'pointer',
          }}
        >
          Hold for 500ms
        </button>
      </div>
    );
  },
};

export const UseDrag: Story = {
  render: () => {
    const ref = useRef<HTMLDivElement | null>(null);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    useDrag(ref, {
      onDrag: setOffset,
      onDragEnd: () => setOffset({ x: 0, y: 0 }),
    });
    return (
      <div style={cardStyle}>
        <h3>useDrag</h3>
        <div style={{ height: 200, position: 'relative', background: 'var(--tui-bg-muted)', borderRadius: 'var(--tui-radius-lg)', marginTop: 12 }}>
          <div
            ref={ref}
            style={{
              position: 'absolute',
              top: 80,
              left: 80,
              width: 60,
              height: 60,
              borderRadius: 'var(--tui-radius-md)',
              background: 'var(--tui-primary)',
              transform: `translate(${offset.x}px, ${offset.y}px)`,
              touchAction: 'none',
              cursor: 'grab',
            }}
          />
        </div>
      </div>
    );
  },
};
