import { forwardRef, useId, type HTMLAttributes, type ReactNode } from 'react';
import { VisuallyHidden } from '../VisuallyHidden';
import styles from './Field.module.css';

/** Props to spread onto the control rendered inside a `Field`. */
export interface FieldControlProps {
  /** Id the label points at (or the id of the group element in `group` mode). */
  id: string;
  /** Ids of the error message or, when there is none, the helper text. */
  'aria-describedby'?: string;
  /** Set while the field is in the error state. */
  'aria-invalid'?: true;
  /** Set when the field is required. */
  'aria-required'?: true;
  /** Id of the label. Only set in `group` mode, where `htmlFor` cannot name the control. */
  'aria-labelledby'?: string;
  /** Native `required`. Omitted in `group` mode (not valid on a group element). */
  required?: boolean;
  /** Native `disabled`. */
  disabled?: boolean;
}

/** Extra information for controls that need more than the spreadable props. */
export interface FieldMeta {
  /** Id of the label element. Use it to name popups that belong to the control. */
  labelId: string;
  /** Id of the helper text element (rendered only while there is helper text and no error message). */
  helperId: string;
  /** Id of the always-present error message element. */
  errorId: string;
  /** Whether the field is in the error state (`error` or a non-empty `errorMessage`). */
  invalid: boolean;
}

export interface FieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'id'> {
  /** Label text. Always the accessible name of the control, even when hidden. */
  label: ReactNode;
  /** Helper text displayed below the control */
  helperText?: ReactNode;
  /** Whether the field is in error state */
  error?: boolean;
  /** Error message displayed below the control. Replaces the helper text. */
  errorMessage?: ReactNode;
  /** Whether the field is required (shows an asterisk) */
  required?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Hides the label visually. It remains the accessible name. */
  hideLabel?: boolean;
  /**
   * For controls made of several elements (radio/checkbox groups, segmented inputs).
   * Renders the label as a `<span>` and passes `aria-labelledby` to the control.
   */
  group?: boolean;
  /** Overrides the generated control id */
  id?: string;
  /** Stretches the field to fill its container */
  fullWidth?: boolean;
  /** Render prop. Spread `control` onto the focusable control (or the group element). */
  children: (control: FieldControlProps, meta: FieldMeta) => ReactNode;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

export interface FieldSurfaceOptions {
  /** Visual variant */
  variant?: 'outlined' | 'filled';
  /** Draws the error border */
  error?: boolean;
  /** Dims the surface */
  disabled?: boolean;
}

/**
 * Class names for the box around an input (border, background, focus and error states),
 * identical to TextField's. NumberInput, Combobox and TimeInput share it so the
 * inputs stay visual siblings.
 */
export function fieldSurfaceClassName({
  variant = 'outlined',
  error = false,
  disabled = false,
}: FieldSurfaceOptions = {}): string {
  return [
    styles.surface,
    styles[variant],
    error ? styles.surfaceError : '',
    disabled ? styles.surfaceDisabled : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export const Field = forwardRef<HTMLDivElement, FieldProps>(
  (
    {
      label,
      helperText,
      error = false,
      errorMessage,
      required = false,
      disabled = false,
      hideLabel = false,
      group = false,
      id: idProp,
      fullWidth = false,
      children,
      className,
      style,
      ...rest
    },
    ref,
  ) => {
    const uid = useId();
    const controlId = idProp ?? `${uid}-control`;
    const labelId = `${uid}-label`;
    const helperId = `${uid}-helper`;
    const errorId = `${uid}-error`;

    const hasErrorMessage = errorMessage !== undefined && errorMessage !== null && errorMessage !== '';
    const hasHelper = helperText !== undefined && helperText !== null && helperText !== '';
    const invalid = error || hasErrorMessage;

    const control: FieldControlProps = {
      id: controlId,
      'aria-describedby': hasErrorMessage ? errorId : hasHelper ? helperId : undefined,
      'aria-invalid': invalid || undefined,
      'aria-required': required || undefined,
      'aria-labelledby': group ? labelId : undefined,
      required: group ? undefined : required || undefined,
      disabled: disabled || undefined,
    };

    const labelClassNames = [
      styles.label,
      invalid ? styles.labelError : '',
      disabled ? styles.labelDisabled : '',
    ]
      .filter(Boolean)
      .join(' ');

    const labelContent = (
      <>
        {label}
        {/* 별표는 시각 표시다. 필수 여부는 aria-required 로 전달되므로 이름에는 섞지 않는다. */}
        {required && (
          <span className={styles.requiredAsterisk} aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </>
    );

    // group 모드: <label for> 는 하나의 폼 컨트롤만 가리킬 수 있다. 여러 요소로 된
    // 컨트롤은 span + aria-labelledby 로 이름을 준다.
    const labelProps = group ? { id: labelId } : { id: labelId, htmlFor: controlId };
    const LabelTag = group ? 'span' : 'label';

    return (
      <div
        ref={ref}
        className={[styles.container, fullWidth ? styles.fullWidth : '', className ?? '']
          .filter(Boolean)
          .join(' ')}
        style={style}
        {...rest}
      >
        {hideLabel ? (
          <VisuallyHidden as={LabelTag} {...labelProps}>
            {labelContent}
          </VisuallyHidden>
        ) : (
          <LabelTag className={labelClassNames} {...labelProps}>
            {labelContent}
          </LabelTag>
        )}
        {children(control, { labelId, helperId, errorId, invalid })}
        <div className={styles.footer}>
          {/* 오류 요소는 항상 DOM 에 있다. 라이브 영역은 "이미 있던 요소의 내용이
              바뀔 때" 읽히므로, 오류가 생길 때 요소째 끼워 넣으면 놓치는 보조 기술이 있다. */}
          <p className={styles.errorMessage} id={errorId} aria-live="polite">
            {hasErrorMessage ? errorMessage : null}
          </p>
          {!hasErrorMessage && hasHelper && (
            <p className={styles.helperText} id={helperId}>
              {helperText}
            </p>
          )}
        </div>
      </div>
    );
  },
);

Field.displayName = 'Field';
