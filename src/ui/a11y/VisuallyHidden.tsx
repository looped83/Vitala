import type { ReactNode } from 'react';

/**
 * Renders content that is visually hidden but available to screen readers.
 * Used for labels/announcements that would be redundant visually.
 */
export function VisuallyHidden({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <span
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {children}
    </span>
  );
}
