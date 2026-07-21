/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * GitHub Pages (and any sub-path host) serves the SPA under a base path such as
 * `/Vitala/`. Copy the built index.html to 404.html so deep links / reloads
 * (e.g. `/Vitala/today`) boot the app and let React Router handle the route.
 */
function spaFallbackPlugin(): Plugin {
  return {
    name: 'vitala-spa-404-fallback',
    apply: 'build',
    async closeBundle() {
      const { copyFile } = await import('node:fs/promises');
      const outDir = fileURLToPath(new URL('./dist', import.meta.url));
      try {
        await copyFile(`${outDir}/index.html`, `${outDir}/404.html`);
      } catch {
        // index.html not present (e.g. library build) — nothing to copy.
      }
    },
  };
}

// See docs/pwa-strategy.md (caching) and docs/deployment-github-pages.md (base).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Normalize to a leading-and-trailing-slash base, e.g. "/Vitala/" or "/".
  const raw = env.VITE_APP_BASE_PATH?.trim() || '/';
  const base = `/${raw.replace(/^\/+|\/+$/g, '')}/`.replace(/^\/\/$/, '/');

  return {
    base,
    plugins: [
      react(),
      spaFallbackPlugin(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: null,
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,woff2,webmanifest}'],
          navigateFallback: `${base}index.html`,
          navigateFallbackDenylist: [/^\/auth/, /supabase/],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.endsWith('.woff2'),
              handler: 'CacheFirst',
              options: {
                cacheName: 'vitala-fonts',
                expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
          ],
        },
        manifest: {
          name: 'Vitala',
          short_name: 'Vitala',
          description: 'Kooperative Gamification-App für gesunde, nachhaltige Rituale zu zweit.',
          lang: 'de',
          // Sub-path aware: resolved against the manifest location (base).
          start_url: base,
          scope: base,
          display: 'standalone',
          orientation: 'portrait',
          theme_color: '#2F6F4E',
          background_color: '#F7F5F0',
          icons: [
            { src: 'icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
            { src: 'icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
            {
              src: 'icons/maskable-512.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'maskable',
            },
          ],
        },
        devOptions: { enabled: false },
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      target: 'es2022',
      sourcemap: false,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: false,
      // Deterministic, non-secret env for unit/component tests (no live backend).
      env: {
        VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
        VITE_SUPABASE_ANON_KEY: 'test-anon-key',
        VITE_APP_ENV: 'test',
        VITE_LOG_LEVEL: 'error',
      },
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      exclude: ['e2e/**', 'node_modules/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        include: ['src/domain/**', 'src/lib/**', 'src/data/**'],
        exclude: ['**/*.test.*', '**/index.ts', 'src/data/supabase/database.types.ts'],
      },
    },
  };
});
