import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/server";
import { CallButtons } from "./_components/call-buttons";
import { MessageInput } from "./_components/message-input";
import { MessageList } from "./_components/message-list";

type ChatPageProps = {
  params: Promise<{ conversationId: string }>;
};

export default async function ChatPage({ params }: ChatPageProps): Promise<ReactNode> {
  const { conversationId } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    redirect("/login");
  }

  // 自分がこの会話の参加者か確認
  const { data: participant } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.sub)
    .single();

  if (!participant) {
    notFound();
  }

  // 相手のプロフィール取得
  const { data: otherParticipants } = await supabase
    .from("conversation_participants")
    .select("user_id, profile:profiles(display_name, avatar_url)")
    .eq("conversation_id", conversationId)
    .neq("user_id", user.sub);

  const otherUser = otherParticipants?.[0]?.profile;

  // メッセージ取得
  const { data: messagesData } = await supabase
    .from("messages")
    .select("id, sender_id, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  const messages =
    messagesData?.map((m) => ({
      id: m.id,
      senderId: m.sender_id,
      content: m.content,
      createdAt: m.created_at,
    })) ?? [];

  return (
    <div className="flex h-svh flex-col">
      {/* ヘッダー */}
      <header className="flex items-center gap-3 border-b px-3 py-2">
        <Link href="/" className="p-1">
          <ArrowLeft className="size-5" />
        </Link>
        {otherUser && (
          <>
            <Avatar className="size-8">
              <AvatarImage src={otherUser.avatar_url ?? undefined} alt={otherUser.display_name} />
              <AvatarFallback className="text-xs">
                {otherUser.display_name.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{otherUser.display_name}</span>
            <div className="ml-auto">
              <CallButtons
                conversationId={conversationId}
                remoteName={otherUser.display_name}
                remoteAvatarUrl={otherUser.avatar_url}
              />
            </div>
          </>
        )}
      </header>

      {/* メッセージ一覧 */}
      <MessageList
        conversationId={conversationId}
        currentUserId={user.sub}
        initialMessages={messages}
      />

      {/* 入力欄 */}
      <MessageInput conversationId={conversationId} />
    </div>
  );
}
