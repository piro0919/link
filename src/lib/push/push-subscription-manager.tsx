"use client";

import { useEffect } from "react";
import { env } from "@/env";
import { subscribePush } from "@/lib/push/actions";

export function PushSubscriptionManager(): null {
  useEffect(() => {
    async function registerPush(): Promise<void> {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      const registration = await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        });
      }

      const sub = subscription.toJSON();
      if (sub.endpoint && sub.keys?.p256dh && sub.keys?.auth) {
        await subscribePush({
          endpoint: sub.endpoint,
          keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
          expirationTime: sub.expirationTime ?? null,
        });
      }
    }

    registerPush();
  }, []);

  return null;
}
