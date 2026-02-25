"use server";

import { redirect } from "next/navigation";
import { sendPushToUser } from "@/lib/push/send";
import { createClient } from "@/lib/supabase/server";

export async function sendMessage(
  conversationId: string,
  content: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    redirect("/login");
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return { error: "メッセージを入力してください" };
  }

  const { error: msgError } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.sub,
    content: trimmed,
  });

  if (msgError) {
    return { error: "メッセージの送信に失敗しました" };
  }

  // conversations.updated_at を更新（ソート用）
  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  // プッシュ通知（fire-and-forget）
  const { data: otherParticipant } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .neq("user_id", user.sub)
    .single();

  if (otherParticipant) {
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.sub)
      .single();

    sendPushToUser(otherParticipant.user_id, {
      title: senderProfile?.display_name ?? "Link",
      body: trimmed.length > 100 ? `${trimmed.slice(0, 100)}...` : trimmed,
      url: `/chat/${conversationId}`,
    }).catch(() => {});
  }

  return {};
}

export async function markAsRead(conversationId: string): Promise<void> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    redirect("/login");
  }

  // 相手からの未読メッセージを一括既読にする
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.sub)
    .is("read_at", null);
}
