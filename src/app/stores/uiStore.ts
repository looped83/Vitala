import { create } from 'zustand';
import { parseThemeChoice, THEME_STORAGE_KEY } from '@/lib/theme/theme';
import type { ThemeChoice } from '@/lib/theme/theme';

/**
 * Minimal Zustand store for *local UI state only* (ADR-0007). It never mirrors
 * server data. Persisted preferences (theme, reduced motion) are also written
 * to plain localStorage keys so the inline boot script in index.html can apply
 * the theme before React mounts (flash-free).
 */
const REDUCED_MOTION_STORAGE_KEY = 'vitala.reduced-motion';

function readInitialTheme(): ThemeChoice {
  if (typeof localStorage === 'undefined') return 'system';
  return parseThemeChoice(localStorage.getItem(THEME_STORAGE_KEY));
}

function readInitialReducedMotion(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(REDUCED_MOTION_STORAGE_KEY) === 'true';
}

interface UiState {
  themeChoice: ThemeChoice;
  reducedMotion: boolean;
  mobileNavOpen: boolean;
  setThemeChoice: (choice: ThemeChoice) => void;
  setReducedMotion: (value: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  themeChoice: readInitialTheme(),
  reducedMotion: readInitialReducedMotion(),
  mobileNavOpen: false,
  setThemeChoice: (choice) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, choice);
    } catch {
      // Ignore storage failures (private mode); state still updates in memory.
    }
    set({ themeChoice: choice });
  },
  setReducedMotion: (value) => {
    try {
      localStorage.setItem(REDUCED_MOTION_STORAGE_KEY, String(value));
    } catch {
      // Ignore storage failures.
    }
    set({ reducedMotion: value });
  },
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
}));
