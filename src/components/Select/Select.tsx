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

// Detect touch device (coarse pointer = finger/stylus)
function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(pointer: coarse)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isTouch;
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
      disabled = false,
      error = false,
      errorMessage,
      fullWidth = false,
      className,
      style,
    },
    ref,
  ) => {
    const listboxId = useId();
    const isTouchDevice = useIsTouchDevice();
    // Use native <select> on touch devices for simple single selects
    const useNative = isTouchDevice && !multiple && !searchable;
    // Use mobile bottom sheet for searchable selects on touch devices
    const useMobileSheet = isTouchDevice && searchable;

    const [isOpen, setIsOpen] = useState(false);
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
    const getPortalContainer = useCallback(() => {
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
      if (container !== document.body) {
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

      const handleScroll = () => {
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
        }
      },
      [multiple, selectedValues, isControlled, onChange, closeDropdown],
    );

    // Remove a chip in multi-select
    const handleChipRemove = useCallback(
      (optionValue: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newValues = selectedValues.filter((v) => v !== optionValue);
        if (!isControlled) {
          setInternalValue(newValues);
        }
        onChange?.(newValues);
      },
      [selectedValues, isControlled, onChange],
    );

    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;

      switch (e.key) {
        case 'Enter':
        case ' ':
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
          e.preventDefault();
          closeDropdown();
          triggerRef.current?.focus();
          break;
        case 'Tab':
          closeDropdown();
          break;
      }
    };

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

      return createPortal(
        <div
          className={styles.mobileOverlay}
          onClick={(e) => {
            // Close when tapping the overlay backdrop
            if (e.target === e.currentTarget) closeDropdown();
          }}
        >
          <div
            ref={dropdownRef}
            className={styles.mobileSheet}
            role="listbox"
            id={listboxId}
            aria-multiselectable={multiple || undefined}
          >
            <div className={styles.mobileSheetHandle} />
            <div className={styles.mobileSheetSearch}>
              <input
                ref={searchInputRef}
                className={styles.mobileSheetSearchInput}
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(-1);
                }}
                autoFocus
              />
            </div>
            <div className={styles.mobileSheetOptions}>
              {filteredOptions.length === 0 ? (
                <div className={styles.mobileNoResults}>No options found</div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = selectedValues.includes(option.value);
                  const optClassNames = [
                    styles.mobileOption,
                    isSelected ? styles.mobileOptionSelected : '',
                    option.disabled ? styles.mobileOptionDisabled : '',
                  ]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <div
                      key={option.value}
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
        document.body,
      );
    };

    // Render the desktop dropdown (non-touch or non-searchable custom dropdown)
    const renderDesktopDropdown = () => {
      if (useNative || useMobileSheet || !isOpen) return null;

      return createPortal(
        <div
          ref={dropdownRef}
          className={styles.dropdown}
          style={dropdownStyle}
          role="listbox"
          id={listboxId}
          aria-multiselectable={multiple || undefined}
        >
          {searchable && (
            <div className={styles.searchWrapper}>
              <input
                ref={searchInputRef}
                className={styles.searchInput}
                type="text"
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
          <div className={styles.optionsList}>
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
        getPortalContainer(),
      );
    };

    return (
      <div ref={ref} className={containerClassNames} style={style}>
        <div
          ref={triggerRef}
          role={useNative ? undefined : 'combobox'}
          aria-expanded={useNative ? undefined : isOpen}
          aria-haspopup={useNative ? undefined : 'listbox'}
          aria-controls={useNative ? undefined : (isOpen ? listboxId : undefined)}
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
              aria-label={placeholder}
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
          <p className={styles.errorMessage} role="alert">
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
