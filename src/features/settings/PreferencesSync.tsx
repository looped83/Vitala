import { useEffect, useRef } from 'react';
import { useMyPreferences } from '@/features/profile/queries';
import { useUiStore } from '@/app/stores/uiStore';
import { isThemeChoice } from '@/lib/theme/theme';

/**
 * One-way sync: when the signed-in user's saved preferences load, apply them to
 * the local UI store (theme + reduced motion) once. Subsequent user changes go
 * through the settings form (which updates both store and server). Renders
 * nothing.
 */
export function PreferencesSync(): null {
  const { data } = useMyPreferences();
  const setThemeChoice = useUiStore((state) => state.setThemeChoice);
  const setReducedMotion = useUiStore((state) => state.setReducedMotion);
  const applied = useRef(false);

  useEffect(() => {
    if (applied.current || !data) return;
    applied.current = true;
    if (isThemeChoice(data.theme)) {
      setThemeChoice(data.theme);
    }
    setReducedMotion(data.reduced_motion);
  }, [data, setThemeChoice, setReducedMotion]);

  return null;
}
