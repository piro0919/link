/// <reference lib="webworker" />

import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";
import { CacheFirst, NetworkFirst, Serwist, StaleWhileRevalidate } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const customRuntimeCaching: RuntimeCaching[] = [
  // Google Fonts stylesheets
  {
    handler: new CacheFirst({
      cacheName: "google-fonts-stylesheets",
    }),
    matcher: /^https:\/\/fonts\.googleapis\.com\/.*/i,
  },
  // Google Fonts webfonts
  {
    handler: new CacheFirst({
      cacheName: "google-fonts-webfonts",
    }),
    matcher: /^https:\/\/fonts\.gstatic\.com\/.*/i,
  },
  // Images (avatars, etc.)
  {
    handler: new CacheFirst({
      cacheName: "images",
    }),
    matcher: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
  },
  // Static assets (JS/CSS bundles)
  {
    handler: new StaleWhileRevalidate({
      cacheName: "static-resources",
    }),
    matcher: /\.(?:js|css)$/i,
  },
  // API routes
  {
    handler: new NetworkFirst({
      cacheName: "api-cache",
      networkTimeoutSeconds: 10,
    }),
    matcher: /\/api\/.*/i,
  },
  ...defaultCache,
];

const serwist = new Serwist({
  clientsClaim: true,
  navigationPreload: true,
  precacheEntries: self.__SW_MANIFEST,
  runtimeCaching: customRuntimeCaching,
  skipWaiting: true,
});

serwist.addEventListeners();
