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

// Push notification handler
self.addEventListener("push", (event) => {
  const promiseChain = (async (): Promise<void> => {
    if (!event.data) {
      await self.registration.showNotification("Link", {
        badge: "/icon-192.png",
        body: "You have a new notification",
        icon: "/icon-192.png",
      });
      return;
    }

    try {
      const data = event.data.json() as {
        badge?: string;
        body: string;
        icon?: string;
        title: string;
        url?: string;
      };

      await self.registration.showNotification(data.title, {
        badge: data.badge || "/icon-192.png",
        body: data.body,
        data: { url: data.url || "/" },
        icon: data.icon || "/icon-192.png",
      });
    } catch {
      await self.registration.showNotification("Link", {
        badge: "/icon-192.png",
        body: "You have a new message",
        icon: "/icon-192.png",
      });
    }
  })();

  event.waitUntil(promiseChain);
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = (event.notification.data?.url as string) || "/";

  event.waitUntil(
    self.clients.matchAll({ includeUncontrolled: true, type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
      return undefined;
    }),
  );
});
