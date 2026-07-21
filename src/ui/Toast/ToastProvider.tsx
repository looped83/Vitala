import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Icon } from '@/ui/Icon/Icon';
import { IconButton } from '@/ui/Button/IconButton';
import { cn } from '@/ui/cn';
import styles from './Toast.module.css';

export type ToastTone = 'success' | 'info' | 'attention';

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastApi {
  show: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const TONE_ICON = { success: 'check', info: 'info', attention: 'error' } as const;

/**
 * Lightweight toast/status system. Messages are mirrored into an `aria-live`
 * region so screen readers announce them (accessibility §19.3). Errors use a
 * polite live region too — we never rely on colour alone (icon + text).
 */
export function ToastProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, tone, message }]);
      window.setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={styles.region} role="region" aria-label="Benachrichtigungen">
        <ol className={styles.list} aria-live="polite" aria-relevant="additions">
          {toasts.map((toast) => (
            <li key={toast.id} className={cn(styles.toast, styles[toast.tone])}>
              <span className={styles.icon} aria-hidden="true">
                <Icon name={TONE_ICON[toast.tone]} size={18} />
              </span>
              <span className={styles.message}>{toast.message}</span>
              <IconButton
                label="Benachrichtigung schließen"
                icon={<Icon name="close" size={16} />}
                onClick={() => dismiss(toast.id)}
              />
            </li>
          ))}
        </ol>
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook co-located with its provider
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast muss innerhalb von <ToastProvider> verwendet werden.');
  }
  return ctx;
}
