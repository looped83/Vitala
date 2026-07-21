import { useEffect, useState } from 'react';
import { useUiStore } from '@/app/stores/uiStore';
import { resolveTheme } from '@/lib/theme/theme';

/**
 * Applies the resolved theme + reduced-motion preference to <html>. Reacts to
 * the store and to the OS `prefers-color-scheme` change when the choice is
 * "system". Renders nothing. Keeps the DOM in sync with the boot script that
 * ran in index.html (design-system §18.5, accessibility §19.8).
 */
export function ThemeController(): null {
  const themeChoice = useUiStore((state) => state.themeChoice);
  const reducedMotion = useUiStore((state) => state.reducedMotion);
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false,
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (event: MediaQueryListEvent): void => setSystemPrefersDark(event.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    const resolved = resolveTheme(themeChoice, systemPrefersDark);
    document.documentElement.setAttribute('data-theme', resolved);
    document.documentElement.style.colorScheme = resolved;
  }, [themeChoice, systemPrefersDark]);

  useEffect(() => {
    document.documentElement.setAttribute('data-reduced-motion', String(reducedMotion));
  }, [reducedMotion]);

  return null;
}
