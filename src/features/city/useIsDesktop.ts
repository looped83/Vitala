import { useEffect, useState } from 'react';

/**
 * Tracks whether the viewport is at the desktop breakpoint (≥1024px), so the
 * city detail can render as a side panel on desktop and a bottom sheet on
 * mobile (§27/§28). Uses a single matchMedia listener with proper cleanup —
 * no global resize listener (green code §54).
 */
export function useIsDesktop(query = '(min-width: 1024px)'): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const onChange = (): void => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
