import { z } from 'zod';

/**
 * Validated, typed access to build-time environment variables.
 *
 * All values come from Vite's `import.meta.env` (prefix `VITE_`). Validation
 * runs once at module load; a missing or malformed variable fails fast with a
 * human-readable message instead of surfacing as a confusing runtime error
 * deep inside the app. See docs/environment-variables.md.
 */
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL muss eine gültige URL sein.'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'VITE_SUPABASE_ANON_KEY darf nicht leer sein.'),
  VITE_APP_ENV: z.enum(['development', 'test', 'production']).default('development'),
  VITE_APP_BASE_PATH: z.string().default('/'),
  VITE_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type AppEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  appEnv: 'development' | 'test' | 'production';
  basePath: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  isProduction: boolean;
  isDevelopment: boolean;
};

/**
 * Parse and normalize the environment. Throwing here (rather than returning a
 * Result) is deliberate: without a Supabase URL/key the app cannot function,
 * so we surface the misconfiguration immediately at startup.
 */
export function parseEnv(raw: Record<string, unknown>): AppEnv {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `Ungültige oder fehlende Umgebungsvariablen:\n${issues}\n` +
        'Bitte .env anhand von .env.example vervollständigen (siehe docs/environment-variables.md).',
    );
  }

  const data = result.data;
  return {
    supabaseUrl: data.VITE_SUPABASE_URL,
    supabaseAnonKey: data.VITE_SUPABASE_ANON_KEY,
    appEnv: data.VITE_APP_ENV,
    basePath: data.VITE_APP_BASE_PATH,
    logLevel: data.VITE_LOG_LEVEL,
    isProduction: data.VITE_APP_ENV === 'production',
    isDevelopment: data.VITE_APP_ENV === 'development',
  };
}

export const env: AppEnv = parseEnv(import.meta.env);
