import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Field, fieldSurfaceClassName } from '../Field';
import { VisuallyHidden } from '../VisuallyHidden';
import { useAnchoredLayer } from '../../hooks/useAnchoredLayer';
import { useTouchDevice } from '../../hooks/touch/useTouchDevice';
import { idSegment } from '../../utils/idSegment';
import styles from './Combobox.module.css';

export interface ComboboxOption {
  /** Value reported through `onChange` */
  value: string;
  /** Text shown in the list and in the input once selected */
  label: string;
  /** Whether the option can be selected */
  disabled?: boolean;
  /** Secondary line shown under the label */
  description?: string;
}

export interface ComboboxProps {
  /** Options to choose from. With `onSearch`, pass the latest results here. */
  options?: ComboboxOption[];
  /** Called with the typed text (at least `minQueryLength` long). Load options and pass them back through `options`. */
  onSearch?: (query: string) => void;
  /** Shows the loading state in the popup */
  loading?: boolean;
  /** Controlled selected value. `null` means nothing selected. */
  value?: string | null;
  /** Initial selected value (uncontrolled) */
  defaultValue?: string | null;
  /** Called when the selection changes. Both arguments are `null` when cleared. */
  onChange?: (value: string | null, option: ComboboxOption | null) => void;
  /** Controlled input text */
  inputValue?: string;
  /** Called whenever the input text changes (typing, selection, clearing, revert on blur) */
  onInputValueChange?: (inputValue: string) => void;
  /**
   * Decides whether an option matches the typed text. Defaults to a case-insensitive label match.
   * Pass `null` (or `false`) to show `options` as given — use this when `onSearch` filters on the server.
   */
  filter?: ((option: ComboboxOption, query: string) => boolean) | null | false;
  /** Minimum number of typed characters before the popup opens and `onSearch` is called */
  minQueryLength?: number;
  /** Text shown when no option matches */
  emptyText?: string;
  /** Text shown while `loading` */
  loadingText?: string;
  /** Text announced to screen readers when the result list changes */
  resultCountText?: (count: number) => string;
  /** Shows a button that clears the selection */
  clearable?: boolean;
  /** Accessible name of the clear button */
  clearLabel?: string;
  /** Label displayed above the input */
  label: ReactNode;
  /** Hides the label visually. It remains the accessible name. */
  hideLabel?: boolean;
  /** Helper text displayed below the input */
  helperText?: ReactNode;
  /** Whether the field is in error state */
  error?: boolean;
  /** Error message displayed below the input */
  errorMessage?: ReactNode;
  /** Whether the field is required (shows an asterisk) */
  required?: boolean;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Size of the field */
  size?: 'sm' | 'md' | 'lg';
  /** Visual variant */
  variant?: 'outlined' | 'filled';
  /** Stretches the field to fill its container */
  fullWidth?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Id for the input */
  id?: string;
  /** Form field name. The selected `value` (not the text) is submitted. */
  name?: string;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

const defaultFilter = (option: ComboboxOption, query: string) =>
  option.label.toLowerCase().includes(query.toLowerCase());

const defaultResultCountText = (count: number) => `${count} ${count === 1 ? 'result' : 'results'}`;

// 터치로 입력 칸에 들어가면 가상 키보드가 올라오며 브라우저가 페이지를 스크롤한다.
// 그 스크롤은 사용자가 페이지를 넘긴 것이 아니므로 닫는 이유로 치지 않는다.
const FOCUS_SCROLL_GRACE_MS = 500;

function ClearIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export const Combobox = forwardRef<HTMLInputElement, ComboboxProps>(
  (
    {
      options = [],
      onSearch,
      loading = false,
      value: controlledValue,
      defaultValue = null,
      onChange,
      inputValue: controlledText,
      onInputValueChange,
      filter,
      minQueryLength = 0,
      emptyText = 'No results',
      loadingText = 'Loading',
      resultCountText = defaultResultCountText,
      clearable = true,
      clearLabel = 'Clear',
      label,
      hideLabel,
      helperText,
      error = false,
      errorMessage,
      required = false,
      disabled = false,
      size = 'md',
      variant = 'outlined',
      fullWidth = false,
      placeholder,
      id,
      name,
      className,
      style,
    },
    ref,
  ) => {
    const baseId = useId();
    const listboxId = `${baseId}-listbox`;
    const optionId = (optionValue: string) => `${baseId}-opt-${idSegment(optionValue)}`;
    const isTouch = useTouchDevice();

    // ── 선택 값 ──
    const [internalValue, setInternalValue] = useState<string | null>(defaultValue);
    const isControlled = controlledValue !== undefined;
    const current = isControlled ? controlledValue : internalValue;

    // 비동기 목록에서는 선택한 옵션이 다음 검색 결과에 없을 수 있다. 마지막으로 본
    // 옵션을 기억해 두어야 label 을 계속 보여 줄 수 있다.
    const knownSelection = useRef<ComboboxOption | null>(null);
    const selectedOption = useMemo(() => {
      if (current === null) return null;
      const found = options.find((option) => option.value === current);
      if (found) return found;
      return knownSelection.current?.value === current ? knownSelection.current : null;
    }, [options, current]);
    if (selectedOption) knownSelection.current = selectedOption;
    // 옵션을 한 번도 본 적 없는 값은 label 을 알 수 없다. 값 자체를 보여 준다.
    const selectedLabel = selectedOption?.label ?? current ?? '';

    // ── 입력 글자 ──
    const [internalText, setInternalText] = useState(selectedLabel);
    const text = controlledText !== undefined ? controlledText : internalText;
    const textRef = useRef(text);
    textRef.current = text;

    const setText = (next: string) => {
      if (controlledText === undefined) setInternalText(next);
      if (next !== textRef.current) onInputValueChange?.(next);
    };

    // 사용자가 글자를 고친 뒤인지. 고치기 전에는 글자가 선택된 label 그대로이므로
    // 그것으로 거르면 방금 연 목록에 선택된 옵션 하나만 남는다.
    const [dirty, setDirty] = useState(false);
    const dirtyRef = useRef(dirty);
    dirtyRef.current = dirty;

    const [open, setOpen] = useState(false);
    // 인덱스가 아니라 value 로 기억한다 — 비동기로 목록이 바뀌어도 엉뚱한 옵션을 가리키지 않는다.
    const [activeValue, setActiveValue] = useState<string | null>(null);

    const inputRef = useRef<HTMLInputElement | null>(null);
    const anchorRef = useRef<HTMLDivElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const focusedAt = useRef(0);

    const setInputRef = useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );

    // 선택이 밖에서 바뀌면(제어 모드, 또는 label 이 늦게 도착) 글자도 따라간다.
    // 입력 중인 글자는 덮지 않는다. 마운트 때는 초기값이 이미 맞으므로 건너뛴다.
    const mounted = useRef(false);
    useEffect(() => {
      if (!mounted.current) {
        mounted.current = true;
        return;
      }
      if (!dirtyRef.current) setText(selectedLabel);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedLabel]);

    const filterFn = filter === undefined ? defaultFilter : filter;
    const visible = useMemo(
      () => (dirty && filterFn && text ? options.filter((option) => filterFn(option, text)) : options),
      [dirty, filterFn, text, options],
    );

    const isOpen = open && !disabled && text.length >= minQueryLength;
    const activeOption = isOpen ? visible.find((option) => option.value === activeValue) : undefined;

    const layer = useAnchoredLayer({
      open: isOpen,
      anchorRef,
      layerRef: popupRef,
      matchAnchorWidth: true,
    });

    const commit = (next: string | null, option: ComboboxOption | null) => {
      if (!isControlled) setInternalValue(next);
      if (next !== current) onChange?.(next, option);
    };

    const close = () => {
      setOpen(false);
      setActiveValue(null);
    };

    const select = (option: ComboboxOption) => {
      if (option.disabled) return;
      knownSelection.current = option;
      commit(option.value, option);
      setText(option.label);
      setDirty(false);
      close();
    };

    const clear = () => {
      commit(null, null);
      setText('');
      setDirty(false);
      close();
      // 비동기 호출자가 빈 질의에 맞는 목록(초기 추천 등)으로 되돌릴 수 있게 알린다.
      if (textRef.current !== '' && minQueryLength <= 0) onSearch?.('');
    };

    /** from 에서 direction 쪽으로 가장 가까운 선택 가능한 옵션. 없으면 undefined. */
    const findEnabled = (from: number, direction: 1 | -1) => {
      for (let i = from; i >= 0 && i < visible.length; i += direction) {
        if (!visible[i].disabled) return visible[i];
      }
      return undefined;
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      // 조합 중인 한글도 여기로 온다(keydown 은 229 로만 온다). 거르기는 이 값으로 한다.
      const next = e.target.value;
      setText(next);
      setDirty(true);
      setActiveValue(null);
      setOpen(true);
      if (next.length >= minQueryLength) onSearch?.(next);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      // 한글 등 IME 조합 중의 keydown 은 조합기가 소비한다. 여기서 처리하면 조합을
      // 확정하는 Enter 가 옵션을 고르고, 화살표는 조합이 끝난 뒤 한 번 더 와서 두 칸 움직인다.
      if (e.nativeEvent.isComposing || e.keyCode === 229) return;
      if (disabled) return;

      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowUp': {
          e.preventDefault();
          const direction = e.key === 'ArrowDown' ? 1 : -1;
          if (!isOpen) {
            setOpen(true);
            const selected = visible.find((option) => option.value === current && !option.disabled);
            const edge = direction === 1 ? findEnabled(0, 1) : findEnabled(visible.length - 1, -1);
            setActiveValue((direction === 1 ? (selected ?? edge) : edge)?.value ?? null);
            break;
          }
          const index = visible.findIndex((option) => option.value === activeValue);
          const next =
            index === -1
              ? direction === 1
                ? findEnabled(0, 1)
                : findEnabled(visible.length - 1, -1)
              : findEnabled(index + direction, direction);
          // 끝에서는 멈춘다(Select 와 같다).
          if (next) setActiveValue(next.value);
          break;
        }
        // 옵션 위에 있을 때만 목록의 양 끝으로 간다. 아니면 글자 칸의 캐럿 이동으로 남긴다.
        case 'Home':
        case 'End': {
          if (!activeOption) break;
          e.preventDefault();
          const edge = e.key === 'Home' ? findEnabled(0, 1) : findEnabled(visible.length - 1, -1);
          if (edge) setActiveValue(edge.value);
          break;
        }
        case 'Enter':
          // 닫혀 있으면 가로채지 않는다 — 폼 제출로 남긴다.
          if (!isOpen) break;
          e.preventDefault();
          if (activeOption) select(activeOption);
          else close();
          break;
        case 'Escape':
          if (isOpen) {
            e.preventDefault();
            close();
          } else if (text !== '' || current !== null) {
            e.preventDefault();
            clear();
          }
          // 비어 있고 닫혀 있으면 가로채지 않는다. 바깥 Dialog 가 Escape 로 닫혀야 한다.
          break;
        case 'Tab':
          // 아무것도 고르지 않는다. 글자 되돌리기는 blur 가 한다.
          close();
          break;
      }
    };

    const handleBlur = () => {
      close();
      setDirty(false);
      if (text === '') {
        // 글자를 모두 지우고 나간 것은 "선택 안 함" 이다.
        if (current !== null) commit(null, null);
      } else if (text !== selectedLabel) {
        setText(selectedLabel);
      }
    };

    // 활성 옵션이 목록의 보이는 영역 밖이면 끌어온다.
    const activeId = activeOption ? optionId(activeOption.value) : undefined;
    useEffect(() => {
      if (!activeId) return;
      document.getElementById(activeId)?.scrollIntoView?.({ block: 'nearest' });
    }, [activeId]);

    // 터치 기기에서는 페이지가 스크롤되면 닫는다(손가락 아래에서 목록이 따라 움직이는 것보다 낫다).
    useEffect(() => {
      if (!isOpen || !isTouch) return;
      const handleScroll = (e: Event) => {
        // 캡처 단계라 목록 자신의 스크롤도 여기로 온다. 그건 닫을 이유가 아니다.
        if (popupRef.current?.contains(e.target as Node)) return;
        if (Date.now() - focusedAt.current < FOCUS_SCROLL_GRACE_MS) return;
        setOpen(false);
        setActiveValue(null);
      };
      window.addEventListener('scroll', handleScroll, true);
      return () => window.removeEventListener('scroll', handleScroll, true);
    }, [isOpen, isTouch]);

    const showClear = clearable && !disabled && (current !== null || text !== '');

    const statusText = !isOpen
      ? ''
      : loading
        ? loadingText
        : visible.length === 0
          ? emptyText
          : resultCountText(visible.length);

    return (
      <Field
        label={label}
        hideLabel={hideLabel}
        helperText={helperText}
        error={error}
        errorMessage={errorMessage}
        required={required}
        disabled={disabled}
        fullWidth={fullWidth}
        id={id}
        className={className}
        style={style}
      >
        {(control, meta) => (
          <>
            <div
              ref={anchorRef}
              className={[
                fieldSurfaceClassName({ variant, error: meta.invalid, disabled }),
                styles[size],
              ].join(' ')}
            >
              <input
                {...control}
                ref={setInputRef}
                className={styles.input}
                type="text"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={isOpen}
                aria-controls={isOpen ? listboxId : undefined}
                aria-activedescendant={activeId}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder={placeholder}
                value={text}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  focusedAt.current = Date.now();
                }}
                onBlur={handleBlur}
                onClick={() => setOpen(true)}
              />
              {showClear && (
                <button
                  type="button"
                  // 키보드로는 Escape 가 같은 일을 한다. 탭 정지점을 늘리지 않는다.
                  tabIndex={-1}
                  className={styles.clear}
                  aria-label={clearLabel}
                  // 입력 칸의 포커스를 빼앗지 않는다(빼앗으면 blur 가 글자를 되돌린다).
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    clear();
                    inputRef.current?.focus();
                  }}
                >
                  <ClearIcon />
                </button>
              )}
            </div>
            {name && <input type="hidden" name={name} value={current ?? ''} disabled={disabled} />}
            {/* 결과 수·없음·불러오는 중을 알린다. 팝업 안의 같은 문구는 시각용이다. */}
            <VisuallyHidden role="status" aria-live="polite">
              {statusText}
            </VisuallyHidden>
            {isOpen &&
              layer.container &&
              createPortal(
                <div
                  ref={popupRef}
                  className={styles.popup}
                  style={layer.style}
                  // DOM 포커스는 항상 입력 칸에 있다. 팝업을 눌러도 옮기지 않는다.
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <div
                    className={styles.list}
                    role="listbox"
                    id={listboxId}
                    aria-labelledby={meta.labelId}
                    aria-busy={loading || undefined}
                  >
                    {visible.map((option) => {
                      const selected = option.value === current;
                      return (
                        <div
                          key={option.value}
                          id={optionId(option.value)}
                          role="option"
                          aria-selected={selected}
                          aria-disabled={option.disabled || undefined}
                          className={[
                            styles.option,
                            selected ? styles.optionSelected : '',
                            option.value === activeOption?.value ? styles.optionActive : '',
                            option.disabled ? styles.optionDisabled : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          onClick={() => select(option)}
                          onMouseEnter={() => {
                            if (!option.disabled) setActiveValue(option.value);
                          }}
                        >
                          <span className={styles.optionLabel}>{option.label}</span>
                          {option.description && (
                            <span className={styles.optionDescription}>{option.description}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {(loading || visible.length === 0) && (
                    <div className={styles.status} aria-hidden="true">
                      {loading ? loadingText : emptyText}
                    </div>
                  )}
                </div>,
                layer.container,
              )}
          </>
        )}
      </Field>
    );
  },
);

Combobox.displayName = 'Combobox';
