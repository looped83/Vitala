import { cn } from '@/ui/cn';
import styles from './Avatar.module.css';

export interface AvatarProps {
  /** Full display name — used to derive initials and the accessible label. */
  name: string;
  /** Explicit initials override (max 2 chars). */
  initials?: string;
  /** Accent colour token value, e.g. from a life-area or profile accent. */
  accentColor?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/** Derive up to two uppercase initials from a display name. */
// eslint-disable-next-line react-refresh/only-export-components -- pure helper beside its component
export function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) {
    return (parts[0] ?? '').slice(0, 2).toUpperCase();
  }
  const first = parts[0]?.[0] ?? '';
  const last = parts[parts.length - 1]?.[0] ?? '';
  return (first + last).toUpperCase();
}

/** Initials-based avatar (no image upload in V1, design-system §13). */
export function Avatar({
  name,
  initials,
  accentColor,
  size = 'md',
  className,
}: AvatarProps): React.JSX.Element {
  const text = (initials ?? deriveInitials(name)).slice(0, 2);
  return (
    <span
      className={cn(styles.avatar, styles[size], className)}
      style={accentColor ? { backgroundColor: accentColor } : undefined}
      role="img"
      aria-label={name}
    >
      <span aria-hidden="true">{text}</span>
    </span>
  );
}
