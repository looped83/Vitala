/**
 * Theme resolution – framework-free so it can be unit tested and reused by the
 * inline boot script in index.html (which must run before React to avoid a
 * flash of the wrong theme). Keep STORAGE_KEY in sync with index.html.
 * See docs/design-system-implementation.md.
 */
export type ThemeChoice = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'vitala.theme';

const THEME_CHOICES: readonly ThemeChoice[] = ['system', 'light', 'dark'];

export function isThemeChoice(value: unknown): value is ThemeChoice {
  return typeof value === 'string' && (THEME_CHOICES as readonly string[]).includes(value);
}

/** Coerce arbitrary stored input into a valid choice (defaults to `system`). */
export function parseThemeChoice(value: unknown): ThemeChoice {
  return isThemeChoice(value) ? value : 'system';
}

/** Resolve a user's choice to a concrete light/dark theme. */
export function resolveTheme(choice: ThemeChoice, systemPrefersDark: boolean): ResolvedTheme {
  if (choice === 'system') {
    return systemPrefersDark ? 'dark' : 'light';
  }
  return choice;
}
