"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { searchLinkIdSchema } from "./schema";

export type SearchResult = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  linkId: string;
  requestStatus?: string;
};

export type SearchState = {
  error?: string;
  result?: SearchResult;
};

export async function searchByLinkId(
  _prevState: SearchState,
  formData: FormData,
): Promise<SearchState> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    redirect("/login");
  }

  const parsed = searchLinkIdSchema.safeParse({
    linkId: formData.get("linkId"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "入力内容を確認してください",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, link_id")
    .eq("link_id", parsed.data.linkId)
    .neq("id", user.sub)
    .single();

  if (!profile) {
    return { error: "ユーザーが見つかりませんでした" };
  }

  // 既存のフレンドリクエストを確認
  const { data: existingRequest } = await supabase
    .from("friend_requests")
    .select("status")
    .or(
      `and(sender_id.eq.${user.sub},receiver_id.eq.${profile.id}),and(sender_id.eq.${profile.id},receiver_id.eq.${user.sub})`,
    )
    .limit(1)
    .single();

  return {
    result: {
      id: profile.id,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
      linkId: profile.link_id,
      requestStatus: existingRequest?.status,
    },
  };
}

export async function sendFriendRequest(receiverId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.from("friend_requests").insert({
    sender_id: user.sub,
    receiver_id: receiverId,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "既にリクエストを送信済みです" };
    }
    return { error: "リクエストの送信に失敗しました" };
  }

  revalidatePath("/friends");
  return {};
}

export async function acceptFriendRequest(requestId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    redirect("/login");
  }

  // リクエストを承認
  const { data: request, error: updateError } = await supabase
    .from("friend_requests")
    .update({ status: "accepted" })
    .eq("id", requestId)
    .eq("receiver_id", user.sub)
    .eq("status", "pending")
    .select("sender_id")
    .single();

  if (updateError || !request) {
    return { error: "リクエストの承認に失敗しました" };
  }

  // 1:1 会話を作成
  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .insert({})
    .select("id")
    .single();

  if (convError || !conversation) {
    return { error: "会話の作成に失敗しました" };
  }

  // 参加者を追加
  const { error: partError } = await supabase.from("conversation_participants").insert([
    { conversation_id: conversation.id, user_id: user.sub },
    { conversation_id: conversation.id, user_id: request.sender_id },
  ]);

  if (partError) {
    return { error: "会話の作成に失敗しました" };
  }

  revalidatePath("/friends");
  return {};
}

export async function rejectFriendRequest(requestId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("friend_requests")
    .update({ status: "rejected" })
    .eq("id", requestId)
    .eq("receiver_id", user.sub)
    .eq("status", "pending");

  if (error) {
    return { error: "リクエストの拒否に失敗しました" };
  }

  revalidatePath("/friends");
  return {};
}
