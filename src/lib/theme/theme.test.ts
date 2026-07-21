import { describe, expect, it } from 'vitest';
import { isThemeChoice, parseThemeChoice, resolveTheme } from './theme';

describe('parseThemeChoice', () => {
  it('accepts valid choices', () => {
    expect(parseThemeChoice('light')).toBe('light');
    expect(parseThemeChoice('dark')).toBe('dark');
    expect(parseThemeChoice('system')).toBe('system');
  });

  it('defaults unknown values to system', () => {
    expect(parseThemeChoice('purple')).toBe('system');
    expect(parseThemeChoice(null)).toBe('system');
    expect(parseThemeChoice(undefined)).toBe('system');
  });
});

describe('isThemeChoice', () => {
  it('narrows valid strings', () => {
    expect(isThemeChoice('light')).toBe(true);
    expect(isThemeChoice('x')).toBe(false);
    expect(isThemeChoice(1)).toBe(false);
  });
});

describe('resolveTheme', () => {
  it('resolves explicit choices directly', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('resolves system from the OS preference', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });
});
