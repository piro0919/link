"use client";

import { Phone, PhoneOff, Video } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useCallback, useTransition } from "react";
import { answerCall, rejectCall } from "@/app/[locale]/(chat)/chat/[conversationId]/call-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useCall } from "./call-context";

export function IncomingCallDialog(): ReactNode {
  const t = useTranslations("Call");
  const { callState, updateCallStatus, clearCall } = useCall();
  const [isPending, startTransition] = useTransition();

  const handleAnswer = useCallback(() => {
    if (!callState) return;
    startTransition(async () => {
      const result = await answerCall(callState.callSessionId);
      if (!result.error) {
        updateCallStatus("accepted");
      }
    });
  }, [callState, updateCallStatus]);

  const handleReject = useCallback(() => {
    if (!callState) return;
    startTransition(async () => {
      await rejectCall(callState.callSessionId);
      clearCall();
    });
  }, [callState, clearCall]);

  // 着信中で callee の場合のみ表示
  if (!callState || callState.role !== "callee" || callState.status !== "ringing") {
    return null;
  }

  const isVideo = callState.callType === "video";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="flex w-72 flex-col items-center gap-6 rounded-2xl bg-zinc-800 px-6 py-8 text-white">
        <Avatar className="size-20">
          <AvatarImage src={callState.remoteAvatarUrl ?? undefined} alt={callState.remoteName} />
          <AvatarFallback className="bg-zinc-700 text-2xl">
            {callState.remoteName.slice(0, 2)}
          </AvatarFallback>
        </Avatar>

        <div className="text-center">
          <p className="text-lg font-medium">{callState.remoteName}</p>
          <div className="mt-1 flex items-center justify-center gap-1 text-sm text-zinc-400">
            {isVideo ? <Video className="size-4" /> : <Phone className="size-4" />}
            {isVideo ? t("videoCall") : t("audioCall")}
          </div>
          <p className="mt-2 animate-pulse text-sm text-zinc-400">{t("incoming")}</p>
        </div>

        <div className="flex gap-8">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-14 rounded-full bg-red-600 hover:bg-red-500"
            onClick={handleReject}
            disabled={isPending}
          >
            <PhoneOff className="size-6" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-14 rounded-full bg-green-600 hover:bg-green-500"
            onClick={handleAnswer}
            disabled={isPending}
          >
            <Phone className="size-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
