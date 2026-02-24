import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "トーク",
};

export default async function HomePage(): Promise<ReactNode> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    redirect("/login");
  }

  // 自分が参加している会話を取得
  const { data: myParticipations } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", user.sub);

  const conversationIds = myParticipations?.map((p) => p.conversation_id) ?? [];

  if (conversationIds.length === 0) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <h1 className="text-xl font-bold">トーク</h1>
        <p className="py-8 text-center text-muted-foreground">
          トークはまだありません。フレンドを追加してメッセージを送りましょう。
        </p>
      </div>
    );
  }

  // 会話の詳細を取得
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, updated_at")
    .in("id", conversationIds)
    .order("updated_at", { ascending: false });

  // 各会話の相手プロフィールと最新メッセージを取得
  const { data: participants } = await supabase
    .from("conversation_participants")
    .select("conversation_id, user_id, profile:profiles(display_name, avatar_url)")
    .in("conversation_id", conversationIds)
    .neq("user_id", user.sub);

  const { data: latestMessages } = await supabase
    .from("messages")
    .select("conversation_id, content, created_at")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false });

  // 会話ごとの最新メッセージ（最初に出現したものが最新）
  const latestMessageMap = new Map<string, { content: string; createdAt: string }>();
  for (const msg of latestMessages ?? []) {
    if (!latestMessageMap.has(msg.conversation_id)) {
      latestMessageMap.set(msg.conversation_id, {
        content: msg.content,
        createdAt: msg.created_at,
      });
    }
  }

  // 会話ごとの相手プロフィール
  const participantMap = new Map<string, { displayName: string; avatarUrl: string | null }>();
  for (const p of participants ?? []) {
    if (p.profile) {
      participantMap.set(p.conversation_id, {
        displayName: p.profile.display_name,
        avatarUrl: p.profile.avatar_url,
      });
    }
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
  }

  return (
    <div className="flex flex-col gap-2 p-4">
      <h1 className="text-xl font-bold">トーク</h1>
      <div className="divide-y">
        {conversations?.map((conv) => {
          const other = participantMap.get(conv.id);
          const latest = latestMessageMap.get(conv.id);
          if (!other) return null;

          return (
            <Link
              key={conv.id}
              href={`/chat/${conv.id}`}
              className="flex items-center gap-3 py-3 hover:bg-accent/50 -mx-2 px-2 rounded-lg transition-colors"
            >
              <Avatar>
                <AvatarImage src={other.avatarUrl ?? undefined} alt={other.displayName} />
                <AvatarFallback>{other.displayName.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium truncate">{other.displayName}</p>
                  {latest && (
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {formatDate(latest.createdAt)}
                    </span>
                  )}
                </div>
                {latest && (
                  <p className="text-sm text-muted-foreground truncate">{latest.content}</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
