import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { cn } from '@/ui/cn';
import { IconButton } from '@/ui/Button/IconButton';
import { Icon } from '@/ui/Icon/Icon';
import { useFocusTrap } from '@/ui/hooks/useFocusTrap';
import styles from './Dialog.module.css';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** Disable closing on backdrop click / Escape (e.g. destructive confirm). */
  dismissable?: boolean;
  className?: string;
}

/**
 * Accessible modal dialog: focus trap, focus return on close, Escape to close,
 * accessible name/description via aria-labelledby/-describedby (accessibility
 * §19.2 Dialoge). Rendered in a portal at the document body.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  dismissable = true,
  className,
}: DialogProps): React.JSX.Element | null {
  const panelRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const descriptionId = `${baseId}-description`;

  useFocusTrap(panelRef, open, dismissable ? onClose : undefined);

  // Lock body scroll while open.
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
      <div
        className={styles.backdrop}
        onClick={dismissable ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(styles.panel, className)}
        tabIndex={-1}
      >
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          {dismissable ? (
            <IconButton
              label="Dialog schließen"
              icon={<Icon name="close" size={20} />}
              onClick={onClose}
            />
          ) : null}
        </div>
        {description ? (
          <p id={descriptionId} className={styles.description}>
            {description}
          </p>
        ) : null}
        {children ? <div className={styles.body}>{children}</div> : null}
        {footer ? <div className={styles.footer}>{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
