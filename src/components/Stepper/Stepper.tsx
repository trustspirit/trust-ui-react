import {
  Children,
  Fragment,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  type CSSProperties,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';
import styles from './Stepper.module.css';

/** Fragment 로 묶인 자식까지 한 겹으로 펼친다. */
function flattenChildren(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap((child) =>
    isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment
      ? flattenChildren(child.props.children)
      : [child],
  );
}

/* ── Context ── */

type StepState = 'complete' | 'current' | 'upcoming';

interface StepContextValue {
  index: number;
  state: StepState;
  isLast: boolean;
  onStepClick?: (index: number) => void;
  completedLabel: string;
  currentLabel: string;
  errorLabel: string;
  optionalLabel: string;
}

const StepContext = createContext<StepContextValue | null>(null);

/* ── Stepper (root) ── */

export interface StepperProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Zero-based index of the active step. Steps before it are complete; pass the step count to mark all complete. */
  activeStep: number;
  /** Layout direction. Default 'horizontal'. */
  orientation?: 'horizontal' | 'vertical';
  /** Called with the step index when a step is activated. Steps are rendered as buttons only when this is provided. */
  onStepClick?: (index: number) => void;
  /** Accessible name of the stepper. Default 'Progress'. */
  label?: string;
  /** Screen-reader text for completed steps. Default 'Completed'. */
  completedLabel?: string;
  /** Screen-reader text for the active step. Default 'Current'. */
  currentLabel?: string;
  /** Screen-reader text for steps with `error`. Default 'Error'. */
  errorLabel?: string;
  /** Text shown next to steps marked `optional`. Default 'Optional'. */
  optionalLabel?: string;
  /** Builds the compact summary shown when a horizontal stepper is too narrow. Default: `Step {current} of {total}`. */
  summaryLabel?: (current: number, total: number) => string;
  /** `Stepper.Step` elements. */
  children: ReactNode;
}

const defaultSummaryLabel = (current: number, total: number) => `Step ${current} of ${total}`;

const StepperRoot = forwardRef<HTMLDivElement, StepperProps>(function Stepper(
  {
    activeStep,
    orientation = 'horizontal',
    onStepClick,
    label = 'Progress',
    completedLabel = 'Completed',
    currentLabel = 'Current',
    errorLabel = 'Error',
    optionalLabel = 'Optional',
    summaryLabel = defaultSummaryLabel,
    children,
    className,
    style,
    ...rest
  },
  ref,
) {
  const steps = flattenChildren(children).filter((child): child is ReactElement<StepperStepProps> =>
    isValidElement(child),
  );
  const total = steps.length;
  const horizontal = orientation === 'horizontal';

  // 요약에 보여 줄 단계. 모두 끝났으면(activeStep >= total) 마지막 단계를 가리킨다.
  const summaryIndex = Math.min(Math.max(activeStep, 0), Math.max(total - 1, 0));

  const classNames = [styles.stepper, horizontal ? styles.horizontal : styles.vertical, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      className={classNames}
      style={{ ...style, '--tui-stepper-count': Math.max(total, 1) } as CSSProperties}
      {...rest}
    >
      {/* probe/inner: 컨테이너 쿼리가 "단계 하나에 돌아가는 폭"을 재게 하는 장치. CSS 주석 참고. */}
      <div className={styles.probe}>
        <div className={styles.inner}>
          {horizontal && total > 0 && (
            // 좁을 때만 보이는 시각용 요약. 같은 정보가 아래 목록에 있으므로 보조 기술에는 숨긴다.
            <div className={styles.summary} aria-hidden="true">
              <span className={styles.summaryCount}>{summaryLabel(summaryIndex + 1, total)}</span>
              <span className={styles.summaryDash}>—</span>
              <span className={styles.summaryStep}>{steps[summaryIndex].props.label}</span>
            </div>
          )}
          <ol className={styles.list}>
            {steps.map((step, index) => (
              <StepContext.Provider
                key={step.key ?? index}
                value={{
                  index,
                  state: index < activeStep ? 'complete' : index === activeStep ? 'current' : 'upcoming',
                  isLast: index === total - 1,
                  onStepClick,
                  completedLabel,
                  currentLabel,
                  errorLabel,
                  optionalLabel,
                }}
              >
                {step}
              </StepContext.Provider>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
});

StepperRoot.displayName = 'Stepper';

/* ── Stepper.Step ── */

export interface StepperStepProps {
  /** Step name. */
  label: ReactNode;
  /** Secondary text under the label. */
  description?: ReactNode;
  /** Marks the step as having a problem (danger indicator and screen-reader text). */
  error?: boolean;
  /** Whether the step is disabled. A disabled step cannot be activated. */
  disabled?: boolean;
  /** Marks the step as optional (shows the stepper's `optionalLabel`). */
  optional?: boolean;
  /** Additional CSS class name. */
  className?: string;
  /** Additional inline styles. */
  style?: CSSProperties;
}

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 6.5l2.5 2.5 4.5-5.5" />
  </svg>
);

const StepperStep = forwardRef<HTMLLIElement, StepperStepProps>(function StepperStep(
  { label, description, error = false, disabled = false, optional = false, className, style },
  ref,
) {
  const context = useContext(StepContext);
  if (!context) {
    throw new Error('Stepper.Step must be used within a Stepper');
  }
  const { index, state, isLast, onStepClick, completedLabel, currentLabel, errorLabel, optionalLabel } = context;

  // 상태를 색·아이콘만으로 전하지 않는다. 같은 내용을 글자로도 둔다(시각적으로만 숨김).
  const stateText = [
    state === 'complete' ? completedLabel : state === 'current' ? currentLabel : null,
    error ? errorLabel : null,
  ]
    .filter(Boolean)
    .join(', ');

  const clickable = onStepClick !== undefined;
  const ariaCurrent = state === 'current' ? ('step' as const) : undefined;

  const classNames = [styles.step, styles[state], error && styles.error, disabled && styles.disabled, className]
    .filter(Boolean)
    .join(' ');

  const body = (
    <>
      <span className={styles.indicator} aria-hidden="true">
        {error ? '!' : state === 'complete' ? <CheckIcon /> : index + 1}
      </span>
      <span className={styles.text}>
        <span className={styles.label}>
          {stateText && <span className={styles.visuallyHidden}>{stateText}: </span>}
          {label}
        </span>
        {optional && <span className={styles.optional}>{optionalLabel}</span>}
        {description && <span className={styles.description}>{description}</span>}
      </span>
    </>
  );

  return (
    // aria-current 는 포커스를 받는 요소에 둔다: 버튼이 있으면 버튼, 없으면 항목 자신.
    <li ref={ref} className={classNames} style={style} aria-current={clickable ? undefined : ariaCurrent}>
      {clickable ? (
        <button
          type="button"
          className={`${styles.stepInner} ${styles.stepButton}`}
          disabled={disabled}
          aria-current={ariaCurrent}
          onClick={() => onStepClick(index)}
        >
          {body}
        </button>
      ) : (
        <div className={styles.stepInner}>{body}</div>
      )}
      {!isLast && <span className={styles.connector} aria-hidden="true" />}
    </li>
  );
});

StepperStep.displayName = 'Stepper.Step';

/* ── Export as compound component ── */

export const Stepper = Object.assign(StepperRoot, {
  Step: StepperStep,
});
