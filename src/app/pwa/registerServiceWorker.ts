import { registerSW } from 'virtual:pwa-register';
import { env } from '@/lib/config/env';
import { logger } from '@/lib/logging/logger';

/**
 * Register the PWA service worker with a controlled update strategy. We use
 * `registerType: 'prompt'` (see vite.config.ts): a new version does NOT take
 * over silently — updates are applied on the next controlled reload. This keeps
 * stale auth pages / private responses from being served (docs/pwa-strategy.md).
 * Disabled outside production so dev/test never cache the app shell.
 */
export function registerServiceWorker(): void {
  if (!env.isProduction) return;
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  const updateSW = registerSW({
    onNeedRefresh() {
      // A calm, non-blocking update path: apply on the next load.
      logger.info('pwa_update_available');
    },
    onOfflineReady() {
      logger.info('pwa_offline_ready');
    },
    onRegisteredSW(_swUrl, registration) {
      // Check for updates hourly at most; no aggressive polling.
      if (registration) {
        window.setInterval(() => void registration.update(), 60 * 60 * 1000);
      }
    },
  });

  void updateSW;
}
