"use client";

import { Loader2, Send } from "lucide-react";
import { type ReactNode, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendMessage } from "../actions";

type MessageInputProps = {
  conversationId: string;
};

export function MessageInput({ conversationId }: MessageInputProps): ReactNode {
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(): void {
    const trimmed = value.trim();
    if (!trimmed || isPending) return;

    startTransition(async () => {
      const result = await sendMessage(conversationId, trimmed);
      if (!result.error) {
        setValue("");
        textareaRef.current?.focus();
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent): void {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="flex items-end gap-2 border-t bg-background p-3">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="メッセージを入力..."
        rows={1}
        className="min-h-10 max-h-32 resize-none"
      />
      <Button
        size="icon"
        onClick={handleSubmit}
        disabled={isPending || !value.trim()}
        className="shrink-0"
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
      </Button>
    </div>
  );
}
