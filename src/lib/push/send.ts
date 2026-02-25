import webpush from "web-push";
import { env } from "@/env";
import { createClient } from "@/lib/supabase/server";

webpush.setVapidDetails(
  "mailto:admin@kkweb.io",
  env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  env.VAPID_PRIVATE_KEY,
);

type PushPayload = {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
};

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  const supabase = await createClient();

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subscriptions || subscriptions.length === 0) return;

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/icon-192.png",
    badge: payload.badge || "/icon-192.png",
    url: payload.url || "/",
  });

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        notificationPayload,
      ),
    ),
  );

  // 期限切れ subscription を自動削除
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "rejected") {
      const error = result.reason as { statusCode?: number };
      if (error.statusCode === 410 || error.statusCode === 404) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", subscriptions[i].endpoint)
          .eq("user_id", userId);
      }
    }
  }
}
