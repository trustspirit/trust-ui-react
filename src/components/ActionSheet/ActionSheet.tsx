import { forwardRef, type ReactNode } from 'react';
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

/**
 * iOS HIG-style action sheet. List of buttons + optional Cancel.
 * Composes BottomSheet — backdrop tap + ESC still trigger onClose.
 *
 * Use for "what would you like to do with this item?" patterns.
 * For "this needs your decision now" use a Dialog instead.
 */
export const ActionSheet = forwardRef<HTMLDivElement, ActionSheetProps>(
  function ActionSheet({ title, actions, cancelLabel, onClose, ...sheetProps }, ref) {
    return (
      <BottomSheet
        ref={ref}
        onClose={onClose}
        showHandle={false}
        dismissible={false}
        snapPoints={[0.5]}
        {...sheetProps}
      >
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
      </BottomSheet>
    );
  },
);
