"use server";

import { redirect } from "next/navigation";
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

  return {};
}
