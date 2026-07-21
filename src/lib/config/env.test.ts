import { describe, expect, it } from 'vitest';
import { parseEnv } from './env';

const base = {
  VITE_SUPABASE_URL: 'https://example.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'anon-key',
};

describe('parseEnv', () => {
  it('parses a valid environment with defaults', () => {
    const env = parseEnv(base);
    expect(env.supabaseUrl).toBe('https://example.supabase.co');
    expect(env.appEnv).toBe('development');
    expect(env.basePath).toBe('/');
    expect(env.logLevel).toBe('info');
    expect(env.isDevelopment).toBe(true);
    expect(env.isProduction).toBe(false);
  });

  it('reflects the production flag', () => {
    const env = parseEnv({ ...base, VITE_APP_ENV: 'production' });
    expect(env.isProduction).toBe(true);
    expect(env.isDevelopment).toBe(false);
  });

  it('throws a helpful error when the URL is missing', () => {
    expect(() => parseEnv({ VITE_SUPABASE_ANON_KEY: 'x' })).toThrowError(/Umgebungsvariablen/);
  });

  it('throws when the URL is malformed', () => {
    expect(() => parseEnv({ ...base, VITE_SUPABASE_URL: 'not-a-url' })).toThrowError(
      /VITE_SUPABASE_URL/,
    );
  });

  it('rejects an unknown app environment', () => {
    expect(() => parseEnv({ ...base, VITE_APP_ENV: 'staging' })).toThrow();
  });
});
