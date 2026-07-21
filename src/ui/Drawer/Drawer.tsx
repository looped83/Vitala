import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { cn } from '@/ui/cn';
import { IconButton } from '@/ui/Button/IconButton';
import { Icon } from '@/ui/Icon/Icon';
import { useFocusTrap } from '@/ui/hooks/useFocusTrap';
import styles from './Drawer.module.css';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: 'right' | 'bottom';
  children: ReactNode;
  className?: string;
}

/**
 * Slide-in panel / bottom sheet for mobile-first navigation and menus.
 * Same accessibility contract as Dialog (focus trap, Escape, focus return).
 */
export function Drawer({
  open,
  onClose,
  title,
  side = 'right',
  children,
  className,
}: DrawerProps): React.JSX.Element | null {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(panelRef, open, onClose);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(styles.panel, styles[side], className)}
      >
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <IconButton label="Schließen" icon={<Icon name="close" size={20} />} onClick={onClose} />
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
