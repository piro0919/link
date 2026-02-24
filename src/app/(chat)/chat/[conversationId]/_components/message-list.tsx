"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
};

type MessageListProps = {
  conversationId: string;
  currentUserId: string;
  initialMessages: Message[];
};

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

export function MessageList({
  conversationId,
  currentUserId,
  initialMessages,
}: MessageListProps): ReactNode {
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
          };
          setMessages((prev) => {
            // 重複防止
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">メッセージはまだありません</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
      {messages.map((msg) => {
        const isOwn = msg.senderId === currentUserId;
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
            <span className="mt-0.5 text-[10px] text-muted-foreground">
              {formatTime(msg.createdAt)}
            </span>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
