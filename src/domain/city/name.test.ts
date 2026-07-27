import { describe, expect, it } from 'vitest';
import {
  CITY_NAME_MAX,
  CITY_NAME_MIN,
  DEFAULT_CITY_NAME,
  isValidCityName,
  parseCityName,
} from './name';

describe('city name validation', () => {
  it('accepts a normal name and trims it', () => {
    expect(parseCityName('  Grünstadt  ')).toBe('Grünstadt');
  });

  it('accepts the default name', () => {
    expect(isValidCityName(DEFAULT_CITY_NAME)).toBe(true);
  });

  it('rejects too-short names', () => {
    expect(isValidCityName('a')).toBe(false);
    expect(isValidCityName(' '.repeat(5))).toBe(false);
  });

  it('rejects too-long names', () => {
    expect(isValidCityName('x'.repeat(CITY_NAME_MAX + 1))).toBe(false);
  });

  it('accepts names at the exact bounds', () => {
    expect(isValidCityName('x'.repeat(CITY_NAME_MIN))).toBe(true);
    expect(isValidCityName('x'.repeat(CITY_NAME_MAX))).toBe(true);
  });

  it('rejects markup / angle brackets (XSS guard, §69)', () => {
    expect(isValidCityName('<script>alert(1)</script>')).toBe(false);
    expect(isValidCityName('Stadt <b>')).toBe(false);
  });

  it('throws a ZodError on invalid input', () => {
    expect(() => parseCityName('')).toThrow();
  });
});
