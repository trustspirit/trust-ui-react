import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from 'react';
import { BottomSheet, type BottomSheetProps } from '../BottomSheet';
import styles from './ActionSheet.module.css';

export interface ActionSheetAction {
  /** Visible label for the action. */
  label: string;
  /** Click handler. The sheet does NOT auto-close — call onClose yourself if desired. */
  onClick: () => void;
  /** Renders the label in danger color + semibold (iOS destructive style). */
  destructive?: boolean;
  /** Disable the action. */
  disabled?: boolean;
}

export interface ActionSheetProps
  extends Omit<BottomSheetProps, 'snapPoints' | 'initialSnap' | 'showHandle' | 'children' | 'title'> {
  /** Optional title shown above the actions. */
  title?: ReactNode;
  /** Action items rendered as buttons. */
  actions: ActionSheetAction[];
  /** Label for the Cancel button. If undefined, no Cancel button is rendered. */
  cancelLabel?: string;
}

// 콘텐츠 높이에 맞춰 시트를 키우되 뷰포트의 이 비율을 넘지 않도록 자르는 상한.
// BottomSheet 의 .sheet 에도 max-height: 95vh 가 이미 걸려 있어 이중 안전망이다.
const MAX_CONTENT_SNAP = 0.9;
// 측정 전 자리값. useLayoutEffect 가 첫 페인트 전에 실제 측정값으로 덮어쓰므로
// 화면에 이 값 그대로 보이는 일은 없다.
const INITIAL_SNAP = 0.5;

/**
 * iOS HIG-style action sheet. List of buttons + optional Cancel.
 * Composes BottomSheet — backdrop tap + ESC still trigger onClose.
 *
 * Sizes itself to its content (title + actions + cancel), capped at 90% of the
 * viewport height, instead of a fixed fraction — a caller with many actions no
 * longer gets its last item and Cancel button clipped below the fold. Sheet
 * sizing is not exposed as a prop: this component owns that promise, not the
 * caller. Content that still exceeds the cap scrolls (inherited from
 * BottomSheet's content area).
 *
 * Use for "what would you like to do with this item?" patterns.
 * For "this needs your decision now" use a Dialog instead.
 */
export const ActionSheet = forwardRef<HTMLDivElement, ActionSheetProps>(
  function ActionSheet({ title, actions, cancelLabel, onClose, ...sheetProps }, ref) {
    // 콜백 ref 를 state 로 받는다 — 이 노드가 실제로 DOM 에 붙는 시점(=
    // BottomSheet 가 열려 포털을 마운트한 시점)에만 측정해야 하기 때문이다.
    // `open` prop 에 의존하는 effect 로는 타이밍을 맞출 수 없다: `open` 이
    // true 로 바뀐 바로 그 렌더에서는 BottomSheet 의 내부 `mounted` 상태가
    // 아직 갱신되지 않아 콘텐츠가 실제로 DOM 에 없다(한 렌더 늦게 붙는다).
    const [contentNode, setContentNode] = useState<HTMLDivElement | null>(null);
    const [snapPoints, setSnapPoints] = useState<number[]>([INITIAL_SNAP]);

    const measure = useCallback(() => {
      if (!contentNode || typeof window === 'undefined') return;
      const viewportHeight = window.innerHeight || 1;
      // contentNode 의 부모는 BottomSheet 의 .content 래퍼다 — 거기 걸린
      // padding(top/bottom, 안전영역 포함)까지 포함해 재는 편이, 우리 자신의
      // scrollHeight 만 재는 것보다 실제로 필요한 시트 높이에 더 가깝다.
      const measured = contentNode.parentElement?.scrollHeight ?? contentNode.scrollHeight;
      const fraction = Math.min(measured / viewportHeight, MAX_CONTENT_SNAP);
      setSnapPoints([fraction]);
    }, [contentNode]);

    // 첫 측정: 마운트 시점 + 제목/항목/취소 라벨이 바뀔 때(내용 자체가 달라지면
    // 다시 재야 한다). useLayoutEffect 라 페인트 전에 끝나 깜빡임이 없다.
    useLayoutEffect(() => {
      measure();
    }, [measure, title, actions, cancelLabel]);

    // 열린 채로 내용 크기가 바뀌는 경우(예: 항목이 비동기로 갱신)를 대비한다.
    useEffect(() => {
      if (!contentNode || typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(measure);
      observer.observe(contentNode);
      return () => observer.disconnect();
    }, [contentNode, measure]);

    // 회전/뷰포트 변경 시에도 비율을 다시 계산한다.
    useEffect(() => {
      if (typeof window === 'undefined') return;
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }, [measure]);

    return (
      <BottomSheet
        ref={ref}
        onClose={onClose}
        showHandle={false}
        dismissible={false}
        snapPoints={snapPoints}
        {...sheetProps}
      >
        <div ref={setContentNode}>
          {title && <h3 className={styles.title}>{title}</h3>}
          <ul className={styles.actionGroup}>
            {actions.map((action, idx) => (
              <li key={idx}>
                <button
                  type="button"
                  className={[styles.actionItem, action.destructive && styles.destructive]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={action.onClick}
                  disabled={action.disabled}
                >
                  {action.label}
                </button>
              </li>
            ))}
          </ul>
          {cancelLabel && (
            <button
              type="button"
              className={[styles.actionItem, styles.cancel].join(' ')}
              onClick={onClose}
            >
              {cancelLabel}
            </button>
          )}
        </div>
      </BottomSheet>
    );
  },
);
