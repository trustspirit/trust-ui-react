import {
  createContext,
  useCallback,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Toast, type ToastVariant } from '../components/Toast';
import styles from '../components/Toast/Toast.module.css';

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
  /** Children */
  children: ReactNode;
}

let toastCounter = 0;

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
  children,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const toast = useCallback(
    (data: Omit<ToastData, 'id'>) => {
      const id = `toast-${++toastCounter}`;
      setToasts((prev) => [...prev, { ...data, id }]);
      return id;
    },
    [],
  );

  const containerClass = [styles.container, positionClassMap[position]]
    .filter(Boolean)
    .join(' ');

  return (
    <ToastContext.Provider value={{ toast, dismiss, dismissAll }}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div className={containerClass}>
            {toasts.map((t) => (
              <Toast
                key={t.id}
                id={t.id}
                variant={t.variant}
                message={t.message}
                description={t.description}
                duration={t.duration}
                onClose={() => dismiss(t.id)}
              />
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}
