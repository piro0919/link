import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/server";
import { AddFriendDialog } from "./_components/add-friend-dialog";
import { FriendRequestList } from "./_components/friend-request-list";

export const metadata: Metadata = {
  title: "フレンド",
};

export default async function FriendsPage(): Promise<ReactNode> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const user = claimsData?.claims;

  if (!user) {
    redirect("/login");
  }

  // 受信したpendingリクエスト
  const { data: pendingRequests } = await supabase
    .from("friend_requests")
    .select(
      "id, sender:profiles!friend_requests_sender_id_fkey(id, display_name, avatar_url, link_id)",
    )
    .eq("receiver_id", user.sub)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  // フレンド一覧（acceptedなリクエストから取得）
  const { data: friendships } = await supabase
    .from("friend_requests")
    .select(
      "id, sender_id, receiver_id, sender:profiles!friend_requests_sender_id_fkey(id, display_name, avatar_url, link_id), receiver:profiles!friend_requests_receiver_id_fkey(id, display_name, avatar_url, link_id)",
    )
    .eq("status", "accepted")
    .or(`sender_id.eq.${user.sub},receiver_id.eq.${user.sub}`)
    .order("updated_at", { ascending: false });

  // 各フレンドの会話IDを取得
  const friends =
    friendships?.map((f) => {
      const friend = f.sender_id === user.sub ? f.receiver : f.sender;
      return friend;
    }) ?? [];

  // フレンドごとの会話IDを取得
  const friendIds = friends.map((f) => f.id);
  const { data: conversations } = await supabase
    .from("conversation_participants")
    .select("conversation_id, user_id")
    .in("user_id", friendIds.length > 0 ? friendIds : ["__none__"]);

  // 自分が参加している会話を取得
  const { data: myConversations } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", user.sub);

  const myConvIds = new Set(myConversations?.map((c) => c.conversation_id) ?? []);

  // フレンドIDから会話IDへのマッピング
  const friendConvMap = new Map<string, string>();
  for (const conv of conversations ?? []) {
    if (myConvIds.has(conv.conversation_id)) {
      friendConvMap.set(conv.user_id, conv.conversation_id);
    }
  }

  const requests =
    pendingRequests?.map((r) => ({
      id: r.id,
      sender: {
        displayName: r.sender.display_name,
        avatarUrl: r.sender.avatar_url,
        linkId: r.sender.link_id,
      },
    })) ?? [];

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">フレンド</h1>
        <AddFriendDialog />
      </div>

      <FriendRequestList requests={requests} />

      {friends.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          フレンドがまだいません。Link IDで検索して追加しましょう。
        </p>
      ) : (
        <div className="divide-y">
          {friends.map((friend) => {
            const convId = friendConvMap.get(friend.id);
            return (
              <Link
                key={friend.id}
                href={convId ? `/chat/${convId}` : "#"}
                className="flex items-center gap-3 py-3 hover:bg-accent/50 -mx-2 px-2 rounded-lg transition-colors"
              >
                <Avatar>
                  <AvatarImage src={friend.avatar_url ?? undefined} alt={friend.display_name} />
                  <AvatarFallback>{friend.display_name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{friend.display_name}</p>
                  <p className="text-sm text-muted-foreground">@{friend.link_id}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
