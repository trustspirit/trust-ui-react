import {
  forwardRef,
  useState,
  useId,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { useTouchDevice } from '../../hooks/touch/useTouchDevice';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  /** Available options */
  options: SelectOption[];
  /** Controlled value (string for single, string[] for multi) */
  value?: string | string[];
  /** Default value (uncontrolled) */
  defaultValue?: string | string[];
  /** Change callback */
  onChange?: (value: string | string[]) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Visual variant */
  variant?: 'outlined' | 'filled';
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  /** Enable search/filter */
  searchable?: boolean;
  /** Enable multi-select */
  multiple?: boolean;
  /** Label displayed above the select */
  label?: string;
  /** Whether the field is required (shows red asterisk) */
  required?: boolean;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Whether the field is in error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Stretches to fill container */
  fullWidth?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Renders the dropdown open on mount (uncontrolled). 표면 자체를 캡처하는 스토리용. */
  defaultOpen?: boolean;
  /** Accessible name when there is no visible `label`. */
  'aria-label'?: string;
}

function ChevronIcon() {
  return (
    <svg
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
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      options,
      value: controlledValue,
      defaultValue,
      onChange,
      placeholder = 'Select...',
      variant = 'outlined',
      size = 'md',
      searchable = false,
      multiple = false,
      label,
      required = false,
      disabled = false,
      error = false,
      errorMessage,
      fullWidth = false,
      className,
      style,
      defaultOpen = false,
      'aria-label': ariaLabel,
    },
    ref,
  ) => {
    const baseId = useId();
    const listboxId = `${baseId}-listbox`;
    const labelId = `${baseId}-label`;
    const errorId = `${baseId}-error`;
    const nativeId = `${baseId}-native`;
    const optionId = (index: number) => `${baseId}-opt-${index}`;
    const isTouchDevice = useTouchDevice();
    // Use native <select> on touch devices for simple single selects
    const useNative = isTouchDevice && !multiple && !searchable;
    // Use mobile bottom sheet for searchable selects on touch devices
    const useMobileSheet = isTouchDevice && searchable;

    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [internalValue, setInternalValue] = useState<string | string[]>(
      defaultValue ?? (multiple ? [] : ''),
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const triggerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

    // Detect if Select is inside a <dialog> (showModal creates a top-layer that blocks portals to body)
    const getPortalContainer = useCallback((): HTMLElement | null => {
      if (typeof document === 'undefined') return null; // SSR + defaultOpen
      const dialog = triggerRef.current?.closest('dialog');
      return dialog || document.body;
    }, []);

    const isControlled = controlledValue !== undefined;
    const currentValue = isControlled ? controlledValue : internalValue;

    const isError = error || !!errorMessage;

    // Normalize to array for multi-select comparison
    const selectedValues = useMemo<string[]>(() => {
      if (Array.isArray(currentValue)) return currentValue;
      return currentValue ? [currentValue] : [];
    }, [currentValue]);

    // Filtered options
    const filteredOptions = useMemo(() => {
      if (!searchQuery) return options;
      const query = searchQuery.toLowerCase();
      return options.filter((opt) => opt.label.toLowerCase().includes(query));
    }, [options, searchQuery]);

    // Position the dropdown
    const updateDropdownPosition = useCallback(() => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const container = getPortalContainer();
      if (container && container !== document.body) {
        // Inside a <dialog>: use absolute positioning relative to the dialog
        const containerRect = container.getBoundingClientRect();
        setDropdownStyle({
          position: 'absolute',
          top: rect.bottom - containerRect.top + 4,
          left: rect.left - containerRect.left,
          width: rect.width,
          zIndex: 'var(--tui-z-dropdown)' as unknown as number,
        });
      } else {
        setDropdownStyle({
          position: 'fixed',
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
          zIndex: 'var(--tui-z-dropdown)' as unknown as number,
        });
      }
    }, [getPortalContainer]);

    // Open/close
    const openDropdown = useCallback(() => {
      if (disabled) return;
      updateDropdownPosition();
      setIsOpen(true);
      setSearchQuery('');
      setHighlightedIndex(-1);
    }, [disabled, updateDropdownPosition]);

    const closeDropdown = useCallback(() => {
      setIsOpen(false);
      setSearchQuery('');
      setHighlightedIndex(-1);
    }, []);

    // Position the dropdown once it's open. openDropdown() already computes
    // this before setting isOpen, but defaultOpen skips that path entirely —
    // this effect covers the initial-mount case too.
    useEffect(() => {
      if (isOpen && !useMobileSheet) updateDropdownPosition();
    }, [isOpen, useMobileSheet, updateDropdownPosition]);

    // If the input device changes mid-life (e.g., user connects a mouse to
    // an iPad), the dropdown variant switches between mobile sheet and
    // desktop popover. Close it to avoid stale positioning from the previous
    // variant. Skip the very first run — otherwise this fires on mount and
    // immediately closes a dropdown opened via defaultOpen.
    const isFirstTouchCheck = useRef(true);
    useEffect(() => {
      if (isFirstTouchCheck.current) {
        isFirstTouchCheck.current = false;
        return;
      }
      setIsOpen(false);
    }, [isTouchDevice]);

    const toggleDropdown = useCallback(() => {
      if (isOpen) {
        closeDropdown();
      } else {
        openDropdown();
      }
    }, [isOpen, closeDropdown, openDropdown]);

    // Focus search input when dropdown opens
    useEffect(() => {
      if (isOpen && searchable && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, [isOpen, searchable]);

    // Scroll highlighted option into view
    useEffect(() => {
      if (!isOpen || highlightedIndex < 0) return;
      const options = dropdownRef.current?.querySelectorAll('[role="option"]');
      options?.[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
    }, [isOpen, highlightedIndex]);

    // Click outside to close (mobile sheet handles its own backdrop click)
    useEffect(() => {
      if (!isOpen || useMobileSheet) return;

      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as Node;
        if (
          triggerRef.current &&
          !triggerRef.current.contains(target) &&
          dropdownRef.current &&
          !dropdownRef.current.contains(target)
        ) {
          closeDropdown();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, useMobileSheet, closeDropdown]);

    // Update position on scroll/resize; close on scroll for touch devices (but not for mobile sheet)
    useEffect(() => {
      if (!isOpen) return;
      // Mobile sheet handles its own scrolling — skip scroll/resize listeners
      if (useMobileSheet) return;

      const handleScroll = (e: Event) => {
        // 캡처 단계라 옵션 목록 자신의 스크롤도 여기로 온다. 그건 닫을 이유가 아니다.
        if (dropdownRef.current?.contains(e.target as Node)) return;
        if (isTouchDevice) {
          closeDropdown();
        } else {
          updateDropdownPosition();
        }
      };
      const handleResize = () => updateDropdownPosition();
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }, [isOpen, isTouchDevice, useMobileSheet, closeDropdown, updateDropdownPosition]);

    // Select an option
    const handleSelect = useCallback(
      (optionValue: string) => {
        if (multiple) {
          const newValues = selectedValues.includes(optionValue)
            ? selectedValues.filter((v) => v !== optionValue)
            : [...selectedValues, optionValue];
          if (!isControlled) {
            setInternalValue(newValues);
          }
          onChange?.(newValues);
        } else {
          if (!isControlled) {
            setInternalValue(optionValue);
          }
          onChange?.(optionValue);
          closeDropdown();
          // 검색 input 이 포커스를 가진 채 언마운트되면 포커스가 body 로 떨어진다.
          triggerRef.current?.focus();
        }
      },
      [multiple, selectedValues, isControlled, onChange, closeDropdown],
    );

    // Remove a chip in multi-select
    const handleChipRemove = useCallback(
      (optionValue: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (disabled) return;
        const newValues = selectedValues.filter((v) => v !== optionValue);
        if (!isControlled) {
          setInternalValue(newValues);
        }
        onChange?.(newValues);
      },
      [selectedValues, isControlled, onChange, disabled],
    );

    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement | HTMLInputElement>) => {
      if (disabled) return;
      // 트리거 안의 칩 삭제 버튼에서 올라온 키는 그 버튼의 것이다.
      if (e.target !== e.currentTarget) return;
      // 한글 등 IME 조합 중의 keydown 은 조합기가 소비한다. 탐색으로 처리하면
      // 조합 종료 뒤 같은 키가 한 번 더 와서 두 칸씩 움직인다.
      if (e.nativeEvent.isComposing || e.keyCode === 229) return;
      // When invoked from the search input, Space must reach the input so the
      // user can type spaces in their query. Only Enter / Escape / Arrows
      // are treated as navigation keys there.
      const fromSearchInput = (e.target as HTMLElement | null)?.tagName === 'INPUT';

      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          if (!isOpen) {
            openDropdown();
          } else if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
            const opt = filteredOptions[highlightedIndex];
            if (!opt.disabled) {
              handleSelect(opt.value);
            }
          }
          break;
        case ' ':
          if (fromSearchInput) return; // allow space to be typed
          e.preventDefault();
          if (!isOpen) {
            openDropdown();
          } else if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
            const opt = filteredOptions[highlightedIndex];
            if (!opt.disabled) {
              handleSelect(opt.value);
            }
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!isOpen) {
            openDropdown();
          } else {
            setHighlightedIndex((prev) => {
              let next = prev + 1;
              while (next < filteredOptions.length && filteredOptions[next].disabled) {
                next++;
              }
              return next < filteredOptions.length ? next : prev;
            });
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (isOpen) {
            setHighlightedIndex((prev) => {
              let next = prev - 1;
              while (next >= 0 && filteredOptions[next].disabled) {
                next--;
              }
              return next >= 0 ? next : prev;
            });
          }
          break;
        case 'Escape':
          // 닫혀 있을 때는 가로채지 않는다. 바깥 Dialog 가 Escape 로 닫혀야 한다.
          if (!isOpen) break;
          e.preventDefault();
          closeDropdown();
          triggerRef.current?.focus();
          break;
        case 'Tab':
          // 검색 input 에서 Tab 을 누르면 트리거 기준으로 다음 요소로 가야 한다.
          if (fromSearchInput) triggerRef.current?.focus();
          closeDropdown();
          break;
      }
    };

    const activeDescendant =
      isOpen && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length
        ? optionId(highlightedIndex)
        : undefined;

    // Get display label for selected value
    const getLabel = (val: string) =>
      options.find((opt) => opt.value === val)?.label ?? val;

    const singleValue = Array.isArray(currentValue) ? currentValue[0] : currentValue;

    // Render trigger content
    const renderTriggerContent = () => {
      if (multiple) {
        if (selectedValues.length === 0) {
          return (
            <span className={`${styles.triggerValue} ${styles.triggerPlaceholder}`}>
              {placeholder}
            </span>
          );
        }
        return (
          <span className={styles.triggerChips}>
            {selectedValues.map((val) => (
              <span key={val} className={styles.chip}>
                {getLabel(val)}
                <button
                  type="button"
                  className={styles.chipRemove}
                  onClick={(e) => handleChipRemove(val, e)}
                  disabled={disabled}
                  aria-label={`Remove ${getLabel(val)}`}
                >
                  <CloseIcon />
                </button>
              </span>
            ))}
          </span>
        );
      }

      if (!singleValue) {
        return (
          <span className={`${styles.triggerValue} ${styles.triggerPlaceholder}`}>
            {placeholder}
          </span>
        );
      }
      return <span className={styles.triggerValue}>{getLabel(singleValue)}</span>;
    };

    const containerClassNames = [
      styles.container,
      styles[variant],
      styles[size],
      fullWidth ? styles.fullWidth : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    const triggerClassNames = [
      styles.trigger,
      isOpen ? styles.triggerOpen : '',
      isError ? styles.triggerError : '',
      disabled ? styles.triggerDisabled : '',
    ]
      .filter(Boolean)
      .join(' ');

    const handleNativeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newValue = e.target.value;
      if (!isControlled) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    };

    // Render the mobile bottom sheet for searchable selects on touch devices
    const renderMobileSheet = () => {
      if (!useMobileSheet || !isOpen) return null;
      const container = getPortalContainer();
      if (!container) return null;

      return createPortal(
        <div
          className={styles.mobileOverlay}
          onClick={(e) => {
            // Close when tapping the overlay backdrop
            if (e.target === e.currentTarget) closeDropdown();
          }}
        >
          <div ref={dropdownRef} className={styles.mobileSheet}>
            <div className={styles.mobileSheetHandle} />
            <div className={styles.mobileSheetSearch}>
              <input
                ref={searchInputRef}
                className={styles.mobileSheetSearchInput}
                type="text"
                role="searchbox"
                aria-label="Search options"
                aria-controls={listboxId}
                aria-activedescendant={activeDescendant}
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </div>
            <div
              className={styles.mobileSheetOptions}
              role="listbox"
              id={listboxId}
              aria-labelledby={label ? labelId : undefined}
              aria-multiselectable={multiple || undefined}
            >
              {filteredOptions.length === 0 ? (
                <div className={styles.mobileNoResults}>No options found</div>
              ) : (
                filteredOptions.map((option, index) => {
                  const isSelected = selectedValues.includes(option.value);
                  const optClassNames = [
                    styles.mobileOption,
                    isSelected ? styles.mobileOptionSelected : '',
                    index === highlightedIndex ? styles.optionHighlighted : '',
                    option.disabled ? styles.mobileOptionDisabled : '',
                  ]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <div
                      key={option.value}
                      id={optionId(index)}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={option.disabled || undefined}
                      className={optClassNames}
                      onClick={() => {
                        if (!option.disabled) handleSelect(option.value);
                      }}
                    >
                      {multiple && (
                        <span
                          className={`${styles.checkmark} ${
                            !isSelected ? styles.checkmarkHidden : ''
                          }`}
                        >
                          <CheckIcon />
                        </span>
                      )}
                      {option.label}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>,
        container,
      );
    };

    // Render the desktop dropdown (non-touch or non-searchable custom dropdown)
    const renderDesktopDropdown = () => {
      if (useNative || useMobileSheet || !isOpen) return null;
      const container = getPortalContainer();
      if (!container) return null;

      return createPortal(
        <div ref={dropdownRef} className={styles.dropdown} style={dropdownStyle}>
          {searchable && (
            <div className={styles.searchWrapper}>
              <input
                ref={searchInputRef}
                className={styles.searchInput}
                type="text"
                role="searchbox"
                aria-label="Search options"
                aria-controls={listboxId}
                aria-activedescendant={activeDescendant}
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(-1);
                }}
                onKeyDown={handleKeyDown}
              />
            </div>
          )}
          {/* 검색 input 은 listbox 의 자식이 될 수 없다. 역할은 옵션 목록에만 준다. */}
          <div
            className={styles.optionsList}
            role="listbox"
            id={listboxId}
            aria-labelledby={label ? labelId : undefined}
            aria-multiselectable={multiple || undefined}
          >
            {filteredOptions.length === 0 ? (
              <div className={styles.noResults}>No options found</div>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = selectedValues.includes(option.value);
                const optionClassNames = [
                  styles.option,
                  isSelected ? styles.optionSelected : '',
                  index === highlightedIndex ? styles.optionHighlighted : '',
                  option.disabled ? styles.optionDisabled : '',
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <div
                    key={option.value}
                    id={optionId(index)}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={option.disabled || undefined}
                    className={optionClassNames}
                    onClick={() => {
                      if (!option.disabled) handleSelect(option.value);
                    }}
                    onMouseEnter={() => {
                      if (!option.disabled) setHighlightedIndex(index);
                    }}
                  >
                    {multiple && (
                      <span
                        className={`${styles.checkmark} ${
                          !isSelected ? styles.checkmarkHidden : ''
                        }`}
                      >
                        <CheckIcon />
                      </span>
                    )}
                    {option.label}
                  </div>
                );
              })
            )}
          </div>
        </div>,
        container,
      );
    };

    const labelClassNames = [
      styles.label,
      isError ? styles.labelError : '',
      disabled ? styles.labelDisabled : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={containerClassNames} style={style}>
        {label && (
          <label
            id={labelId}
            className={labelClassNames}
            // 네이티브 select 는 htmlFor 로 연결한다. 커스텀 콤보박스는 label 이
            // 가리킬 수 있는 요소가 아니므로 aria-labelledby 로 잇고, 클릭 시
            // 포커스만 옮겨 준다.
            htmlFor={useNative ? nativeId : undefined}
            onClick={useNative ? undefined : () => triggerRef.current?.focus()}
          >
            {label}
            {required && <span className={styles.requiredAsterisk}> *</span>}
          </label>
        )}
        <div
          ref={triggerRef}
          role={useNative ? undefined : 'combobox'}
          aria-expanded={useNative ? undefined : isOpen}
          aria-haspopup={useNative ? undefined : 'listbox'}
          aria-controls={useNative ? undefined : (isOpen ? listboxId : undefined)}
          aria-labelledby={useNative || !label ? undefined : labelId}
          aria-label={useNative || label ? undefined : ariaLabel}
          aria-describedby={useNative || !errorMessage ? undefined : errorId}
          aria-invalid={useNative ? undefined : isError || undefined}
          aria-required={useNative ? undefined : required || undefined}
          aria-activedescendant={useNative || searchable ? undefined : activeDescendant}
          aria-disabled={disabled || undefined}
          tabIndex={useNative ? -1 : (disabled ? -1 : 0)}
          className={triggerClassNames}
          onClick={useNative ? undefined : toggleDropdown}
          onKeyDown={useNative ? undefined : handleKeyDown}
        >
          {renderTriggerContent()}
          <span className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ''}`}>
            <ChevronIcon />
          </span>
          {useNative && (
            <select
              className={styles.nativeSelect}
              value={singleValue || ''}
              onChange={handleNativeChange}
              disabled={disabled}
              id={nativeId}
              required={required}
              aria-label={label ? undefined : (ariaLabel ?? placeholder)}
              aria-describedby={errorMessage ? errorId : undefined}
              aria-invalid={isError || undefined}
            >
              {!singleValue && <option value="" disabled>{placeholder}</option>}
              {options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {errorMessage && (
          <p className={styles.errorMessage} id={errorId} role="alert">
            {errorMessage}
          </p>
        )}

        {renderMobileSheet()}
        {renderDesktopDropdown()}
      </div>
    );
  },
);

Select.displayName = 'Select';
