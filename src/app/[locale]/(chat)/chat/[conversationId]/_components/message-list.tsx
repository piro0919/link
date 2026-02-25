"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { markAsRead } from "../actions";

type Message = {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
};

type MessageListProps = {
  conversationId: string;
  currentUserId: string;
  initialMessages: Message[];
};

export function MessageList({
  conversationId,
  currentUserId,
  initialMessages,
}: MessageListProps): ReactNode {
  const t = useTranslations("Chat");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 自動スクロール（メッセージ追加時にスクロール）
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg: Message = {
            id: payload.new.id,
            senderId: payload.new.sender_id,
            content: payload.new.content,
            createdAt: payload.new.created_at,
            readAt: payload.new.read_at,
          };
          setMessages((prev) => {
            // 重複防止
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // 相手のメッセージをリアルタイム受信時に即既読
          if (newMsg.senderId !== currentUserId) {
            markAsRead(conversationId);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === payload.new.id ? { ...m, readAt: payload.new.read_at } : m)),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">{t("empty")}</p>
      </div>
    );
  }

  // 自分の最後の既読メッセージのインデックスを取得（LINE準拠）
  const lastReadOwnMsgIndex = messages.findLastIndex(
    (m) => m.senderId === currentUserId && m.readAt !== null,
  );

  return (
    <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
      {messages.map((msg, index) => {
        const isOwn = msg.senderId === currentUserId;
        const showRead = isOwn && index === lastReadOwnMsgIndex;
        return (
          <div
            key={msg.id}
            className={cn(
              "flex flex-col max-w-[80%]",
              isOwn ? "self-end items-end" : "self-start items-start",
            )}
          >
            <div
              className={cn(
                "rounded-2xl px-3 py-2 text-sm",
                isOwn ? "bg-primary text-primary-foreground" : "bg-muted",
              )}
            >
              {msg.content}
            </div>
            <div className="mt-0.5 flex items-center gap-1">
              {showRead && <span className="text-[10px] text-muted-foreground">{t("read")}</span>}
              <span className="text-[10px] text-muted-foreground">
                {new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
