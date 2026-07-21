import { useCallback } from 'react';
import { useUiStore } from '@/app/stores/uiStore';
import { useAuth } from '@/app/providers/AuthProvider';
import { useMyPreferences, useUpdatePreferences } from '@/features/profile/queries';
import type { ThemeChoice } from '@/lib/theme/theme';

interface ThemePreferenceApi {
  themeChoice: ThemeChoice;
  reducedMotion: boolean;
  setThemeChoice: (choice: ThemeChoice) => void;
  setReducedMotion: (value: boolean) => void;
}

/**
 * Bridges the local UI store (immediate, flash-free) with the persisted server
 * preference. Setters update the store instantly and, when signed in, persist
 * to user_preferences so the choice follows the user across devices. Server
 * write failures are non-fatal — the local UI still reflects the choice.
 */
export function useThemePreference(): ThemePreferenceApi {
  const { status } = useAuth();
  const themeChoice = useUiStore((state) => state.themeChoice);
  const reducedMotion = useUiStore((state) => state.reducedMotion);
  const setStoreTheme = useUiStore((state) => state.setThemeChoice);
  const setStoreReducedMotion = useUiStore((state) => state.setReducedMotion);
  const { data: preferences } = useMyPreferences();
  const updatePreferences = useUpdatePreferences();

  const persist = useCallback(
    (next: { theme: ThemeChoice; reducedMotion: boolean }) => {
      if (status !== 'authenticated') return;
      updatePreferences.mutate({
        theme: next.theme,
        reduced_motion: next.reducedMotion,
        locale: preferences?.locale === 'de' ? 'de' : 'de',
      });
    },
    [status, updatePreferences, preferences?.locale],
  );

  const setThemeChoice = useCallback(
    (choice: ThemeChoice) => {
      setStoreTheme(choice);
      persist({ theme: choice, reducedMotion });
    },
    [setStoreTheme, persist, reducedMotion],
  );

  const setReducedMotion = useCallback(
    (value: boolean) => {
      setStoreReducedMotion(value);
      persist({ theme: themeChoice, reducedMotion: value });
    },
    [setStoreReducedMotion, persist, themeChoice],
  );

  return { themeChoice, reducedMotion, setThemeChoice, setReducedMotion };
}
