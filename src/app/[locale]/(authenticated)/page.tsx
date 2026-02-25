import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Home");
  return { title: t("title") };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<ReactNode> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
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
        <h1 className="text-xl font-bold">{t("title")}</h1>
        <p className="py-8 text-center text-muted-foreground">{t("empty")}</p>
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

  // 未読数を取得
  const { data: unreadCounts } = await supabase.rpc("get_unread_counts");
  const unreadMap = new Map<string, number>();
  for (const row of unreadCounts ?? []) {
    unreadMap.set(row.conversation_id, Number(row.unread_count));
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

  const currentLocale = await getLocale();
  const dateLocale = currentLocale === "ja" ? "ja-JP" : "en-US";

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString(dateLocale, { month: "short", day: "numeric" });
  }

  return (
    <div className="flex flex-col gap-2 p-4">
      <h1 className="text-xl font-bold">{t("title")}</h1>
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
                <div className="flex items-center gap-2">
                  {latest && (
                    <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                      {latest.content}
                    </p>
                  )}
                  {(() => {
                    const count = unreadMap.get(conv.id);
                    if (!count) return null;
                    return (
                      <Badge className="flex size-5 shrink-0 items-center justify-center p-0 text-[10px]">
                        {count > 99 ? "99+" : count}
                      </Badge>
                    );
                  })()}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
