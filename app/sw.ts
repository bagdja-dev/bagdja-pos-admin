import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * Precache app-shell (JS/CSS/static assets) + `defaultCache` bawaan Serwist
 * (network-first untuk halaman, cache-first untuk font/gambar/statis).
 * SENGAJA tidak menambah caching khusus untuk panggilan API (`/api/proxy/*`)
 * — dashboard ini bukan app offline-first (beda dari Bagdja POS Lite), jadi
 * data selalu ditarik live; service worker ini murni untuk installability
 * (ikon di home screen, buka tanpa address bar) dan asset statis lebih cepat
 * dimuat ulang, bukan untuk kerja tanpa internet.
 */
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
