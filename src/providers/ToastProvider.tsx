import {
  createContext,
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Toast, type ToastVariant } from '../components/Toast';
import styles from '../components/Toast/Toast.module.css';
import { useVisualViewport } from '../hooks/touch/useVisualViewport';

export type ToastPosition =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'bottom-center';

export interface ToastData {
  id: string;
  variant: ToastVariant;
  message: string;
  description?: string;
  duration?: number;
  showProgress?: boolean;
}

export interface ToastContextValue {
  toast: (data: Omit<ToastData, 'id'>) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

interface ToastProviderProps {
  /** Position of the toast container (default: 'top-right') */
  position?: ToastPosition;
  /** Maximum number of toasts shown at once. The oldest is dropped first. Default 5. */
  max?: number;
  /** Children */
  children: ReactNode;
}

const positionClassMap: Record<ToastPosition, string> = {
  'top-right': styles.topRight,
  'top-left': styles.topLeft,
  'top-center': styles.topCenter,
  'bottom-right': styles.bottomRight,
  'bottom-left': styles.bottomLeft,
  'bottom-center': styles.bottomCenter,
};

export function ToastProvider({
  position = 'top-right',
  max = 5,
  children,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const toastCounter = useRef(0);
  const { keyboardOpen, height } = useVisualViewport();

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const toast = useCallback(
    (data: Omit<ToastData, 'id'>) => {
      const id = `toast-${++toastCounter.current}`;
      setToasts((prev) => [...prev, { ...data, id }].slice(-Math.max(1, max)));
      return id;
    },
    [max],
  );

  // 소비자(useToast)가 뷰포트 변화마다 다시 그려지지 않도록 값을 고정한다.
  const contextValue = useMemo(() => ({ toast, dismiss, dismissAll }), [toast, dismiss, dismissAll]);

  const containerClass = [styles.container, positionClassMap[position]]
    .filter(Boolean)
    .join(' ');

  const isBottomPosition = position.startsWith('bottom');
  const keyboardOffset =
    keyboardOpen && typeof window !== 'undefined' && isBottomPosition
      ? window.innerHeight - height
      : 0;

  // transform 을 쓰면 bottom-center 의 가운데 정렬(translateX(-50%))을 덮어쓴다.
  const containerStyle = {
    bottom: keyboardOffset || undefined,
    transition: 'bottom var(--tui-duration-base) var(--tui-ease-out)',
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          // 모달이 배경을 비활성화할 때 이 영역은 건너뛴다(backgroundInert.ts).
          // 모달 안에서 띄운 알림도 읽히고 닫을 수 있어야 한다.
          <div className={containerClass} style={containerStyle} data-tui-toast-root="">
            {toasts.map((t) => (
              <Toast
                key={t.id}
                id={t.id}
                variant={t.variant}
                message={t.message}
                description={t.description}
                duration={t.duration}
                showProgress={t.showProgress}
                onClose={() => dismiss(t.id)}
              />
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}
