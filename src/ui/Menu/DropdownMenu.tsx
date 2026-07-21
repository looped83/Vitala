import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/ui/cn';
import styles from './DropdownMenu.module.css';

export interface DropdownMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  tone?: 'default' | 'danger';
}

export interface DropdownMenuProps {
  /** Render prop for the trigger; receives props to spread onto a button. */
  trigger: (props: {
    'aria-haspopup': 'menu';
    'aria-expanded': boolean;
    onClick: () => void;
    ref: React.Ref<HTMLButtonElement>;
  }) => ReactNode;
  items: DropdownMenuItem[];
  align?: 'start' | 'end';
  label: string;
}

/**
 * Minimal accessible dropdown menu. Trigger exposes aria-haspopup/-expanded;
 * the menu closes on Escape or outside click and returns focus to the trigger.
 */
export function DropdownMenu({
  trigger,
  items,
  align = 'end',
  label,
}: DropdownMenuProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent): void {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    // Focus the first item when opening via keyboard.
    const first = menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]');
    first?.focus();
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.wrap}>
      {trigger({
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        onClick: () => setOpen((v) => !v),
        ref: triggerRef,
      })}
      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          className={cn(styles.menu, align === 'end' ? styles.end : styles.start)}
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className={cn(styles.item, item.tone === 'danger' && styles.danger)}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
            >
              {item.icon ? (
                <span className={styles.icon} aria-hidden="true">
                  {item.icon}
                </span>
              ) : null}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
