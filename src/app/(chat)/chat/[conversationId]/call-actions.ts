"use server";

import { nowInSec, SkyWayAuthToken, uuidV4 } from "@skyway-sdk/token";
import { redirect } from "next/navigation";
import { env } from "@/env";
import { sendPushToUser } from "@/lib/push/send";
import { createClient } from "@/lib/supabase/server";

export async function generateSkyWayToken(
  conversationId: string,
  callSessionId: string,
): Promise<{ token: string; error?: never } | { token?: never; error: string }> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    redirect("/login");
  }

  const { data: participant } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.sub)
    .single();

  if (!participant) {
    return { error: "この会話に参加していません" };
  }

  const roomName = `call_${conversationId}_${callSessionId}`;

  const token = new SkyWayAuthToken({
    jti: uuidV4(),
    iat: nowInSec(),
    exp: nowInSec() + 60 * 60,
    scope: {
      app: {
        id: env.NEXT_PUBLIC_SKYWAY_APP_ID,
        turn: true,
        actions: ["read"],
        channels: [
          {
            name: roomName,
            actions: ["write"],
            members: [
              {
                name: user.sub,
                actions: ["write"],
                publication: { actions: ["write"] },
                subscription: { actions: ["write"] },
              },
            ],
          },
        ],
      },
    },
  }).encode(env.SKYWAY_SECRET_KEY);

  return { token };
}

export async function startCall(
  conversationId: string,
  callType: "audio" | "video",
): Promise<{ callSessionId: string; error?: never } | { callSessionId?: never; error: string }> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    redirect("/login");
  }

  const { data: otherParticipant } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .neq("user_id", user.sub)
    .single();

  if (!otherParticipant) {
    return { error: "通話相手が見つかりません" };
  }

  // アクティブな通話がないか確認
  const { data: activeCall } = await supabase
    .from("call_sessions")
    .select("id")
    .eq("conversation_id", conversationId)
    .in("status", ["ringing", "accepted"])
    .limit(1)
    .maybeSingle();

  if (activeCall) {
    return { error: "既に通話中です" };
  }

  const { data: callSession, error } = await supabase
    .from("call_sessions")
    .insert({
      conversation_id: conversationId,
      caller_id: user.sub,
      callee_id: otherParticipant.user_id,
      call_type: callType,
      status: "ringing",
    })
    .select("id")
    .single();

  if (error || !callSession) {
    return { error: "通話の開始に失敗しました" };
  }

  // 着信プッシュ通知（fire-and-forget）
  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.sub)
    .single();

  const callTypeLabel = callType === "video" ? "ビデオ通話" : "音声通話";
  sendPushToUser(otherParticipant.user_id, {
    title: `${callerProfile?.display_name ?? "Link"} からの${callTypeLabel}`,
    body: "タップして応答",
    url: `/chat/${conversationId}`,
  }).catch(() => {});

  return { callSessionId: callSession.id };
}

export async function answerCall(callSessionId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("call_sessions")
    .update({ status: "accepted", started_at: new Date().toISOString() })
    .eq("id", callSessionId)
    .eq("callee_id", user.sub)
    .eq("status", "ringing");

  if (error) {
    return { error: "通話の応答に失敗しました" };
  }

  return {};
}

export async function rejectCall(callSessionId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("call_sessions")
    .update({ status: "rejected", ended_at: new Date().toISOString() })
    .eq("id", callSessionId)
    .eq("callee_id", user.sub)
    .eq("status", "ringing");

  if (error) {
    return { error: "通話の拒否に失敗しました" };
  }

  return {};
}

export async function endCall(callSessionId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("call_sessions")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("id", callSessionId)
    .or(`caller_id.eq.${user.sub},callee_id.eq.${user.sub}`);

  if (error) {
    return { error: "通話の終了に失敗しました" };
  }

  return {};
}
