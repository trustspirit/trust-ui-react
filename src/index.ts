// Styles
import './styles/palette.css';
import './styles/themes/light.css';
import './styles/themes/dark.css';
import './styles/themes/density.css';
import './styles/themes/spacing.css';
import './styles/tokens.css';
import './styles/reset.css';

// Providers
export { ThemeProvider } from './providers/ThemeProvider';
export type { Theme, Density, Market, ThemeContextValue } from './providers/ThemeProvider';
export { LocaleProvider, useMessages } from './providers/LocaleProvider';
export type { LocaleProviderProps } from './providers/LocaleProvider';
export type { Messages, MessagesOverride, Locale } from './locales/messages';
export { ToastProvider } from './providers/ToastProvider';
export type { ToastPosition, ToastData, ToastContextValue } from './providers/ToastProvider';

// Hooks
export { useTheme } from './hooks/useTheme';
export { useToast } from './hooks/useToast';

// Touch hooks
export {
  useTouchDevice,
  useHaptic,
  HapticProvider,
  useVisualViewport,
  useSwipe,
  useLongPress,
  useDrag,
  useSnapPoints,
} from './hooks/touch';
export type {
  HapticType,
  HapticContextValue,
  VisualViewportState,
  UseSwipeOptions,
  UseLongPressOptions,
  UseDragOptions,
  DragOffset,
  DragVelocity,
  UseSnapPointsOptions,
  SnapResult,
} from './hooks/touch';

// Components
export { Button } from './components/Button';
export type { ButtonProps } from './components/Button/Button';
export { Badge } from './components/Badge';
export type { BadgeProps } from './components/Badge/Badge';
export { Avatar } from './components/Avatar';
export type { AvatarProps } from './components/Avatar/Avatar';
export { Chip } from './components/Chip';
export type { ChipProps } from './components/Chip/Chip';
export { Progress } from './components/Progress';
export type { ProgressProps } from './components/Progress/Progress';
export { TextField } from './components/TextField';
export type { TextFieldProps } from './components/TextField/TextField';
export { Checkbox } from './components/Checkbox';
export type { CheckboxProps } from './components/Checkbox/Checkbox';
export { Radio, RadioGroup } from './components/Radio';
export type { RadioProps } from './components/Radio/Radio';
export type { RadioGroupProps } from './components/Radio/RadioGroup';
export { Switch } from './components/Switch';
export type { SwitchProps } from './components/Switch/Switch';
export { Select } from './components/Select';
export type { SelectProps } from './components/Select/Select';
export { Slider } from './components/Slider';
export type { SliderProps } from './components/Slider/Slider';
export { Toast } from './components/Toast';
export type { ToastProps, ToastVariant } from './components/Toast/Toast';
export { Tooltip } from './components/Tooltip';
export type { TooltipProps } from './components/Tooltip/Tooltip';
export { Dialog } from './components/Dialog';
export type { DialogProps } from './components/Dialog/Dialog';
export { Menu } from './components/Menu';
export type { MenuProps, MenuItemProps } from './components/Menu/Menu';
export { Table } from './components/Table';
export type { TableProps, Column, Tone, MobileSlot } from './components/Table/Table';
export { Pagination } from './components/Pagination';
export type { PaginationProps } from './components/Pagination/Pagination';
export { Tabs } from './components/Tabs';
export type { TabsProps } from './components/Tabs/Tabs';
export { DatePicker } from './components/DatePicker';
export type { DatePickerProps } from './components/DatePicker/DatePicker';
export { Calendar } from './components/DatePicker';
export type { CalendarProps } from './components/DatePicker/Calendar';
export { DateRangePicker } from './components/DateRangePicker';
export type { DateRangePickerProps, DateRange } from './components/DateRangePicker/DateRangePicker';
export { Expander } from './components/Expander';
export type { ExpanderProps } from './components/Expander/Expander';
export { FileUpload } from './components/FileUpload';
export type { FileUploadProps, FileUploadFile, ValidationError } from './components/FileUpload/types';

// Layout primitives
export { SafeAreaView } from './components/layout/SafeAreaView';
export type { SafeAreaViewProps, SafeAreaEdge } from './components/layout/SafeAreaView';
export { StickyFooter } from './components/layout/StickyFooter';
export type { StickyFooterProps } from './components/layout/StickyFooter';
export { KeyboardAvoidingView } from './components/layout/KeyboardAvoidingView';
export type { KeyboardAvoidingViewProps } from './components/layout/KeyboardAvoidingView';

export { Stack, HStack, VStack } from './components/layout/Stack';
export type { StackProps, HStackProps, VStackProps, StackGap } from './components/layout/Stack';
export { Grid, GridItem } from './components/layout/Grid';
export type { GridProps, GridItemProps, GridResponsiveColumns, GridGap } from './components/layout/Grid';
export { Divider } from './components/layout/Divider';
export type { DividerProps } from './components/layout/Divider';

// Feedback & status
export { Skeleton } from './components/Skeleton';
export type { SkeletonProps } from './components/Skeleton';
export { Spinner } from './components/Spinner';
export type { SpinnerProps } from './components/Spinner';
export { Banner } from './components/Banner';
export type { BannerProps } from './components/Banner';
export { EmptyState } from './components/EmptyState';
export type { EmptyStateProps } from './components/EmptyState';
export { StatusDot } from './components/StatusDot';
export type { StatusDotProps } from './components/StatusDot';

// Form building blocks
export { VisuallyHidden } from './components/VisuallyHidden';
export type { VisuallyHiddenProps } from './components/VisuallyHidden';
export { Field, fieldSurfaceClassName } from './components/Field';
export type { FieldProps, FieldControlProps, FieldMeta, FieldSurfaceOptions } from './components/Field';
export { NumberInput } from './components/NumberInput';
export type { NumberInputProps } from './components/NumberInput';
export { Combobox } from './components/Combobox';
export type { ComboboxProps, ComboboxOption } from './components/Combobox';
export { TimeInput } from './components/TimeInput';
export type { TimeInputProps } from './components/TimeInput';

// Overlay & navigation
export { Popover } from './components/Popover';
export type { PopoverProps } from './components/Popover';
export { Drawer } from './components/Drawer';
export type { DrawerProps } from './components/Drawer';
export { BottomNav } from './components/BottomNav';
export type { BottomNavProps, BottomNavItem } from './components/BottomNav';
export { Stepper } from './components/Stepper';
export type { StepperProps, StepperStepProps } from './components/Stepper';
export { Breadcrumbs } from './components/Breadcrumbs';
export type { BreadcrumbsProps, BreadcrumbsItemProps } from './components/Breadcrumbs';

// Mobile-first components
export { BottomSheet } from './components/BottomSheet';
export type { BottomSheetProps } from './components/BottomSheet';
export { ActionSheet } from './components/ActionSheet';
export type { ActionSheetProps, ActionSheetAction } from './components/ActionSheet';
export { SegmentedControl } from './components/SegmentedControl';
export type { SegmentedControlProps, SegmentedControlOption } from './components/SegmentedControl';
