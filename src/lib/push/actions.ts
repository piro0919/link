"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function subscribePush(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  expirationTime?: number | null;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.sub,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      expiration_time: subscription.expirationTime ?? null,
    },
    { onConflict: "user_id,endpoint" },
  );

  if (error) {
    return { error: "プッシュ通知の登録に失敗しました" };
  }

  return {};
}
